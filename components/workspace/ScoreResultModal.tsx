'use client';

// ==========================================
// Apex Suite: Math Lab - Score Result Modal（採点結果モーダル）
// ==========================================
// 解答送信後に必ず表示される採点結果モーダル。
// 表示順序（優先度順）:
//   ① 正誤判定 + XP獲得（コンパクトなヘッダー行）
//   ② 解法の真髄（Apexガイド） + 🔑 鍵となる公式（画面中央に最も大きく強調表示）
//   ③ ✍️ 自分流のメモとして上書き保存する（patternId で図鑑と一元管理）
//   ④ ⚠️ なぜ間違えたかメモ（失点タグ + 自由記述。ライブラリへ保存）
//   ⑤ 💬 この解説についてAIに質問する（解法メモの添削チップ付き）

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, BookOpenCheck, X, KeyRound, ArrowUpRight, Flame, AlertTriangle, Loader2, Swords } from 'lucide-react';

import type { GeneratedProblem, MistakeTag } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import KaTeXText from './KaTeXText';
import KaTeXBlock from './KaTeXBlock';
import AiSolutionCheckPanel from './AiSolutionCheckPanel';
import CounterChallengeStoryModal from './CounterChallengeStoryModal';
import GoalBackwardTree from './GoalBackwardTree';
import PostSolveAIChat from './PostSolveAIChat';
import { saveCustomSolutionNote } from '@/lib/storage/customSolutionNotesStore';
import { getSolvedProblemRecordById, updateSolvedProblemMistake } from '@/lib/storage/solvedProblemsStore';
import { MISTAKE_TAGS } from '@/lib/engine/mistakeTags';
import { useUserStore } from '@/lib/store/userStore';
import { formatCorrectAnswerForDisplay, ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';
import { useAuthSession } from '@/lib/auth/useAuthSession';
import { signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseNetworkError, SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';
import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';
import { requestRefinedSolutionNote } from '@/lib/api/refineSolutionNoteClient';
import { ENERGY_COST_REFINE_NOTE, formatEnergyShortage } from '@/lib/engine/energyCosts';
import type { CustomSolutionVerifyResult } from '@/types/mathLab';

interface ScoreResultModalProps {
  problem: GeneratedProblem;
  isCorrect: boolean;
  xpResult: XpGainResult;
  userAnswer?: string;
  solvedRecordId?: string;
  solutionNote: string;
  onSolutionNoteChange: (value: string) => void;
  onClose: () => void;
  onNextProblem: () => void;
}

const CONFETTI_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#a78bfa', '#34d399'];

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const distance = 120 + (i % 3) * 40;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export default function ScoreResultModal({
  problem,
  isCorrect,
  xpResult,
  userAnswer = '',
  solvedRecordId,
  solutionNote,
  onSolutionNoteChange,
  onClose,
  onNextProblem,
}: ScoreResultModalProps) {
  const [mistakeTag, setMistakeTag] = useState<MistakeTag | null>(null);
  const [mistakeNote, setMistakeNote] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<CustomSolutionVerifyResult['status'] | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [noteGlow, setNoteGlow] = useState(false);
  const { user, ready: authReady } = useAuthSession();
  const showGuestSignup = isCorrect && authReady && !user;
  const scoredProblem = useMemo(() => ensureProblemHasCorrectAnswer(problem), [problem]);
  const displayedAnswer = formatCorrectAnswerForDisplay(scoredProblem);
  const patternId = scoredProblem.patternId;
  const upsertPatternNote = useUserStore((state) => state.upsertPatternNote);

  useEffect(() => {
    if (!solvedRecordId || isCorrect) return;
    const existing = getSolvedProblemRecordById(solvedRecordId);
    if (!existing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMistakeTag(existing.mistakeTag ?? null);
    setMistakeNote(existing.mistakeNote ?? '');
  }, [solvedRecordId, isCorrect]);

  const handleGoogleSave = async () => {
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      const result = await signInWithGoogleOAuth();
      if (!result.ok) {
        setAuthNotice(result.error);
        setAuthBusy(false);
      }
    } catch (error) {
      console.error('[ScoreResultModal] Google ログインに失敗しました', error);
      if (isSupabaseNetworkError(error)) {
        activateLocalDeveloperFallback();
        setAuthNotice(SUPABASE_BOOTING_HINT);
      }
      setAuthBusy(false);
    }
  };

  const persistMistake = (tag: MistakeTag | null, note: string) => {
    if (!solvedRecordId || isCorrect) return;
    updateSolvedProblemMistake(solvedRecordId, {
      mistakeTag: tag,
      mistakeNote: note,
    });
  };

  const handleToggleMistakeTag = (tag: MistakeTag) => {
    const next = mistakeTag === tag ? null : tag;
    setMistakeTag(next);
    persistMistake(next, mistakeNote);
  };

  const handleSaveMistakeNote = () => {
    persistMistake(mistakeTag, mistakeNote);
    setSaveNotice('失点原因メモをライブラリに保存しました');
    window.setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveNote = () => {
    if (patternId) {
      upsertPatternNote(patternId, solutionNote);
    } else {
      saveCustomSolutionNote(problem.id, solutionNote);
    }
    setSaveNotice(
      patternId
        ? 'このパターンの解法メモとして保存しました（図鑑と同期されます）'
        : 'ローカルストレージに保存しました（ログイン後は自動同期されます）'
    );
    window.setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleRefineNote = async () => {
    if (isRefining) return;
    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      setSaveNotice('ステータスを読み込み中です。少し待ってから再試行してください。');
      window.setTimeout(() => setSaveNotice(null), 3000);
      return;
    }
    if (!store.consumeEnergy(ENERGY_COST_REFINE_NOTE)) {
      setSaveNotice(formatEnergyShortage(ENERGY_COST_REFINE_NOTE, store.energy));
      window.setTimeout(() => setSaveNotice(null), 4000);
      return;
    }

    const aiFeedback = [
      verifyFeedback,
      scoredProblem.explanation.commonMistakes,
    ]
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .join('\n');

    setIsRefining(true);
    try {
      const refinedNote = await requestRefinedSolutionNote({
        originalNote: solutionNote,
        aiFeedback,
        questionText: scoredProblem.questionText,
        keyFormula: scoredProblem.explanation.keyFormula,
        userEmail: user?.email,
      });
      onSolutionNoteChange(refinedNote);
      if (patternId) {
        upsertPatternNote(patternId, refinedNote);
      } else {
        saveCustomSolutionNote(problem.id, refinedNote);
      }
      setNoteGlow(true);
      setSaveNotice('AIの指摘を反映して清書しました');
      window.setTimeout(() => setNoteGlow(false), 1400);
      window.setTimeout(() => setSaveNotice(null), 3000);
    } catch (error) {
      console.error('[ScoreResultModal] 清書に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_REFINE_NOTE);
      setSaveNotice('清書に失敗したため、Energy を返還しました。');
      window.setTimeout(() => setSaveNotice(null), 4000);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      >
        <AnimatePresence>{xpResult.leveledUp && <ConfettiBurst />}</AnimatePresence>

        <button
          type="button"
          onClick={() => {
            persistMistake(mistakeTag, mistakeNote);
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ① 正誤判定 + XP獲得（コンパクトなヘッダー行） */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3">
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="h-7 w-7 shrink-0 text-red-400" />
            )}
            <div>
              <h2 className={`text-base font-semibold leading-tight tracking-tight ${isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'}`}>
                {isCorrect ? '正解！' : '不正解...'}
              </h2>
              <p className="mt-1 text-base font-black tracking-tight text-cyan-500 [text-shadow:0_0_12px_rgba(34,211,238,0.7)] dark:text-cyan-300">
                正解: 【{' '}
                <KaTeXText
                  text={displayedAnswer}
                  className="inline font-black text-cyan-400 dark:text-cyan-300"
                />{' '}
                】
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-w-[160px] flex-col gap-1"
          >
            <div className="flex items-center justify-end gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold tracking-tight text-amber-600 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                +{xpResult.xpEarned} XP
              </span>
              {xpResult.leveledUp && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-300"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  Lv.{xpResult.previousLevel}→{xpResult.newLevel}
                </motion.span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200"
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    xpResult.xpRequiredForNextLevel > 0
                      ? Math.min(100, (xpResult.xpIntoCurrentLevel / xpResult.xpRequiredForNextLevel) * 100)
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </motion.div>
        </div>

        {showGuestSignup && (
          <div className="mb-5 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-400/15 via-orange-400/10 to-cyan-400/10 p-5 dark:from-amber-400/20 dark:via-slate-900/40 dark:to-cyan-400/10">
            <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              🎉 ナイス正解！+100 XP を獲得しました！
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-100">
              ⚠️ 現在ゲストモードです。獲得したXPや解法ノート、学習記録をクラウドに永久保存し、106個の武器庫をアンロックするためにGoogleで登録・保存しよう！
            </p>
            <button
              type="button"
              onClick={() => {
                void handleGoogleSave();
              }}
              disabled={authBusy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(251,191,36,0.25)] transition hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              <Flame className="h-4 w-4" />
              🔥 Googleアカウントで記録を保存して始める
            </button>
            {authNotice && (
              <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{authNotice}</p>
            )}
          </div>
        )}

        {/* ② 解法の真髄（Apexガイド） + 🔑 鍵となる公式（最も大きく強調表示） */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="mb-3 flex items-center justify-center gap-2 text-center text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            解法の真髄（Apexガイド）
          </h3>
          <ol className="mb-4 list-decimal space-y-2.5 pl-6 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
            {scoredProblem.explanation.stepByStep.map((step, index) => (
              <li key={index} className="marker:font-bold marker:text-cyan-400">
                <KaTeXText text={step} />
              </li>
            ))}
          </ol>
          <div className="mb-3 rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <p className="mb-1.5 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              <KeyRound className="h-3.5 w-3.5" />
              鍵となる公式
            </p>
            <KaTeXBlock content={scoredProblem.explanation.keyFormula} className="text-lg font-semibold text-slate-900 dark:text-white" />
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-400">よくあるミス</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <KaTeXText text={scoredProblem.explanation.commonMistakes} />
            </p>
          </div>
        </div>

        <div className="mb-5">
          <GoalBackwardTree problem={scoredProblem} compact />
        </div>

        <div className="mb-5 flex w-full flex-col gap-4">
          <div className="w-full rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
              <BookOpenCheck className="h-4 w-4" />
              ✍️ 自分流解法メモ
            </h3>
            {patternId && (
              <p className="mb-2 text-[11px] text-fuchsia-200/80">
                このメモは解答前のワークスペースと同じ内容です。編集すると図鑑とも同期されます。
              </p>
            )}
            <motion.div
              animate={
                noteGlow
                  ? {
                      boxShadow: [
                        '0 0 0 rgba(34,211,238,0)',
                        '0 0 28px rgba(34,211,238,0.85)',
                        '0 0 12px rgba(168,85,247,0.55)',
                        '0 0 0 rgba(34,211,238,0)',
                      ],
                    }
                  : { boxShadow: '0 0 0 rgba(34,211,238,0)' }
              }
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`rounded-lg ${noteGlow ? 'ring-2 ring-cyan-300/80' : ''}`}
            >
              <textarea
                value={solutionNote}
                onChange={(event) => onSolutionNoteChange(event.target.value)}
                rows={8}
                placeholder="この問題の解き方を、自分の言葉でまとめてみよう..."
                className="min-h-[10rem] w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </motion.div>
            <div className="mt-3">
              <AiSolutionCheckPanel
                customText={solutionNote}
                context={{
                  mode: 'problem',
                  title: scoredProblem.title,
                  unit: scoredProblem.unit,
                  questionText: scoredProblem.questionText,
                  patternId: scoredProblem.patternId,
                  keyFormula: scoredProblem.explanation.keyFormula,
                  commonMistakes: scoredProblem.explanation.commonMistakes,
                  explanationSteps: scoredProblem.explanation.stepByStep,
                  correctAnswer: scoredProblem.correctAnswer,
                }}
                buttonLabel="解法ロジック検証"
                onResult={(result: CustomSolutionVerifyResult) => {
                  const parts = [result.feedback, result.edgeCaseNote].filter(
                    (item): item is string => Boolean(item && item.trim())
                  );
                  setVerifyFeedback(parts.join('\n'));
                  setVerifyStatus(result.status);
                }}
              />
              {verifyStatus && verifyStatus !== 'perfect' && (
                <button
                  type="button"
                  onClick={() => setChallengeOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-400/15 via-red-400/10 to-cyan-400/15 px-3 py-2.5 text-xs font-bold text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)] transition hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                >
                  <Swords className="h-3.5 w-3.5 text-amber-300" />
                  ⚔️ この解法が通用しない「罠パターン」に挑戦する
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-400/20"
              >
                ノートに保存
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleRefineNote();
                }}
                disabled={isRefining}
                className="rounded-lg border border-cyan-300/70 bg-gradient-to-r from-cyan-400/25 via-fuchsia-400/20 to-cyan-400/25 px-3 py-1.5 text-xs font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.45)] transition hover:shadow-[0_0_22px_rgba(34,211,238,0.7)] disabled:opacity-50"
              >
                {isRefining ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    清書中...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                    ✨ AIの指摘を反映して清書
                  </span>
                )}
              </button>
              <AnimatePresence>
                {saveNotice && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs ${
                      saveNotice.includes('失敗') || saveNotice.includes('不足') || saveNotice.includes('読み込み')
                        ? 'text-red-400'
                        : 'text-emerald-300'
                    }`}
                  >
                    {saveNotice}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!isCorrect && (
            <div className="w-full rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                ⚠️ なぜ間違えたかメモ
              </h3>
              <p className="mb-3 text-[11px] text-amber-200/80">
                ワンタップで原因を残すと、ライブラリでミス原因別に復習できます。
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {MISTAKE_TAGS.map((tag) => {
                  const selected = mistakeTag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleMistakeTag(tag.id)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        selected
                          ? 'border-amber-400/70 bg-amber-400/20 text-amber-100'
                          : 'border-slate-300 bg-white/70 text-slate-600 hover:border-amber-400/40 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={mistakeNote}
                onChange={(event) => setMistakeNote(event.target.value)}
                onBlur={() => persistMistake(mistakeTag, mistakeNote)}
                rows={6}
                placeholder="どこで、なぜ間違えたかを自分の言葉で残そう..."
                className="min-h-[8rem] w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveMistakeNote}
                className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
              >
                失点メモを保存
              </button>
            </div>
          )}
        </div>

        <PostSolveAIChat
          questionText={scoredProblem.questionText}
          userAnswer={userAnswer}
          correctAnswer={scoredProblem.correctAnswer}
          stepByStep={scoredProblem.explanation.stepByStep}
          customNote={solutionNote}
          userEmail={user?.email}
          onMemoReviewed={(feedback) => {
            if (patternId && solutionNote.trim()) {
              upsertPatternNote(patternId, solutionNote, feedback);
            }
          }}
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              persistMistake(mistakeTag, mistakeNote);
              onClose();
            }}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={() => {
              persistMistake(mistakeTag, mistakeNote);
              onClose();
              onNextProblem();
            }}
            className="flex-1 rounded-lg border border-cyan-400/50 bg-cyan-400/10 py-2.5 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-400/20 dark:text-cyan-200"
          >
            次の問題へ
          </button>
        </div>
      </motion.div>
    </div>
    {challengeOpen && (
      <CounterChallengeStoryModal
        questionText={scoredProblem.questionText}
        customNote={solutionNote}
        aiFeedback={verifyFeedback}
        sourceProblem={scoredProblem}
        userEmail={user?.email}
        onAbort={() => setChallengeOpen(false)}
        onComplete={() => setChallengeOpen(false)}
      />
    )}
    </>
  );
}

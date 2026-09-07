'use client';

// ==========================================
// Apex Suite: Math Lab - Score Result Modal（採点結果モーダル）
// ==========================================
// 解答送信後に必ず表示される採点結果モーダル。
// 表示順序（優先度順）:
//   ① 正誤判定 + XP獲得（コンパクトなヘッダー行）
//   ② 解法の真髄（Apexガイド） + 🔑 鍵となる公式（画面中央に最も大きく強調表示）
//   ③ ✍️ 自分流のメモとして上書き保存する（②の直下）

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, BookOpenCheck, X, KeyRound, ArrowUpRight } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import KaTeXText from './KaTeXText';
import KaTeXBlock from './KaTeXBlock';
import AiSolutionCheckPanel from './AiSolutionCheckPanel';
import { getCustomSolutionNote, saveCustomSolutionNote } from '@/lib/storage/customSolutionNotesStore';

interface ScoreResultModalProps {
  problem: GeneratedProblem;
  isCorrect: boolean;
  xpResult: XpGainResult;
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
  onClose,
  onNextProblem,
}: ScoreResultModalProps) {
  const [noteContent, setNoteContent] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    // 問題が変わるたびにLocalStorageから既存のノートを読み込む（外部ストアとの同期）。
    const existing = getCustomSolutionNote(problem.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNoteContent(existing?.content ?? '');
  }, [problem.id]);

  const handleSaveNote = () => {
    saveCustomSolutionNote(problem.id, noteContent);
    setSaveNotice('ローカルストレージに保存しました（ログイン後は自動同期されます）');
    window.setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      >
        <AnimatePresence>{xpResult.leveledUp && <ConfettiBurst />}</AnimatePresence>

        <button
          type="button"
          onClick={onClose}
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
              <p className="text-[11px] text-slate-500">
                正解: <KaTeXText text={String(problem.correctAnswer)} />
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

        {/* ② 解法の真髄（Apexガイド） + 🔑 鍵となる公式（最も大きく強調表示） */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="mb-3 flex items-center justify-center gap-2 text-center text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            解法の真髄（Apexガイド）
          </h3>
          <ol className="mb-4 list-decimal space-y-2.5 pl-6 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
            {problem.explanation.stepByStep.map((step, index) => (
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
            <KaTeXBlock content={problem.explanation.keyFormula} className="text-lg font-semibold text-slate-900 dark:text-white" />
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-400">よくあるミス</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{problem.explanation.commonMistakes}</p>
          </div>
        </div>

        {/* ③ ✍️ 自分流のメモとして上書き保存する */}
        <div className="mb-5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
            <BookOpenCheck className="h-4 w-4" />
            自分流のメモとして上書き保存する
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              rows={4}
              placeholder="この問題の解き方を、自分の言葉でまとめてみよう..."
              className="w-full min-w-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <div className="sm:w-52">
              <AiSolutionCheckPanel
                customText={noteContent}
                context={{
                  mode: 'problem',
                  title: problem.title,
                  unit: problem.unit,
                  questionText: problem.questionText,
                  patternId: problem.patternId,
                  keyFormula: problem.explanation.keyFormula,
                  commonMistakes: problem.explanation.commonMistakes,
                  explanationSteps: problem.explanation.stepByStep,
                  correctAnswer: problem.correctAnswer,
                }}
                buttonLabel="解法ロジック検証"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveNote}
              className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-400/20"
            >
              ノートに保存
            </button>
            <AnimatePresence>
              {saveNotice && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-300"
                >
                  {saveNotice}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={onNextProblem}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            次の問題へ
          </button>
        </div>
      </motion.div>
    </div>
  );
}

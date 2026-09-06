'use client';

// ==========================================
// Apex Suite: Math Lab - Score Result Modal（採点結果モーダル）
// ==========================================
// 解答送信後に必ず表示される採点結果モーダル。
// - 正誤判定 + XP獲得のネオン発光アニメーション（レベルアップ時は紙吹雪）
// - AIのステップバイステップ解説・鍵となる公式・よくあるミス
// - 「✍️ 自分の言葉で解説を書き換えてノートに保存」テキストエリア

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, BookOpenCheck, X } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import KaTeXText from './KaTeXText';
import KaTeXBlock from './KaTeXBlock';
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
    setSaveNotice('✓ ローカルストレージに保存しました（Supabase連携後は自動同期されます）');
    window.setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
      >
        <AnimatePresence>{xpResult.leveledUp && <ConfettiBurst />}</AnimatePresence>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ① 正誤判定 */}
        <div className="mb-4 flex items-center gap-3">
          {isCorrect ? (
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          ) : (
            <XCircle className="h-9 w-9 text-red-400" />
          )}
          <div>
            <h2 className={`text-xl font-black ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
              {isCorrect ? '正解！' : '不正解...'}
            </h2>
            <p className="text-xs text-slate-500">
              正解: <KaTeXText text={String(problem.correctAnswer)} />
            </p>
          </div>
        </div>

        {/* XP獲得パネル（常時表示） */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-black text-amber-200">
              <Sparkles className="h-4 w-4" />
              🎉 +{xpResult.xpEarned} XP 獲得！
            </span>
            {xpResult.leveledUp && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300"
              >
                🆙 LEVEL UP! Lv.{xpResult.previousLevel} → Lv.{xpResult.newLevel}
              </motion.span>
            )}
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
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

        {/* ② AI解説 */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="mb-2 text-sm font-bold text-cyan-300">AIによるステップ解説</h3>
          <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
            {problem.explanation.stepByStep.map((step, index) => (
              <li key={index}>
                <KaTeXText text={step} />
              </li>
            ))}
          </ol>
          <div className="mb-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cyan-400">鍵となる公式</p>
            <KaTeXBlock content={problem.explanation.keyFormula} className="text-sm text-slate-200" />
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-400">よくあるミス</p>
            <p className="text-sm text-slate-300">{problem.explanation.commonMistakes}</p>
          </div>
        </div>

        {/* ③ 自分の言葉でノート化 */}
        <div className="mb-5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
            <BookOpenCheck className="h-4 w-4" />
            ✍️ 自分の言葉で解説を書き換えてノートに保存
          </h3>
          <textarea
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
            rows={4}
            placeholder="この問題の解き方を、自分の言葉でまとめてみよう..."
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
          />
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
            className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={onNextProblem}
            className="flex-1 rounded-lg border border-cyan-400/50 bg-cyan-400/10 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            次の問題へ
          </button>
        </div>
      </motion.div>
    </div>
  );
}

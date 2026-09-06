'use client';

// ==========================================
// Apex Suite: Math Lab - Score Result Modal（採点結果モーダル）
// ==========================================
// 解答送信後に必ず表示される採点結果モーダル。
// 表示順序（優先度順）:
//   ① 正誤判定 + XP獲得（コンパクトなヘッダー行）
//   ② 🤖 AIによる公式解説ステップ + 🔑 鍵となる公式（画面中央に最も大きく強調表示）
//   ③ ✍️ 自分流のメモとして上書き保存する（②の直下）

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

        {/* ① 正誤判定 + XP獲得（コンパクトなヘッダー行） */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="h-7 w-7 shrink-0 text-red-400" />
            )}
            <div>
              <h2 className={`text-base font-black leading-tight ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
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
              <span className="flex items-center gap-1 text-xs font-black text-amber-200">
                <Sparkles className="h-3.5 w-3.5" />
                🎉 +{xpResult.xpEarned} XP
              </span>
              {xpResult.leveledUp && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300"
                >
                  🆙 Lv.{xpResult.previousLevel}→{xpResult.newLevel}
                </motion.span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
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

        {/* ② 🤖 AIによる公式解説ステップ + 🔑 鍵となる公式（最も大きく強調表示） */}
        <div className="mb-5 rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-b from-cyan-400/10 via-slate-900/80 to-slate-900/60 p-5 shadow-[0_0_30px_-10px_rgba(34,211,238,0.5)]">
          <h3 className="mb-3 flex items-center justify-center gap-2 text-center text-lg font-black tracking-wide text-cyan-200">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            🤖 AIによる公式解説ステップ
          </h3>
          <ol className="mb-4 list-decimal space-y-2.5 pl-6 text-[15px] leading-relaxed text-slate-200">
            {problem.explanation.stepByStep.map((step, index) => (
              <li key={index} className="marker:font-bold marker:text-cyan-400">
                <KaTeXText text={step} />
              </li>
            ))}
          </ol>
          <div className="mb-3 rounded-xl border-2 border-cyan-400/40 bg-cyan-400/10 p-4 text-center">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300">🔑 鍵となる公式</p>
            <KaTeXBlock content={problem.explanation.keyFormula} className="text-lg font-semibold text-white" />
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-400">よくあるミス</p>
            <p className="text-sm text-slate-300">{problem.explanation.commonMistakes}</p>
          </div>
        </div>

        {/* ③ ✍️ 自分流のメモとして上書き保存する */}
        <div className="mb-5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
            <BookOpenCheck className="h-4 w-4" />
            ✍️ 自分流のメモとして上書き保存する
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

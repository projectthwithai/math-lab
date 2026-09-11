'use client';

// ==========================================
// Apex Suite: Math Lab - Retry Problem Modal（数字を変えて即挑戦）
// ==========================================
// 「🔄 数字を変えて即挑戦（APIコスト0）」機能。
// localRegenerator（クライアント側の再生成エンジン）で数値だけ変えた同型の問題を
// その場で作り、解答→採点→忘却曲線のreviewStage更新までを1つのモーダルで完結させる。

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, X, XCircle } from 'lucide-react';

import type { SolvedProblemRecord } from '@/types/mathLab';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { checkAnswer } from '@/lib/engine/answerChecker';
import { markRecordReviewed } from '@/lib/storage/solvedProblemsStore';
import { getReviewStageLabel } from '@/lib/engine/forgettingCurve';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import KaTeXText from '@/components/workspace/KaTeXText';

interface RetryProblemModalProps {
  record: SolvedProblemRecord;
  onClose: () => void;
  onReviewed: (updated: SolvedProblemRecord) => void;
}

export default function RetryProblemModal({ record, onClose, onReviewed }: RetryProblemModalProps) {
  const [problem, setProblem] = useState(() => regenerateProblemLocally(record.problem));
  const [answerInput, setAnswerInput] = useState('');
  const [result, setResult] = useState<{ isCorrect: boolean; updated: SolvedProblemRecord } | null>(
    null
  );

  const accent = useMemo(() => SUBJECT_ACCENT[problem.subject], [problem.subject]);

  const handleRegenerate = () => {
    setProblem(regenerateProblemLocally({ ...record.problem, id: `${record.problem.id}-${Date.now()}` }));
    setAnswerInput('');
    setResult(null);
  };

  const handleSubmit = () => {
    if (result) return;
    const isCorrect = checkAnswer(answerInput, problem.correctAnswer);
    const updated = markRecordReviewed(record.id, isCorrect);
    if (updated) {
      setResult({ isCorrect, updated });
      onReviewed(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <span className={`inline-flex items-center gap-1.5 rounded-full border ${accent.border} px-2.5 py-1 text-[11px] font-medium ${accent.text}`}>
          <RefreshCw className="h-3 w-3" />
          数字を変えて即挑戦（0 Energy）
        </span>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{problem.title}</h2>

        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          <KaTeXText text={problem.questionText} />
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={Boolean(result)}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover} disabled:opacity-40`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          もう一度数字を変える
        </button>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-xs text-slate-500">解答を入力してください</label>
          <input
            type="text"
            value={answerInput}
            onChange={(event) => setAnswerInput(event.target.value)}
            disabled={Boolean(result)}
            placeholder="ここに解答を入力..."
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50"
          />
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl border p-4 ${
              result.isCorrect
                ? 'border-emerald-400/30 bg-emerald-400/10'
                : 'border-red-400/30 bg-red-400/10'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <div>
                <p className={`text-sm font-bold ${result.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                  {result.isCorrect ? '正解！復習の間隔が伸びました' : '不正解。もう少し間隔を短くして復習します'}
                </p>
                <p className="text-xs text-slate-400">
                  正解: <KaTeXText text={String(problem.correctAnswer)} /> ／ 次回復習ステータス:{' '}
                  {getReviewStageLabel(result.updated.reviewStage)}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:border-slate-200 dark:bg-white dark:text-slate-950"
          >
            解答を送信する
          </button>
        )}

        {result && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            閉じる
          </button>
        )}
      </motion.div>
    </div>
  );
}

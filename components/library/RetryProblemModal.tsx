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

import type { MistakeTag, SolvedProblemRecord } from '@/types/mathLab';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { checkProblemAnswer } from '@/lib/engine/answerChecker';
import { formatCorrectAnswerForDisplay } from '@/lib/engine/correctAnswer';
import { markRecordReviewed, updateSolvedProblemMistake } from '@/lib/storage/solvedProblemsStore';
import { getReviewStageLabel } from '@/lib/engine/forgettingCurve';
import { MISTAKE_TAGS } from '@/lib/engine/mistakeTags';
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
  const [mistakeTag, setMistakeTag] = useState<MistakeTag | null>(record.mistakeTag ?? null);
  const [mistakeNote, setMistakeNote] = useState(record.mistakeNote ?? '');

  const accent = useMemo(() => SUBJECT_ACCENT[problem.subject], [problem.subject]);

  const handleRegenerate = () => {
    setProblem(regenerateProblemLocally({ ...record.problem, id: `${record.problem.id}-${Date.now()}` }));
    setAnswerInput('');
    setResult(null);
  };

  const handleSubmit = () => {
    if (result) return;
    const isCorrect = checkProblemAnswer(answerInput.trim(), problem);
    const updated = markRecordReviewed(record.id, isCorrect);
    if (updated) {
      setResult({ isCorrect, updated });
      onReviewed(updated);
    }
  };

  const persistMistake = (tag: MistakeTag | null, note: string) => {
    const updated = updateSolvedProblemMistake(record.id, { mistakeTag: tag, mistakeNote: note });
    if (!updated) return;
    setResult((current) => (current ? { ...current, updated } : current));
    onReviewed(updated);
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
          onClick={() => {
            if (result && !result.isCorrect) persistMistake(mistakeTag, mistakeNote);
            onClose();
          }}
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
                  正解: 【{' '}
                  <KaTeXText
                    text={formatCorrectAnswerForDisplay(problem)}
                    className="inline font-black text-cyan-400"
                  />{' '}
                  】 ／ 次回復習ステータス:{' '}
                  {getReviewStageLabel(result.updated.reviewStage)}
                </p>
              </div>
            </div>
            {!result.isCorrect && (
              <div className="mt-3 border-t border-red-400/20 pt-3">
                <p className="mb-2 text-[11px] font-semibold text-amber-200">⚠️ なぜ間違えたか</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {MISTAKE_TAGS.map((tag) => {
                    const selected = mistakeTag === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const next = mistakeTag === tag.id ? null : tag.id;
                          setMistakeTag(next);
                          persistMistake(next, mistakeNote);
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          selected
                            ? `border-current bg-white/5 ${tag.textClass}`
                            : 'border-slate-300 text-slate-400 dark:border-slate-700'
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
                  rows={2}
                  placeholder="なぜ間違えたかを残そう..."
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}
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
            onClick={() => {
              if (!result.isCorrect) persistMistake(mistakeTag, mistakeNote);
              onClose();
            }}
            className="mt-4 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            閉じる
          </button>
        )}
      </motion.div>
    </div>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - Solved Problem Card（マイライブラリの問題カード）
// ==========================================
// 過去に解いた問題1件を表示するカード。
// - 忘却曲線に基づき「🔥 今日復習すべき」バッジを表示
// - 「🔄 数字を変えて即挑戦（APIコスト0）」ボタン
// - 「✍️ 解説を自分の言葉でカスタマイズ」インライン編集エリア

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Flame, RefreshCw, Pencil, Save } from 'lucide-react';

import type { SolvedProblemRecord } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { getOverdueDays, getReviewStageLabel, isDueForReview } from '@/lib/engine/forgettingCurve';
import { getCustomSolutionNote, saveCustomSolutionNote } from '@/lib/storage/customSolutionNotesStore';
import KaTeXText from '@/components/workspace/KaTeXText';

interface SolvedProblemCardProps {
  record: SolvedProblemRecord;
  onRetry: () => void;
}

export default function SolvedProblemCard({ record, onRetry }: SolvedProblemCardProps) {
  const { problem } = record;
  const accent = SUBJECT_ACCENT[problem.subject];
  const due = isDueForReview(record.nextReviewAt);
  const overdueDays = getOverdueDays(record.nextReviewAt);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNoteContent(getCustomSolutionNote(problem.id)?.content ?? '');
  }, [problem.id]);

  const handleSaveNote = () => {
    saveCustomSolutionNote(problem.id, noteContent);
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2500);
  };

  const solvedDateLabel = new Date(record.solvedAt).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-white/80 p-4 backdrop-blur-md dark:bg-slate-900/60 ${
        due ? 'border-amber-400/40' : accent.border
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border ${accent.border} px-2 py-0.5 text-[10px] font-bold ${accent.text}`}>
            {problem.unit}
          </span>
          <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
            難易度 {problem.difficulty}/10
          </span>
          {due && (
            <span className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              <Flame className="h-3 w-3" />
              今日復習すべき{overdueDays > 0 ? `（${overdueDays}日超過）` : ''}
            </span>
          )}
        </div>
        {record.isCorrect ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-red-400" />
        )}
      </div>

      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{problem.title}</h3>
      <p className="line-clamp-2 text-xs text-slate-400">
        <KaTeXText text={problem.questionText} />
      </p>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>解答日: {solvedDateLabel}</span>
        <span>復習ステータス: {getReviewStageLabel(record.reviewStage)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          数字を変えて即挑戦
        </button>
        <button
          type="button"
          onClick={() => setIsEditingNote((prev) => !prev)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/5 py-2 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-400/10"
        >
          <Pencil className="h-3.5 w-3.5" />
          解説をカスタマイズ
        </button>
      </div>

      {isEditingNote && (
        <div className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/5 p-3">
          <textarea
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
            rows={3}
            placeholder="この問題の解き方を、自分の言葉でまとめてみよう..."
            className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveNote}
              className="flex items-center gap-1 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-300 hover:bg-fuchsia-400/20"
            >
              <Save className="h-3 w-3" />
              保存
            </button>
            {saveNotice && <span className="text-[11px] text-emerald-600 dark:text-emerald-300">保存しました</span>}
          </div>
        </div>
      )}
    </div>
  );
}

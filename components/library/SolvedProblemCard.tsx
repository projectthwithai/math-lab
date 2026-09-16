'use client';

// ==========================================
// Apex Suite: Math Lab - Solved Problem Card（マイライブラリの問題カード）
// ==========================================
// 過去に解いた問題1件を表示するカード。
// - 忘却曲線に基づき「🔥 今日復習すべき」バッジを表示
// - 「🔄 数字を変えて即挑戦（APIコスト0）」ボタン
// - 「✍️ 解説を自分の言葉でカスタマイズ」インライン編集エリア

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Flame, RefreshCw, Pencil, Save, AlertTriangle } from 'lucide-react';

import type { MistakeTag, SolvedProblemRecord } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { getOverdueDays, getReviewStageLabel, isDueForReview } from '@/lib/engine/forgettingCurve';
import { getCustomSolutionNote, saveCustomSolutionNote } from '@/lib/storage/customSolutionNotesStore';
import { updateSolvedProblemMistake } from '@/lib/storage/solvedProblemsStore';
import { setPendingWorkspaceProblem, startLibraryReviewPath } from '@/lib/storage/pendingProblemStore';
import { MISTAKE_TAG_BY_ID, MISTAKE_TAGS } from '@/lib/engine/mistakeTags';
import { formatStarDifficulty } from '@/lib/engine/difficultyScale';
import { useUserStore } from '@/lib/store/userStore';
import KaTeXText from '@/components/workspace/KaTeXText';

interface SolvedProblemCardProps {
  record: SolvedProblemRecord;
  onUpdated?: (updated: SolvedProblemRecord) => void;
}

export default function SolvedProblemCard({ record, onUpdated }: SolvedProblemCardProps) {
  const router = useRouter();
  const { problem } = record;
  const accent = SUBJECT_ACCENT[problem.subject];
  const due = isDueForReview(record.nextReviewAt);
  const overdueDays = getOverdueDays(record.nextReviewAt);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingMistake, setIsEditingMistake] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [mistakeNote, setMistakeNote] = useState(record.mistakeNote ?? '');
  const [saveNotice, setSaveNotice] = useState(false);
  const mistakeMeta = record.mistakeTag ? MISTAKE_TAG_BY_ID[record.mistakeTag] : null;
  const patternId = problem.patternId;
  const storedPatternNote = useUserStore((state) =>
    patternId ? state.patternNotes[patternId] : undefined
  );
  const upsertPatternNote = useUserStore((state) => state.upsertPatternNote);

  useEffect(() => {
    const fromPattern = storedPatternNote?.customText;
    const fromProblem = getCustomSolutionNote(problem.id)?.content;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNoteContent(fromPattern || fromProblem || '');
  }, [problem.id, patternId, storedPatternNote?.customText, storedPatternNote?.updatedAt]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMistakeNote(record.mistakeNote ?? '');
  }, [record.id, record.mistakeNote]);

  const handleSaveNote = () => {
    if (patternId) {
      upsertPatternNote(patternId, noteContent);
    } else {
      saveCustomSolutionNote(problem.id, noteContent);
    }
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2500);
  };

  const persistMistake = (tag: MistakeTag | null, note: string) => {
    const updated = updateSolvedProblemMistake(record.id, { mistakeTag: tag, mistakeNote: note });
    if (updated) onUpdated?.(updated);
  };

  const handleToggleMistakeTag = (tag: MistakeTag) => {
    const next = record.mistakeTag === tag ? null : tag;
    persistMistake(next, mistakeNote);
  };

  const handleSaveMistakeNote = () => {
    persistMistake(record.mistakeTag ?? null, mistakeNote);
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2500);
  };

  const handleRetryInWorkspace = () => {
    setPendingWorkspaceProblem(record.problem);
    router.push(startLibraryReviewPath(record.id));
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
            難易度 {formatStarDifficulty(problem.difficulty)}
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

      {!record.isCorrect && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {mistakeMeta ? mistakeMeta.label : '失点原因未記録'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingMistake((prev) => !prev)}
              className="text-[10px] font-semibold text-amber-200/80 hover:text-amber-100"
            >
              {isEditingMistake ? '閉じる' : '原因を記録'}
            </button>
          </div>
          {record.mistakeNote && !isEditingMistake && (
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{record.mistakeNote}</p>
          )}
          {isEditingMistake && (
            <div className="mt-2">
              <div className="mb-2 flex flex-wrap gap-1">
                {MISTAKE_TAGS.map((tag) => {
                  const selected = record.mistakeTag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleMistakeTag(tag.id)}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                        selected
                          ? `border-current bg-white/5 ${tag.textClass}`
                          : 'border-slate-300 text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {tag.shortLabel}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={mistakeNote}
                onChange={(event) => setMistakeNote(event.target.value)}
                rows={2}
                placeholder="なぜ間違えたかを自分の言葉で..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveMistakeNote}
                className="mt-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-200"
              >
                失点メモを保存
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRetryInWorkspace}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          数字を変えて即挑戦 (0 Energy)
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

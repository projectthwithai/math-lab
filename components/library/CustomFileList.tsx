'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Folder, Pencil, Play, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';

import KaTeXText from '@/components/workspace/KaTeXText';
import { hasDeveloperPrivileges } from '@/lib/auth/developerAccess';
import {
  ENERGY_COST_CUSTOM_FILE_NEW,
  ENERGY_COST_CUSTOM_FILE_REVIEW,
} from '@/lib/engine/energyCosts';
import { startCustomFilePracticePath, summarizeCustomFileEnergy } from '@/lib/engine/customFileProblem';
import { nextCustomFileTitle, useUserStore } from '@/lib/store/userStore';
import { useAppToastStore } from '@/lib/store/appToastStore';

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function CustomFileList() {
  const router = useRouter();
  const customFiles = useUserStore((state) => state.customFiles);
  const createCustomFile = useUserStore((state) => state.createCustomFile);
  const renameCustomFile = useUserStore((state) => state.renameCustomFile);
  const deleteCustomFile = useUserStore((state) => state.deleteCustomFile);
  const removeProblemFromFile = useUserStore((state) => state.removeProblemFromFile);
  const isProblemPracticed = useUserStore((state) => state.isProblemPracticed);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const masteredPatternCount = useUserStore((state) => state.clearedPatternIds.length);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const showToast = useAppToastStore((state) => state.showToast);
  const developer = isDeveloper || hasDeveloperPrivileges();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const handleCreateEmpty = () => {
    const title = nextCustomFileTitle(useUserStore.getState().customFiles);
    const id = createCustomFile(title);
    setExpandedId(id);
    showToast(`「${title}」を作成しました`);
  };

  const commitRename = (fileId: string) => {
    renameCustomFile(fileId, renameDraft);
    setRenamingId(null);
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">
          <Folder className="h-4 w-4 text-cyan-400" />
          マイファイル
        </h2>
        <button
          type="button"
          onClick={handleCreateEmpty}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-800 dark:text-cyan-100"
        >
          <Plus className="h-3.5 w-3.5" />
          新規ファイル
        </button>
      </div>

      {customFiles.length === 0 ? (
        <div className="rounded-2xl surface-panel p-10 text-center">
          <p className="text-sm text-slate-400">
            まだファイルがありません。ワークスペースや図鑑から「ファイルに追加」で作れます。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {customFiles.map((file) => {
            const expanded = expandedId === file.id;
            const energySummary = summarizeCustomFileEnergy(
              file.problems,
              (problemId) =>
                hasHydrated && masteredPatternCount >= 0 ? isProblemPracticed(problemId) : false,
              developer
            );
            const practiceLabel =
              energySummary.unpracticedCount > 0 && !developer
                ? `このファイルを演習する (未挑戦${energySummary.unpracticedCount}問: ${energySummary.totalCost} Energy)`
                : `このファイルを演習する (${ENERGY_COST_CUSTOM_FILE_REVIEW} Energy)`;
            return (
              <li key={file.id} className="overflow-hidden rounded-2xl surface-panel">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {renamingId === file.id ? (
                      <input
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onBlur={() => commitRename(file.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            commitRename(file.id);
                          }
                          if (event.key === 'Escape') setRenamingId(null);
                        }}
                        className="w-full rounded-lg surface-input px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : file.id)}
                        className="w-full text-left"
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {file.title}
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {file.problems.length}問
                          {file.updatedAt ? ` · 更新 ${formatUpdatedAt(file.updatedAt)}` : ''}
                        </p>
                      </button>
                    )}
                    {renamingId === file.id && (
                      <p className="mt-1 text-xs text-slate-500">
                        {file.problems.length}問
                        {file.updatedAt ? ` · 更新 ${formatUpdatedAt(file.updatedAt)}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(file.id);
                        setRenameDraft(file.title);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500 dark:border-slate-700"
                      aria-label="名前を変更"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomFile(file.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:border-rose-400/60 hover:text-rose-400 dark:border-slate-700"
                      aria-label="ファイルを削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={file.problems.length === 0}
                      onClick={() => router.push(startCustomFilePracticePath(file.id))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-800 disabled:opacity-40 dark:text-cyan-100"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {practiceLabel}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    {file.problems.length === 0 ? (
                      <p className="text-xs text-slate-500">まだ問題が入っていません。</p>
                    ) : (
                      <ol className="flex flex-col gap-2">
                        {file.problems.map((problem, index) => (
                          <li
                            key={`${file.id}-${problem.id}`}
                            className="rounded-xl surface-card px-3 py-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                  <span>
                                    {index + 1}. {problem.unit}
                                  </span>
                                  {hasHydrated && isProblemPracticed(problem.id) ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-200">
                                      <RotateCcw className="h-2.5 w-2.5" />
                                      復習 ({ENERGY_COST_CUSTOM_FILE_REVIEW} Energy)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-200">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      未挑戦 ({ENERGY_COST_CUSTOM_FILE_NEW} Energy)
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{problem.title}</p>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                  <KaTeXText text={problem.questionText} />
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProblemFromFile(file.id, problem.id)}
                                className="shrink-0 rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:border-rose-400/60 hover:text-rose-400 dark:border-slate-700"
                                aria-label="この問題を削除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

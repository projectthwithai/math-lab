'use client';

// ==========================================
// Apex Suite: Math Lab - マイライブラリ（常駐タブ）
// ==========================================
// 解答履歴は初回プリロード済みの catalogStore を読む。タブを開くたびにスピナーは出さない。
// 履歴とマイファイルは hidden で保持し、サブタブを往復しても展開状態を残す。

import { memo, useMemo, useState } from 'react';
import { BookMarked, CircleCheck, CircleX, Flame, Folder, Layers, Search } from 'lucide-react';

import { useMainTab } from '@/components/layout/MainTabProvider';
import CustomFileList from '@/components/library/CustomFileList';
import MistakeAnalysisDashboard from '@/components/library/MistakeAnalysisDashboard';
import SolvedProblemCard from '@/components/library/SolvedProblemCard';
import { isDueForReview } from '@/lib/engine/forgettingCurve';
import { MISTAKE_TAGS } from '@/lib/engine/mistakeTags';
import { useCatalogStore } from '@/lib/store/catalogStore';
import type { MistakeTag, Subject, SolvedProblemRecord } from '@/types/mathLab';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];

type ResultFilter = 'all' | 'correct' | 'incorrect';

const RESULT_TABS: Array<{ id: ResultFilter; label: string; icon: typeof Layers }> = [
  { id: 'all', label: 'すべて', icon: Layers },
  { id: 'correct', label: '正解した問題', icon: CircleCheck },
  { id: 'incorrect', label: '間違えた問題', icon: CircleX },
];

function LibraryView() {
  const { librarySection, setLibrarySection } = useMainTab();
  const records = useCatalogStore((state) => state.solvedRecords);
  const replaceSolvedRecord = useCatalogStore((state) => state.replaceSolvedRecord);
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [causeFilter, setCauseFilter] = useState<MistakeTag | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSubject = subjectFilter === 'all' || record.problem.subject === subjectFilter;
      const matchesResult =
        resultFilter === 'all' ||
        (resultFilter === 'correct' && record.isCorrect) ||
        (resultFilter === 'incorrect' && !record.isCorrect);
      const matchesCause =
        resultFilter !== 'incorrect' || causeFilter === 'all' || record.mistakeTag === causeFilter;
      const matchesQuery =
        query.length === 0 ||
        record.problem.title.toLowerCase().includes(query) ||
        record.problem.unit.toLowerCase().includes(query);
      return matchesSubject && matchesResult && matchesCause && matchesQuery;
    });
  }, [records, subjectFilter, resultFilter, causeFilter, searchQuery]);

  const dueRecords = useMemo(
    () => filteredRecords.filter((record) => isDueForReview(record.nextReviewAt)),
    [filteredRecords]
  );

  const incorrectCount = records.filter((record) => !record.isCorrect).length;
  const correctCount = records.filter((record) => record.isCorrect).length;

  const handleReviewed = (updated: SolvedProblemRecord) => {
    replaceSolvedRecord(updated);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-1 flex items-center gap-2">
        <BookMarked className="h-5 w-5 text-cyan-400" />
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">マイライブラリ</h1>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        解いた問題は自動でここに記録され、自分専用ファイルに集めた問題は連続演習できます。
      </p>

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl surface-card p-1.5">
        <button
          type="button"
          onClick={() => setLibrarySection('history')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            librarySection === 'history'
              ? 'bg-cyan-400/15 text-cyan-300'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookMarked className="h-3.5 w-3.5" />
          解答履歴
        </button>
        <button
          type="button"
          onClick={() => setLibrarySection('files')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            librarySection === 'files'
              ? 'bg-cyan-400/15 text-cyan-300'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Folder className="h-3.5 w-3.5" />
          マイファイル
        </button>
      </div>

      <div className={librarySection === 'files' ? 'block' : 'hidden'}>
        <CustomFileList />
      </div>

      <div className={librarySection === 'history' ? 'block' : 'hidden'}>
        {records.length === 0 ? (
          <div className="rounded-2xl surface-panel p-10 text-center backdrop-blur-md">
            <p className="text-sm text-slate-400">
              まだ解いた問題がありません。ワークスペースで問題を解くと、ここに記録されます。
            </p>
          </div>
        ) : (
          <>
            <MistakeAnalysisDashboard records={records} />

            <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl surface-card p-1.5">
              {RESULT_TABS.map((tab) => {
                const Icon = tab.icon;
                const count =
                  tab.id === 'all' ? records.length : tab.id === 'correct' ? correctCount : incorrectCount;
                const active = resultFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setResultFilter(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? tab.id === 'incorrect'
                          ? 'bg-red-400/15 text-red-300'
                          : tab.id === 'correct'
                            ? 'bg-emerald-400/15 text-emerald-300'
                            : 'bg-cyan-400/15 text-cyan-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{count}</span>
                  </button>
                );
              })}
            </div>

            {resultFilter === 'incorrect' && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500">ミス原因別フィルター</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCauseFilter('all')}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      causeFilter === 'all'
                        ? 'border-red-400/60 bg-red-400/10 text-red-300'
                        : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
                    }`}
                  >
                    すべての原因
                  </button>
                  {MISTAKE_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setCauseFilter(tag.id)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        causeFilter === tag.id
                          ? `border-current bg-white/5 ${tag.textClass}`
                          : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dueRecords.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-300">
                  <Flame className="h-4 w-4" />
                  今日復習すべき過去問（{dueRecords.length}件）
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dueRecords.map((record) => (
                    <SolvedProblemCard key={`due-${record.id}`} record={record} onUpdated={handleReviewed} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                {resultFilter === 'incorrect'
                  ? '間違えた問題'
                  : resultFilter === 'correct'
                    ? '正解した問題'
                    : '全ての解答履歴'}
                （{filteredRecords.length}件）
              </h2>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_FILTERS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => setSubjectFilter(subject)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        subjectFilter === subject
                          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                          : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
                      }`}
                    >
                      {subject === 'all' ? '全科目' : SUBJECT_LABEL[subject]}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="タイトル・単元で検索..."
                    className="w-full rounded-lg surface-input py-2 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((record) => (
                  <SolvedProblemCard key={record.id} record={record} onUpdated={handleReviewed} />
                ))}

                {filteredRecords.length === 0 && (
                  <p className="col-span-full py-10 text-center text-sm text-slate-500">
                    条件に一致する問題が見つかりませんでした。
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default memo(LibraryView);

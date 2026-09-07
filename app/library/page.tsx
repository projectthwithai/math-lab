'use client';

// ==========================================
// Apex Suite: Math Lab - マイライブラリ ＆ 忘却曲線復習画面
// ==========================================
// 過去に解いた問題（マイ問題集）を一覧表示し、エビングハウスの忘却曲線に基づき
// 「🔥 今日復習すべき過去問」を優先バッジで示す。各カードから
// 「🔄 数字を変えて即挑戦（APIコスト0）」「✍️ 解説をカスタマイズ」が行える。

import { useEffect, useMemo, useState } from 'react';
import { BookMarked, Flame, Search } from 'lucide-react';

import type { Subject, SolvedProblemRecord } from '@/types/mathLab';
import { getAllSolvedProblemRecords } from '@/lib/storage/solvedProblemsStore';
import { isDueForReview } from '@/lib/engine/forgettingCurve';
import SolvedProblemCard from '@/components/library/SolvedProblemCard';
import RetryProblemModal from '@/components/library/RetryProblemModal';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];

export default function LibraryPage() {
  const [records, setRecords] = useState<SolvedProblemRecord[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryRecord, setRetryRecord] = useState<SolvedProblemRecord | null>(null);

  useEffect(() => {
    // LocalStorageはクライアントのみアクセス可能なため、マウント後に読み込む。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(getAllSolvedProblemRecords());
    setHasLoaded(true);
  }, []);

  const dueRecords = useMemo(() => records.filter((record) => isDueForReview(record.nextReviewAt)), [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSubject = subjectFilter === 'all' || record.problem.subject === subjectFilter;
      const matchesQuery =
        query.length === 0 ||
        record.problem.title.toLowerCase().includes(query) ||
        record.problem.unit.toLowerCase().includes(query);
      return matchesSubject && matchesQuery;
    });
  }, [records, subjectFilter, searchQuery]);

  const handleReviewed = (updated: SolvedProblemRecord) => {
    setRecords((prev) => prev.map((record) => (record.id === updated.id ? updated : record)));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-1 flex items-center gap-2">
        <BookMarked className="h-5 w-5 text-cyan-400" />
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">マイライブラリ</h1>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        解いた問題は自動でここに記録され、エビングハウスの忘却曲線に基づいて最適な復習タイミングをお知らせします。
      </p>

      {!hasLoaded ? (
        <p className="py-16 text-center text-sm text-slate-500">読み込み中...</p>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-10 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-sm text-slate-400">
            まだ解いた問題がありません。ワークスペースで問題を解くと、ここに記録されます。
          </p>
        </div>
      ) : (
        <>
          {/* 🔥 今日復習すべき過去問 */}
          {dueRecords.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-300">
                <Flame className="h-4 w-4" />
                今日復習すべき過去問（{dueRecords.length}件）
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dueRecords.map((record) => (
                  <SolvedProblemCard
                    key={record.id}
                    record={record}
                    onRetry={() => setRetryRecord(record)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 全ての解答履歴 */}
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">全ての解答履歴（{records.length}件）</h2>

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
                        : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-500'
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-8 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map((record) => (
                <SolvedProblemCard key={record.id} record={record} onRetry={() => setRetryRecord(record)} />
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

      {retryRecord && (
        <RetryProblemModal
          record={retryRecord}
          onClose={() => setRetryRecord(null)}
          onReviewed={handleReviewed}
        />
      )}
    </main>
  );
}

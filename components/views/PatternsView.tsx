'use client';

// ==========================================
// Apex Suite: Math Lab - パターン図鑑（常駐タブ）
// ==========================================

import { memo, useMemo } from 'react';
import { BookOpen } from 'lucide-react';

import SolutionPatternGrid from '@/components/patterns/SolutionPatternGrid';
import { selectLivePatternProgress, useUserStore } from '@/lib/store/userStore';

function PatternsView() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const { summary: completionSummary } = useMemo(
    () => selectLivePatternProgress({ clearedPatternIds, discoveredPatterns }),
    [clearedPatternIds, discoveredPatterns]
  );

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-10">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
        <BookOpen className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        パターン図鑑
      </h1>
      <p className="mb-2 text-sm font-medium tracking-tight text-cyan-700 dark:text-cyan-300">
        全{completionSummary.totalCount}パターン中 {completionSummary.clearedCount}パターン撃破（
        {completionSummary.completionPercent}% 制覇）
      </p>
      <p className="mb-5 text-sm text-slate-500 dark:text-zinc-400">
        教科タブから単元・サブトピック・パターンへドリルダウン。各階層から演習でき、パターン名は自由にリネームできます。新パターン解析に件数上限はありません。
      </p>
      <SolutionPatternGrid />
    </main>
  );
}

export default memo(PatternsView);

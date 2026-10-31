'use client';

// ==========================================
// Apex Suite: Math Lab - ホーム（常駐タブ）
// ==========================================

import { memo, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

import InstantGeneratorBar from '@/components/dashboard/InstantGeneratorBar';
import DailyMissionWidget from '@/components/dashboard/DailyMissionWidget';
import WeaknessRadarChart from '@/components/dashboard/WeaknessRadarChart';
import { selectLivePatternProgress, useUserStore } from '@/lib/store/userStore';

function DashboardView() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);

  const { summary: completionSummary, radarAxes: weaknessAxes } = useMemo(
    () => selectLivePatternProgress({ clearedPatternIds, discoveredPatterns }),
    [clearedPatternIds, discoveredPatterns]
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 lg:px-10">
      <InstantGeneratorBar />
      <DailyMissionWidget />
      <section className="rounded-2xl surface-panel p-4 backdrop-blur-md sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              弱点自動分析アナリティクス
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            全{completionSummary.totalCount}パターン中 {completionSummary.clearedCount}パターン撃破（
            <span className="font-medium text-cyan-600 dark:text-cyan-300">{completionSummary.completionPercent}%</span>
            {' '}制覇）
          </span>
        </div>
        <WeaknessRadarChart axes={weaknessAxes} />
      </section>
    </main>
  );
}

export default memo(DashboardView);

'use client';

// ==========================================
// Apex Suite: Math Lab - Main Dashboard
// ==========================================
// ホームは本質の3ブロックのみ:
// 1. 即時問題生成バー
// 2. デイリークエスト
// 3. 弱点自動分析アナリティクス
// 単元・模試・図鑑・武器庫・ライブラリはヘッダーナビへ一本化。

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

import WelcomeAuthView from '@/components/auth/WelcomeAuthView';
import InstantGeneratorBar from '@/components/dashboard/InstantGeneratorBar';
import DailyMissionWidget from '@/components/dashboard/DailyMissionWidget';
import WeaknessRadarChart from '@/components/dashboard/WeaknessRadarChart';

import { useAuthSession } from '@/lib/auth/useAuthSession';
import { selectLivePatternProgress, useUserStore } from '@/lib/store/userStore';

const GUEST_DEMO_WORKSPACE_HREF =
  '/workspace?unitId=math-1a-numbers-and-expressions&subtopicId=st-num-expand&patternId=sp-num-expand-t3&difficulty=3&source=guest-demo';

function DashboardHome() {
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
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 sm:p-5">
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

export default function Home() {
  const router = useRouter();
  const { user, ready } = useAuthSession();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isGuestDemo = useUserStore((state) => state.isGuestDemo);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const startGuestDemo = useUserStore((state) => state.startGuestDemo);

  const gateReady = ready && hasHydrated;
  const canEnterApp = Boolean(user) || isGuestDemo || isDeveloper;

  if (!gateReady) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">読み込み中...</p>
      </main>
    );
  }

  if (!canEnterApp) {
    return (
      <WelcomeAuthView
        onStartGuestDemo={() => {
          startGuestDemo();
          router.push(GUEST_DEMO_WORKSPACE_HREF);
        }}
      />
    );
  }

  return <DashboardHome />;
}

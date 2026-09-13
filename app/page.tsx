'use client';

// ==========================================
// Apex Suite: Math Lab - Main Dashboard（完全統合ダッシュボード）
// ==========================================
// トップ画面。以下の4ブロックを縦に配置する:
// 1. プレイヤーレベル & XPプログレスバー / 連続学習ストリーク / Energy
// 2. 🎯 本日のデイリーミッション（未攻略パターンから厳選した3問）
// 3. 📊 弱点自動分析アナリティクス（レーダーチャート）
// 4. 🚀 Quick Launch（4つのメイン機能へのナビゲーション）
//
// 未ログインかつゲスト未開始のときは WelcomeAuthView を最前面に出す。

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Target, BarChart3, Rocket } from 'lucide-react';

import WelcomeAuthView from '@/components/auth/WelcomeAuthView';
import InstantGeneratorBar from '@/components/dashboard/InstantGeneratorBar';
import PlayerStatusPanel from '@/components/dashboard/PlayerStatusPanel';
import DailyMissionWidget from '@/components/dashboard/DailyMissionWidget';
import DailyMissionCard from '@/components/dashboard/DailyMissionCard';
import QuickLaunchGrid from '@/components/dashboard/QuickLaunchGrid';
import WeaknessRadarChart from '@/components/dashboard/WeaknessRadarChart';

import { useAuthSession } from '@/lib/auth/useAuthSession';
import { selectLivePatternProgress, useUserStore, getTodayISODate } from '@/lib/store/userStore';
import { selectDailyMissionPatterns } from '@/lib/engine/adaptiveEngine';
import { SOLUTION_PATTERNS } from '@/data/patternsData';

const GUEST_DEMO_WORKSPACE_HREF =
  '/workspace?unitId=math-1a-numbers-and-expressions&subtopicId=st-num-expand&patternId=sp-num-expand-t3&difficulty=3&source=guest-demo';

function DashboardHome() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);

  const todayISO = useMemo(() => getTodayISODate(), []);

  const dailyMissions = useMemo(
    () => selectDailyMissionPatterns(SOLUTION_PATTERNS, clearedPatternIds, 3, todayISO),
    [clearedPatternIds, todayISO]
  );

  const { summary: completionSummary, radarAxes: weaknessAxes } = useMemo(
    () => selectLivePatternProgress({ clearedPatternIds, discoveredPatterns }),
    [clearedPatternIds, discoveredPatterns]
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      {/* 0. テキスト即時生成 / 写真OCR */}
      <InstantGeneratorBar />

      {/* 1. デイリークエスト */}
      <DailyMissionWidget />

      {/* 2. プレイヤーステータス */}
      <PlayerStatusPanel />

      {/* 3. デイリーミッション */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">本日の演習ミッション</h2>
          <span className="text-xs text-slate-500 dark:text-zinc-400">未攻略パターンの単元問題を3問</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {dailyMissions.map((pattern, index) => (
            <DailyMissionCard key={pattern.id} pattern={pattern} missionIndex={index} />
          ))}
        </div>
      </section>

      {/* 4. 弱点自動分析アナリティクス */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">弱点自動分析アナリティクス</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            全{completionSummary.totalCount}パターン中 {completionSummary.clearedCount}パターン撃破（
            <span className="font-bold text-cyan-600 dark:text-cyan-300">{completionSummary.completionPercent}%</span>
            {' '}制覇）
          </span>
        </div>
        <WeaknessRadarChart axes={weaknessAxes} />
      </section>

      {/* 5. Quick Launch */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Quick Launch</h2>
        </div>
        <QuickLaunchGrid />
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

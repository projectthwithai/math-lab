'use client';

// ==========================================
// Apex Suite: Math Lab - Main Dashboard（完全統合ダッシュボード）
// ==========================================
// トップ画面。以下の4ブロックを縦に配置する:
// 1. プレイヤーレベル & XPプログレスバー / 連続学習ストリーク / Energy
// 2. 🎯 本日のデイリーミッション（未攻略パターンから厳選した3問）
// 3. 📊 弱点自動分析アナリティクス（レーダーチャート）
// 4. 🚀 Quick Launch（4つのメイン機能へのナビゲーション）

import { useMemo } from 'react';
import { Target, BarChart3, Rocket } from 'lucide-react';

import InstantGeneratorBar from '@/components/dashboard/InstantGeneratorBar';
import PlayerStatusPanel from '@/components/dashboard/PlayerStatusPanel';
import DailyQuestBoard from '@/components/dashboard/DailyQuestBoard';
import DailyMissionCard from '@/components/dashboard/DailyMissionCard';
import QuickLaunchGrid from '@/components/dashboard/QuickLaunchGrid';
import WeaknessRadarChart from '@/components/patterns/WeaknessRadarChart';

import { useUserStore, getTodayISODate } from '@/lib/store/userStore';
import { selectDailyMissionPatterns } from '@/lib/engine/adaptiveEngine';
import { SOLUTION_PATTERNS, getWeaknessRadarData, getCompletionSummary } from '@/data/patternsData';

export default function Home() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);

  const todayISO = useMemo(() => getTodayISODate(), []);

  const dailyMissions = useMemo(
    () => selectDailyMissionPatterns(SOLUTION_PATTERNS, clearedPatternIds, 3, todayISO),
    [clearedPatternIds, todayISO]
  );

  const weaknessAxes = useMemo(() => getWeaknessRadarData(clearedPatternIds), [clearedPatternIds]);
  const completionSummary = useMemo(() => getCompletionSummary(clearedPatternIds), [clearedPatternIds]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      {/* 0. テキスト即時生成 / 写真OCR */}
      <InstantGeneratorBar />

      {/* 1. デイリークエスト */}
      <DailyQuestBoard />

      {/* 2. プレイヤーステータス */}
      <PlayerStatusPanel />

      {/* 3. デイリーミッション */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">本日のデイリーミッション</h2>
          <span className="text-xs text-slate-500">未攻略パターンから厳選した3問</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {dailyMissions.map((pattern, index) => (
            <DailyMissionCard key={pattern.id} pattern={pattern} missionIndex={index} />
          ))}
        </div>
      </section>

      {/* 4. 弱点自動分析アナリティクス */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">弱点自動分析アナリティクス</h2>
          </div>
          <span className="text-xs text-slate-500">
            全体攻略率: <span className="font-bold text-cyan-300">{completionSummary.completionPercent}%</span>
            {' '}({completionSummary.clearedCount}/{completionSummary.totalCount}パターン)
          </span>
        </div>
        <WeaknessRadarChart axes={weaknessAxes} />
      </section>

      {/* 5. Quick Launch */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Quick Launch</h2>
        </div>
        <QuickLaunchGrid />
      </section>
    </main>
  );
}

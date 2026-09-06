'use client';

// ==========================================
// Apex Suite: Math Lab - パターン図鑑 ＆ 弱点分析タブ
// ==========================================

import { useMemo } from 'react';
import WeaknessRadarChart from '@/components/patterns/WeaknessRadarChart';
import SolutionPatternGrid from '@/components/patterns/SolutionPatternGrid';
import { getWeaknessRadarData, getCompletionSummary } from '@/data/patternsData';
import { useUserStore } from '@/lib/store/userStore';

export default function PatternsPage() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);

  const weaknessAxes = useMemo(() => getWeaknessRadarData(clearedPatternIds), [clearedPatternIds]);
  const completionSummary = useMemo(() => getCompletionSummary(clearedPatternIds), [clearedPatternIds]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-white">📚 パターン図鑑</h1>
      <p className="mb-6 text-sm text-slate-500">
        入試お決まりの解法パターンをAI解説つきで攻略。自分流のコツに書き換えて記憶に定着させよう。
      </p>

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">📊 苦手分野レーダーチャート</h2>
          <span className="text-xs text-slate-500">
            全体攻略率:{' '}
            <span className="font-bold text-cyan-300">{completionSummary.completionPercent}%</span>
            {' '}({completionSummary.clearedCount}/{completionSummary.totalCount}パターン)
          </span>
        </div>
        <WeaknessRadarChart axes={weaknessAxes} />
      </section>

      <SolutionPatternGrid />
    </main>
  );
}

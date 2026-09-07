'use client';

// ==========================================
// Apex Suite: Math Lab - パターン図鑑 ＆ 弱点分析タブ
// ==========================================

import { useMemo } from 'react';
import { BookOpen, BarChart3 } from 'lucide-react';
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
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        <BookOpen className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        パターン図鑑
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        単元カードから枝分かれして解法パターンを選ぶ。静的図鑑（100本超）に加え、単元を開いて「新パターン解析（-10 Energy）」すると新しいパターンが追加されます。閲覧そのものは 0 Energy、自分流メモは「解法ロジック検証」で汎用性を検証できます。
      </p>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            <BarChart3 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            苦手分野レーダーチャート
          </h2>
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

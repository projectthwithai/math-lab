'use client';

// ==========================================
// Apex Suite: Math Lab - パターン図鑑 ＆ 武器庫（図鑑タブ）
// ==========================================

import { Suspense, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, BarChart3, Shield } from 'lucide-react';
import WeaknessRadarChart from '@/components/patterns/WeaknessRadarChart';
import SolutionPatternGrid from '@/components/patterns/SolutionPatternGrid';
import ArmoryCatalog from '@/components/armory/ArmoryCatalog';
import { getWeaknessRadarData, getCompletionSummary } from '@/data/patternsData';
import { useUserStore } from '@/lib/store/userStore';

type CatalogPane = 'patterns' | 'armory';

function PatternsCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pane: CatalogPane = searchParams.get('view') === 'armory' ? 'armory' : 'patterns';
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);

  const weaknessAxes = useMemo(() => getWeaknessRadarData(clearedPatternIds), [clearedPatternIds]);
  const completionSummary = useMemo(() => getCompletionSummary(clearedPatternIds), [clearedPatternIds]);

  const setPane = (next: CatalogPane) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'armory') params.set('view', 'armory');
    else params.delete('view');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          onClick={() => setPane('patterns')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            pane === 'patterns'
              ? 'bg-white text-cyan-600 shadow-sm dark:bg-slate-950 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="truncate">📚 解法パターン図鑑</span>
        </button>
        <button
          type="button"
          onClick={() => setPane('armory')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm ${
            pane === 'armory'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-950 dark:text-violet-300'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span className="truncate">🗡️ 定理・公式の武器庫</span>
        </button>
      </div>

      {pane === 'patterns' ? (
        <>
          <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
            パターン図鑑
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            単元 ➔ サブトピック ➔ 入試解法パターンの3層で探す。静的図鑑に加え、単元を開いて「新パターン解析（-10 Energy）」すると新しいパターンが追加されます。
          </p>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                <BarChart3 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                苦手分野レーダーチャート
              </h2>
              <span className="text-xs text-slate-500">
                全体攻略率:{' '}
                <span className="font-bold text-cyan-300">{completionSummary.completionPercent}%</span>{' '}
                ({completionSummary.clearedCount}/{completionSummary.totalCount}パターン)
              </span>
            </div>
            <WeaknessRadarChart axes={weaknessAxes} />
          </section>

          <SolutionPatternGrid />
        </>
      ) : (
        <>
          <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-violet-500 dark:text-violet-400" />
            武器庫
          </h1>
          <ArmoryCatalog />
        </>
      )}
    </main>
  );
}

export default function PatternsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <p className="text-sm text-slate-500">図鑑を読み込み中...</p>
        </main>
      }
    >
      <PatternsCatalogPage />
    </Suspense>
  );
}

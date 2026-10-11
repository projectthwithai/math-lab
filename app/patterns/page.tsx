'use client';

// ==========================================
// Apex Suite: Math Lab - パターン図鑑
// ==========================================
// 武器庫は /armory、弱点レーダーはホームへ一本化。このページは図鑑本体のみ。

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import CatalogFamilySwitch from '@/components/layout/CatalogFamilySwitch';
import SolutionPatternGrid from '@/components/patterns/SolutionPatternGrid';
import { selectLivePatternProgress, useUserStore } from '@/lib/store/userStore';

function PatternsCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const { summary: completionSummary } = selectLivePatternProgress({
    clearedPatternIds,
    discoveredPatterns,
  });

  useEffect(() => {
    if (searchParams.get('view') === 'armory') {
      router.replace('/armory');
    }
  }, [router, searchParams]);

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-10">
      <CatalogFamilySwitch active="patterns" />
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
        <BookOpen className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        パターン図鑑
      </h1>
      <p className="mb-2 text-sm font-medium tracking-tight text-cyan-700 dark:text-cyan-300">
        全{completionSummary.totalCount}パターン中 {completionSummary.clearedCount}パターン撃破（
        {completionSummary.completionPercent}% 制覇）
      </p>
      <p className="mb-5 text-sm text-slate-500 dark:text-zinc-400">
        単元、サブトピック、入試解法パターンの3層で探す。静的図鑑に加え、単元を開いて「新パターン解析（-10 Energy）」すると新しいパターンが追加されます。
      </p>
      <SolutionPatternGrid />
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

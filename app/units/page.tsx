'use client';

// ==========================================
// Apex Suite: Math Lab - 単元選択画面
// ==========================================

import { Zap } from 'lucide-react';
import UnitSelectionGrid from '@/components/unit/UnitSelectionGrid';

export default function UnitsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        <Zap className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        単元選択
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        解きたい単元を開き、教科書どおりのサブトピックから演習を始めてください。最上部の金色カードは単元総復習（ボスバトル）です。
      </p>
      <UnitSelectionGrid />
    </main>
  );
}

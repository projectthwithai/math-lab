'use client';

// ==========================================
// Apex Suite: Math Lab - 武器庫（定理・公式図鑑）
// ==========================================

import { Shield } from 'lucide-react';
import ArmoryCatalog from '@/components/armory/ArmoryCatalog';

export default function ArmoryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        <Shield className="h-5 w-5 text-violet-500 dark:text-violet-400" />
        武器庫
      </h1>
      <ArmoryCatalog />
    </main>
  );
}

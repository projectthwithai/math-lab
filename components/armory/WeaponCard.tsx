'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Card
// ==========================================
// 美術館のキャプションカード。公式名・数式・MASTERED（習得時のみ）。

import type { WeaponItem } from '@/types/mathLab';
import SafeKaTeX from '@/components/ui/SafeKaTeX';
import KaTeXText from '@/components/workspace/KaTeXText';

interface WeaponCardProps {
  weapon: WeaponItem;
  mastered?: boolean;
  onClick: () => void;
}

function formulaTextSize(latex: string): 'text-sm' | 'text-xs' {
  const compact = latex.replace(/\$/g, '').replace(/\\[a-zA-Z]+/g, 'X').replace(/[{}^_]/g, '');
  return compact.length >= 36 ? 'text-xs' : 'text-sm';
}

export default function WeaponCard({ weapon, mastered = false, onClick }: WeaponCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-w-0 w-full max-w-full flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-zinc-600"
    >
      {mastered && (
        <span className="absolute right-4 top-4 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] text-amber-200/90">
          MASTERED
        </span>
      )}
      <h3
        suppressHydrationWarning
        className={`min-w-0 text-[15px] font-medium tracking-tight text-zinc-100 ${mastered ? 'pr-24' : ''}`}
      >
        <KaTeXText text={weapon.name} />
      </h3>
      <div suppressHydrationWarning className="min-w-0 w-full max-w-full overflow-x-auto scrollbar-none text-zinc-400">
        <SafeKaTeX
          latex={weapon.formulaLaTeX}
          displayMode
          className={`${formulaTextSize(weapon.formulaLaTeX)} text-zinc-300`}
        />
      </div>
    </button>
  );
}

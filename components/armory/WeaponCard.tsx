'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Card
// ==========================================
// 武器庫の定理・公式カード。全て解放済みで、クリックすると詳細モーダルを開く。

import type { WeaponItem } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import SafeKaTeX from '@/components/ui/SafeKaTeX';

const RARITY_STYLES: Record<WeaponItem['rarity'], { label: string; badge: string }> = {
  common: { label: 'COMMON', badge: 'border-slate-600 text-slate-400' },
  rare: { label: 'RARE', badge: 'border-cyan-400/50 text-cyan-300' },
  epic: { label: 'EPIC', badge: 'border-violet-400/50 text-violet-300' },
  legendary: { label: 'LEGENDARY', badge: 'border-amber-400/50 text-amber-300' },
};

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
  const accent = SUBJECT_ACCENT[weapon.subject];
  const rarity = RARITY_STYLES[weapon.rarity];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 w-full max-w-full flex-col gap-2 overflow-x-auto scrollbar-none rounded-xl border ${accent.border} bg-white/80 p-4 text-left backdrop-blur-md transition-colors dark:bg-zinc-950/80 ${accent.borderHover} ${
        mastered ? 'shadow-[0_0_18px_rgba(251,191,36,0.28)] ring-1 ring-amber-300/40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border ${accent.border} px-2 py-0.5 text-[10px] font-bold ${accent.text}`}>
          {weapon.category}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {mastered && (
            <span className="rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-400/30 to-yellow-200/20 px-2 py-0.5 text-[9px] font-black tracking-wide text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.55)]">
              💎 MASTERED
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${rarity.badge}`}>
            {rarity.label}
          </span>
        </div>
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{weapon.name}</h3>
      <div className="min-w-0 w-full max-w-full overflow-x-auto scrollbar-none">
        <SafeKaTeX
          latex={weapon.formulaLaTeX}
          displayMode
          className={`${formulaTextSize(weapon.formulaLaTeX)} text-slate-700 dark:text-slate-300`}
        />
      </div>
    </button>
  );
}

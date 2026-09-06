'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Card
// ==========================================
// 武器庫の定理・公式カード。全て解放済みで、クリックすると詳細モーダルを開く。

import type { WeaponItem } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import KaTeXBlock from '@/components/workspace/KaTeXBlock';

const RARITY_STYLES: Record<WeaponItem['rarity'], { label: string; badge: string }> = {
  common: { label: 'COMMON', badge: 'border-slate-600 text-slate-400' },
  rare: { label: 'RARE', badge: 'border-cyan-400/50 text-cyan-300' },
  epic: { label: 'EPIC', badge: 'border-violet-400/50 text-violet-300' },
  legendary: { label: 'LEGENDARY', badge: 'border-amber-400/50 text-amber-300' },
};

interface WeaponCardProps {
  weapon: WeaponItem;
  onClick: () => void;
}

export default function WeaponCard({ weapon, onClick }: WeaponCardProps) {
  const accent = SUBJECT_ACCENT[weapon.subject];
  const rarity = RARITY_STYLES[weapon.rarity];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-xl border ${accent.border} bg-slate-900/70 p-4 text-left transition-all ${accent.borderHover} ${accent.shadowBase} ${accent.shadowHover}`}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full border ${accent.border} px-2 py-0.5 text-[10px] font-bold ${accent.text}`}>
          {weapon.category}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${rarity.badge}`}>
          {rarity.label}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white">{weapon.name}</h3>
      <KaTeXBlock content={weapon.formulaLaTeX} className="text-sm text-slate-300" />
    </button>
  );
}

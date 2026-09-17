'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Detail Modal
// ==========================================
// 「①使いどころ」「②発動条件」「③成り立ち（導出アニメーション）」を表示する詳細モーダル。

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Target, ListChecks, Sparkles, RotateCcw } from 'lucide-react';

import type { WeaponItem } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import SafeKaTeX from '@/components/ui/SafeKaTeX';
import KaTeXText from '@/components/workspace/KaTeXText';
import DerivationAnimator from './DerivationAnimator';
import WeaponMasteryQuiz from './WeaponMasteryQuiz';

interface WeaponDetailModalProps {
  weapon: WeaponItem;
  onClose: () => void;
}

function WeaponMasteredBadge({ weaponId }: { weaponId: string }) {
  const mastered = useUserStore((state) => state.masteredWeaponIds.includes(weaponId));
  const unmasterWeapon = useUserStore((state) => state.unmasterWeapon);
  if (!mastered) return null;

  const handleReset = () => {
    unmasterWeapon(weaponId);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleReset}
        className="rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-400/30 to-yellow-200/20 px-2 py-0.5 text-[10px] font-black tracking-wide text-amber-700 shadow-[0_0_12px_rgba(251,191,36,0.45)] transition hover:border-amber-200 hover:opacity-80 dark:text-amber-200"
        title="習得をリセット"
        aria-label="MASTERED を解除"
      >
        💎 MASTERED
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-0.5 rounded-full border border-slate-300/70 bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 transition hover:border-amber-400/50 hover:text-amber-700 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-amber-200"
      >
        <RotateCcw className="h-2.5 w-2.5" />
        ↺ 習得をリセット
      </button>
    </span>
  );
}

export default function WeaponDetailModal({ weapon, onClose }: WeaponDetailModalProps) {
  const accent = SUBJECT_ACCENT[weapon.subject];

  useEffect(() => {
    useUserStore.getState().unlockWeapon(weapon.id);
  }, [weapon.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800/60 dark:bg-[#0a0a0a]/95"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <span className={`rounded-full border ${accent.border} px-2.5 py-1 text-[11px] font-bold ${accent.text}`}>
          {weapon.category}
        </span>
        <h2 className="mt-2 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {weapon.name}
          <WeaponMasteredBadge weaponId={weapon.id} />
        </h2>
        <div className="mt-3 min-w-0 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white/80 p-4 scrollbar-none dark:border-slate-800 dark:bg-slate-900/60">
          <SafeKaTeX latex={weapon.formulaLaTeX} displayMode className="text-lg text-slate-900 dark:text-white" />
        </div>

        {/* ① 使いどころ */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-cyan-600 dark:text-cyan-400">
            <Target className="h-4 w-4" />
            使いどころ・効果
          </h3>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <KaTeXText text={weapon.usageScenario} />
          </p>
        </section>

        {/* ② 発動条件 */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-fuchsia-600 dark:text-fuchsia-400">
            <ListChecks className="h-4 w-4" />
            発動条件
          </h3>
          <ul className="space-y-1.5">
            {weapon.triggerConditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                <KaTeXText text={condition} className="min-w-0" />
              </li>
            ))}
          </ul>
        </section>

        {/* ③ 成り立ち */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-amber-600 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
            成り立ち（導出アニメーション）
          </h3>
          <DerivationAnimator steps={weapon.derivationSteps} />
        </section>

        <WeaponMasteryQuiz weapon={weapon} />
      </motion.div>
    </div>
  );
}

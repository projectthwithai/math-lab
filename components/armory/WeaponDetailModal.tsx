'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Detail Modal
// ==========================================
// 「①使いどころ」「②発動条件」「③成り立ち（導出アニメーション）」を表示する詳細モーダル。

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Target, ListChecks, Sparkles } from 'lucide-react';

import type { WeaponItem } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import { completeDailyQuest } from '@/lib/store/dailyQuestStore';
import KaTeXBlock from '@/components/workspace/KaTeXBlock';
import DerivationAnimator from './DerivationAnimator';

interface WeaponDetailModalProps {
  weapon: WeaponItem;
  onClose: () => void;
}

export default function WeaponDetailModal({ weapon, onClose }: WeaponDetailModalProps) {
  const accent = SUBJECT_ACCENT[weapon.subject];

  useEffect(() => {
    completeDailyQuest('check-weapon');
    useUserStore.getState().unlockWeapon(weapon.id);
  }, [weapon.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
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
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{weapon.name}</h2>
        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
          <KaTeXBlock content={weapon.formulaLaTeX} className="text-lg text-slate-900 dark:text-white" />
        </div>

        {/* ① 使いどころ */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-cyan-600 dark:text-cyan-400">
            <Target className="h-4 w-4" />
            使いどころ・効果
          </h3>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{weapon.usageScenario}</p>
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
                {condition}
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
      </motion.div>
    </div>
  );
}

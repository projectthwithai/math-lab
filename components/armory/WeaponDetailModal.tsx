'use client';

// ==========================================
// Apex Suite: Math Lab - Weapon Detail Modal
// ==========================================
// 「①使いどころ」「②発動条件」「③成り立ち（導出アニメーション）」を表示する詳細モーダル。

import { motion } from 'framer-motion';
import { X, Target, ListChecks, Sparkles } from 'lucide-react';

import type { WeaponItem } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import KaTeXBlock from '@/components/workspace/KaTeXBlock';
import DerivationAnimator from './DerivationAnimator';

interface WeaponDetailModalProps {
  weapon: WeaponItem;
  onClose: () => void;
}

export default function WeaponDetailModal({ weapon, onClose }: WeaponDetailModalProps) {
  const accent = SUBJECT_ACCENT[weapon.subject];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <span className={`rounded-full border ${accent.border} px-2.5 py-1 text-[11px] font-bold ${accent.text}`}>
          {weapon.category}
        </span>
        <h2 className="mt-2 text-xl font-black text-white">{weapon.name}</h2>
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <KaTeXBlock content={weapon.formulaLaTeX} className="text-lg text-white" />
        </div>

        {/* ① 使いどころ */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-cyan-300">
            <Target className="h-4 w-4" />① 使いどころ・効果
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">{weapon.usageScenario}</p>
        </section>

        {/* ② 発動条件 */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
            <ListChecks className="h-4 w-4" />② 発動条件
          </h3>
          <ul className="space-y-1.5">
            {weapon.triggerConditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                {condition}
              </li>
            ))}
          </ul>
        </section>

        {/* ③ 成り立ち */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-300">
            <Sparkles className="h-4 w-4" />③ 成り立ち（導出アニメーション）
          </h3>
          <DerivationAnimator steps={weapon.derivationSteps} />
        </section>
      </motion.div>
    </div>
  );
}

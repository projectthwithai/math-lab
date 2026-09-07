'use client';

// ==========================================
// Apex Suite: Math Lab - Player Status Panel
// ==========================================
// ダッシュボード上部に表示する「プレイヤーレベル & XPプログレスバー」
// 「🔥 連続学習ストリーク」「⚡ Energy」パネル。

import { motion } from 'framer-motion';
import { Flame, Zap, Trophy, Infinity as InfinityIcon } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';

export default function PlayerStatusPanel() {
  const level = useUserStore((state) => state.level);
  const xpIntoCurrentLevel = useUserStore((state) => state.xpIntoCurrentLevel);
  const xpRequiredForNextLevel = useUserStore((state) => state.xpRequiredForNextLevel);
  const streakDays = useUserStore((state) => state.streakDays);
  const energy = useUserStore((state) => state.energy);
  const maxEnergy = useUserStore((state) => state.maxEnergy);
  const isDeveloper = useUserStore((state) => state.isDeveloper);

  const xpRatio =
    xpRequiredForNextLevel > 0
      ? Math.max(0, Math.min(1, xpIntoCurrentLevel / xpRequiredForNextLevel))
      : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* レベル & XP */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-center">
              <Trophy className="mx-auto h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              <p className="text-sm font-semibold leading-none tracking-tight text-cyan-700 dark:text-cyan-300">Lv.{level}</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">プレイヤーレベル</span>
              <span className="text-slate-500">
                {xpIntoCurrentLevel} / {xpRequiredForNextLevel} XP
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpRatio * 100}%` }}
                transition={{ type: 'spring', duration: 0.8, bounce: 0.15 }}
              />
            </div>
          </div>
        </div>

        {/* ストリーク & エネルギー */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
            <Flame className="h-5 w-5 text-orange-500 dark:text-orange-300" />
            <div>
              <p className="text-[10px] leading-none text-orange-500/80 dark:text-orange-300/80">ストリーク</p>
              <p className="text-sm font-bold leading-tight text-orange-700 dark:text-orange-200">{streakDays}日連続</p>
            </div>
          </div>
          <div className="flex min-w-[9.5rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
            <Zap className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] leading-none text-amber-600/80 dark:text-amber-300/80">
                {isDeveloper ? 'Energy (Dev)' : 'Energy'}
              </p>
              <p className="text-sm font-bold leading-tight text-amber-700 dark:text-amber-200">
                {isDeveloper ? (
                  <span className="inline-flex items-center gap-1">
                    <InfinityIcon className="h-4 w-4" />
                    (Dev)
                  </span>
                ) : (
                  `${energy} / ${maxEnergy}`
                )}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-amber-400/20">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{
                    width: isDeveloper
                      ? '100%'
                      : `${Math.max(0, Math.min(100, (energy / Math.max(1, maxEnergy)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

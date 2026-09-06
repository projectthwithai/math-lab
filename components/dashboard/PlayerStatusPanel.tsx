'use client';

// ==========================================
// Apex Suite: Math Lab - Player Status Panel
// ==========================================
// ダッシュボード上部に表示する「プレイヤーレベル & XPプログレスバー」
// 「🔥 連続学習ストリーク」「⚡ Energy」パネル。

import { motion } from 'framer-motion';
import { Flame, Zap, Trophy } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';

export default function PlayerStatusPanel() {
  const level = useUserStore((state) => state.level);
  const xpIntoCurrentLevel = useUserStore((state) => state.xpIntoCurrentLevel);
  const xpRequiredForNextLevel = useUserStore((state) => state.xpRequiredForNextLevel);
  const streakDays = useUserStore((state) => state.streakDays);
  const energy = useUserStore((state) => state.energy);
  const maxEnergy = useUserStore((state) => state.maxEnergy);

  const xpRatio =
    xpRequiredForNextLevel > 0
      ? Math.max(0, Math.min(1, xpIntoCurrentLevel / xpRequiredForNextLevel))
      : 0;

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* レベル & XP */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <div className="text-center">
              <Trophy className="mx-auto h-4 w-4 text-cyan-300" />
              <p className="text-sm font-black leading-none text-cyan-200">Lv.{level}</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-slate-300">プレイヤーレベル</span>
              <span className="text-slate-500">
                {xpIntoCurrentLevel} / {xpRequiredForNextLevel} XP
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpRatio * 100}%` }}
                transition={{ type: 'spring', duration: 0.8, bounce: 0.15 }}
              />
            </div>
          </div>
        </div>

        {/* ストリーク & エネルギー */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2">
            <Flame className="h-5 w-5 text-orange-300" />
            <div>
              <p className="text-[10px] leading-none text-orange-300/80">ストリーク</p>
              <p className="text-sm font-bold leading-tight text-orange-200">{streakDays}日連続</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
            <Zap className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-[10px] leading-none text-amber-300/80">Energy</p>
              <p className="flex gap-0.5 text-sm font-bold leading-tight text-amber-200">
                {Array.from({ length: maxEnergy }, (_, i) => (
                  <span key={i} className={i < energy ? 'opacity-100' : 'opacity-25'}>
                    ⚡
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

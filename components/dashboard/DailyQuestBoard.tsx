'use client';

// ==========================================
// Apex Suite: Math Lab - Daily Quest Board
// ==========================================
// トップ画面上部の「🎯 本日のデイリークエスト (n/3)」。
// 達成済みクエストは報酬（+50 XP / Energy回復）をその場で受け取れる。

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Gift, Sparkles, Zap, Target } from 'lucide-react';

import { DAILY_QUESTS, type DailyQuestId } from '@/data/dailyQuests';
import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';

export default function DailyQuestBoard() {
  const hasHydrated = useDailyQuestStore((state) => state.hasHydrated);
  const completedIds = useDailyQuestStore((state) => state.completedIds);
  const claimedIds = useDailyQuestStore((state) => state.claimedIds);
  const claimQuest = useDailyQuestStore((state) => state.claimQuest);
  const ensureToday = useDailyQuestStore((state) => state.ensureToday);

  const [flash, setFlash] = useState<{ id: DailyQuestId; label: string } | null>(null);

  useEffect(() => {
    if (hasHydrated) ensureToday();
  }, [hasHydrated, ensureToday]);

  const completedCount = completedIds.length;
  const claimedCount = claimedIds.length;

  const handleClaim = (id: DailyQuestId) => {
    const result = claimQuest(id);
    if (!result) return;
    setFlash({ id, label: result.reward.label });
    window.setTimeout(() => setFlash(null), 2200);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-7">
      <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Daily Quest
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            <Target className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            本日のデイリークエスト
            <span className="text-lg font-medium text-slate-400">({completedCount}/3)</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            3つ達成して報酬を受け取ろう。報酬受け取り済み: {claimedCount}/3
          </p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / 3) * 100}%` }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
          />
        </div>
      </div>

      <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DAILY_QUESTS.map((quest) => {
          const isCompleted = completedIds.includes(quest.id);
          const isClaimed = claimedIds.includes(quest.id);
          const canClaim = isCompleted && !isClaimed;

          return (
            <li
              key={quest.id}
              className={`relative flex flex-col rounded-xl border p-4 backdrop-blur-md transition-colors ${
                isClaimed
                  ? 'border-emerald-400/30 bg-emerald-50/70 dark:bg-emerald-400/5'
                  : isCompleted
                    ? 'border-slate-300 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70'
                    : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                  {String(quest.index).padStart(2, '0')}
                </span>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                  {quest.reward.label}
                </span>
              </div>

              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {quest.title}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{quest.description}</p>

              <div className="mt-4">
                {isClaimed ? (
                  <p className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    報酬受け取り済み
                  </p>
                ) : canClaim ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(quest.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:border-slate-700 hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  >
                    {quest.reward.type === 'energy' ? (
                      <Zap className="h-3.5 w-3.5" />
                    ) : (
                      <Gift className="h-3.5 w-3.5" />
                    )}
                    報酬を受け取る（{quest.reward.label}）
                  </button>
                ) : (
                  <Link
                    href={quest.href}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-400/60 hover:text-cyan-700 dark:border-slate-600 dark:text-slate-300 dark:hover:text-cyan-300"
                  >
                    {quest.cta}
                  </Link>
                )}
              </div>

              <AnimatePresence>
                {flash?.id === quest.id && (
                  <motion.p
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute inset-x-3 top-2 z-10 flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-tight text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {flash.label} 獲得！
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

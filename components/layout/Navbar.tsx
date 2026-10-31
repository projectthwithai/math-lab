'use client';

// ==========================================
// Apex Suite: Math Lab - Global Navbar
// ==========================================

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Shield, Library, Flame, Zap, Home, Infinity as InfinityIcon, X, ClipboardCheck } from 'lucide-react';

import { useMainTab } from '@/components/layout/MainTabProvider';
import type { MainTabKey } from '@/lib/navigation/mainTabs';
import { useUserStore, DEFAULT_MAX_ENERGY, isQuestStreakGrantedToday } from '@/lib/store/userStore';
import { STREAK_QUEST_GOAL } from '@/data/dailyQuests';
import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import ThemeToggle from '@/components/layout/ThemeToggle';
import AuthButton from '@/components/layout/AuthButton';
import CloudSyncIndicator from '@/components/layout/CloudSyncIndicator';
import BrandMark from '@/components/layout/BrandMark';
import { SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';
import { signOut } from '@/lib/supabase/authSync';

interface NavTab {
  key: MainTabKey;
  label: string;
  icon: typeof BookOpen;
}

const NAV_TABS: NavTab[] = [
  { key: 'home', label: 'ホーム', icon: Home },
  { key: 'patterns', label: 'パターン図鑑', icon: BookOpen },
  { key: 'mock', label: '模試', icon: ClipboardCheck },
  { key: 'armory', label: '武器庫', icon: Shield },
  { key: 'library', label: 'ライブラリ', icon: Library },
];

export default function Navbar() {
  const { activeTab, onShell, setActiveTab } = useMainTab();
  const streakDays = useUserStore((state) => state.streakDays);
  const lastStreakGrantDateISO = useUserStore((state) => state.lastStreakGrantDateISO);
  const pendingStreakCelebration = useUserStore((state) => state.pendingStreakCelebration);
  const clearStreakCelebration = useUserStore((state) => state.clearStreakCelebration);
  const energy = useUserStore((state) => state.energy);
  const maxEnergy = useUserStore((state) => state.maxEnergy);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const completedQuestCount = useDailyQuestStore(
    (state) => state.quests.filter((quest) => quest.isCompleted).length
  );
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const energyCap = maxEnergy ?? DEFAULT_MAX_ENERGY;
  const isOvercapped = !isDeveloper && energy > energyCap;

  const handleSecureLogout = async () => {
    await signOut();
    window.location.assign('/');
  };

  const streakGrantedToday = isQuestStreakGrantedToday(lastStreakGrantDateISO);
  const questsUntilStreak = Math.max(0, STREAK_QUEST_GOAL - completedQuestCount);

  useEffect(() => {
    if (!authNotice) return;
    const linger = authNotice === SUPABASE_BOOTING_HINT ? 9000 : 5200;
    const timer = window.setTimeout(() => setAuthNotice(null), linger);
    return () => window.clearTimeout(timer);
  }, [authNotice]);

  useEffect(() => {
    if (pendingStreakCelebration == null) return;
    const timer = window.setTimeout(() => clearStreakCelebration(), 4800);
    return () => window.clearTimeout(timer);
  }, [pendingStreakCelebration, clearStreakCelebration]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/80 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-2.5 sm:px-6 md:py-3 lg:px-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex min-w-0 shrink cursor-pointer items-center overflow-hidden border-0 bg-transparent p-0"
            >
              <BrandMark size="nav" />
            </button>
            <span
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:text-xs ${
                streakGrantedToday
                  ? 'border-orange-400/50 bg-orange-400/10 text-orange-600 dark:border-orange-400/40 dark:bg-[#0b0d14] dark:text-orange-400'
                  : 'border-slate-200 bg-white text-orange-400/70 dark:border-zinc-800/80 dark:bg-[#0b0d14] dark:text-orange-400/55'
              }`}
              title={
                streakGrantedToday
                  ? `${streakDays}日連続`
                  : `あと${questsUntilStreak}問でストリーク更新`
              }
            >
              <Flame className={`h-3.5 w-3.5 ${streakGrantedToday ? '' : 'opacity-50'}`} />
              {streakDays}日
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5 text-[11px] font-medium sm:text-xs">
            <span
              className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 sm:px-2.5 ${
                isDeveloper
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-600 dark:border-amber-400/40 dark:bg-[#0b0d14] dark:text-amber-300'
                  : isOvercapped
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-600 dark:border-cyan-400/40 dark:bg-[#0b0d14] dark:text-cyan-300'
                    : 'border-slate-200 bg-white text-amber-500 dark:border-zinc-800/80 dark:bg-[#0b0d14] dark:text-amber-400'
              }`}
              title={
                isDeveloper
                  ? '無限スタミナ (Dev Mode)'
                  : isOvercapped
                    ? 'Energy 限界突破（最大 400）'
                    : 'Energy（1日 300 / 限界突破 400）'
              }
            >
              <Zap className="h-3.5 w-3.5" />
              {isDeveloper ? (
                <span className="inline-flex items-center gap-1">
                  <InfinityIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">(Dev)</span>
                </span>
              ) : (
                `${energy}/${energyCap}`
              )}
            </span>
            <ThemeToggle />
            <CloudSyncIndicator />
            <AuthButton
              onLogout={handleSecureLogout}
              onNotice={(message) => {
                setAuthNotice(message);
              }}
            />
          </div>
        </div>

        <nav aria-label="メインナビゲーション" className="hidden flex-wrap gap-1.5 md:flex">
          {NAV_TABS.map((tab) => {
            const isActive = onShell && activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className="relative cursor-pointer rounded-lg border-0 bg-transparent px-3 py-1.5 text-xs font-medium tracking-tight transition-colors sm:text-sm"
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-tab-indicator"
                    className="absolute inset-0 rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800/80 dark:bg-[#0b0d14]"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence>
        {pendingStreakCelebration != null && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="fixed inset-x-4 top-20 z-[70] mx-auto w-[min(92vw,28rem)] rounded-2xl border border-orange-400/50 bg-[#0b0d14] px-4 py-3.5 shadow-2xl sm:top-24"
            role="status"
          >
            <p className="text-center text-sm font-bold leading-relaxed text-orange-100 sm:text-base">
              本日の目標達成！ストリーク更新（{pendingStreakCelebration}日連続！）
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-amber-400/50 bg-[#0b0d14] px-4 py-3 shadow-xl md:bottom-5"
            role="status"
          >
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm leading-relaxed text-amber-100">{authNotice}</p>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="rounded-full p-1 text-zinc-400 transition-colors hover:text-zinc-100"
                aria-label="閉じる"
              >
                <X className="h-5 w-5 text-zinc-400 hover:text-zinc-100" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

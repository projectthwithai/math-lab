'use client';

// ==========================================
// Apex Suite: Math Lab - Global Navbar
// ==========================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, BookOpen, Shield, Library, Flame, Zap, Home, Infinity as InfinityIcon, X, ClipboardCheck } from 'lucide-react';

import { useUserStore, DEFAULT_MAX_ENERGY } from '@/lib/store/userStore';
import ThemeToggle from '@/components/layout/ThemeToggle';
import AuthButton from '@/components/layout/AuthButton';
import BrandMark from '@/components/layout/BrandMark';
import { SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';
import { signOut } from '@/lib/supabase/authSync';

interface NavTab {
  href: string;
  label: string;
  icon: typeof Compass;
  exact?: boolean;
}

const NAV_TABS: NavTab[] = [
  { href: '/', label: 'ホーム', icon: Home, exact: true },
  { href: '/units', label: '単元選択', icon: Compass },
  { href: '/mock-exam', label: '模試', icon: ClipboardCheck },
  { href: '/patterns', label: 'パターン図鑑', icon: BookOpen },
  { href: '/armory', label: '武器庫', icon: Shield },
  { href: '/library', label: 'ライブラリ', icon: Library },
];

export default function Navbar() {
  const pathname = usePathname();
  const streakDays = useUserStore((state) => state.streakDays);
  const energy = useUserStore((state) => state.energy);
  const maxEnergy = useUserStore((state) => state.maxEnergy);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const energyCap = maxEnergy ?? DEFAULT_MAX_ENERGY;
  const isOvercapped = !isDeveloper && energy > energyCap;

  const handleSecureLogout = async () => {
    await signOut();
    window.location.assign('/');
  };

  useEffect(() => {
    if (!authNotice) return;
    const linger = authNotice === SUPABASE_BOOTING_HINT ? 9000 : 5200;
    const timer = window.setTimeout(() => setAuthNotice(null), linger);
    return () => window.clearTimeout(timer);
  }, [authNotice]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/60 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-2.5 sm:px-6 md:py-3 lg:px-10">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center">
            <BrandMark size="nav" />
          </Link>

          <div className="flex shrink-0 items-center justify-end gap-1.5 text-[11px] font-medium sm:text-xs">
            <span
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-orange-500 dark:border-zinc-800/60 dark:bg-zinc-950/80 dark:text-orange-400"
              title="連続学習ストリーク"
            >
              <Flame className="h-3.5 w-3.5" />
              {streakDays}日
            </span>
            <span
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                isDeveloper
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-600 dark:border-amber-400/40 dark:bg-zinc-950/80 dark:text-amber-300'
                  : isOvercapped
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-600 dark:border-cyan-400/40 dark:bg-zinc-950/80 dark:text-cyan-300'
                    : 'border-slate-200 bg-white text-amber-500 dark:border-zinc-800/60 dark:bg-zinc-950/80 dark:text-amber-400'
              }`}
              title={isDeveloper ? '無限スタミナ (Dev Mode)' : isOvercapped ? 'Energy 限界突破' : 'Energy'}
            >
              <Zap className="h-3.5 w-3.5" />
              {isDeveloper ? (
                <span className="inline-flex items-center gap-1">
                  <InfinityIcon className="h-3.5 w-3.5" />
                  (Dev)
                </span>
              ) : (
                `${energy}/${energyCap}`
              )}
            </span>
            <ThemeToggle />
            {/* 未ログイン時は AuthButton が常時「Googleで保存」を強調表示する */}
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
            const isActive = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className="relative rounded-lg px-3 py-1.5 text-xs font-medium tracking-tight transition-colors sm:text-sm"
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-tab-indicator"
                    className="absolute inset-0 rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800/60 dark:bg-zinc-950/80"
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
              </Link>
            );
          })}
        </nav>
      </div>

      <AnimatePresence>
        {authNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-amber-400/50 bg-slate-950/95 px-4 py-3 shadow-xl md:bottom-5"
            role="status"
          >
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm leading-relaxed text-amber-100">{authNotice}</p>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="rounded-full p-0.5 text-amber-300/70 hover:text-white"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

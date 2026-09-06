'use client';

// ==========================================
// Apex Suite: Math Lab - Global Navbar
// ==========================================
// 全画面共通ヘッダー。ロゴ、4つの主要機能への遷移タブ、
// Energy（スタミナ）・連続学習ストリークの表示を行う。
// `app/layout.tsx` に1度だけ配置され、全ページで共有される。

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Compass, BookOpen, Swords, Library, Flame, Zap } from 'lucide-react';

import { useUserStore, DEFAULT_MAX_ENERGY } from '@/lib/store/userStore';

interface NavTab {
  href: string;
  label: string;
  icon: typeof Compass;
}

const NAV_TABS: NavTab[] = [
  { href: '/units', label: '単元選択', icon: Compass },
  { href: '/patterns', label: 'パターン図鑑', icon: BookOpen },
  { href: '/armory', label: '武器庫', icon: Swords },
  { href: '/library', label: 'ライブラリ', icon: Library },
];

export default function Navbar() {
  const pathname = usePathname();
  const streakDays = useUserStore((state) => state.streakDays);
  const energy = useUserStore((state) => state.energy);
  const maxEnergy = useUserStore((state) => state.maxEnergy);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)]">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="hidden sm:inline">Apex Suite: Math Lab</span>
            <span className="sm:hidden">Math Lab</span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold sm:text-xs">
            <span
              className="flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-orange-300"
              title="連続学習ストリーク"
            >
              <Flame className="h-3.5 w-3.5" />
              {streakDays}日
            </span>
            <span
              className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-amber-300"
              title="Energy（スタミナ）"
            >
              <Zap className="h-3.5 w-3.5" />
              {energy}/{maxEnergy ?? DEFAULT_MAX_ENERGY}
            </span>
          </div>
        </div>

        <nav aria-label="メインナビゲーション" className="flex flex-wrap gap-1.5">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className="relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm"
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-cyan-400/15 ring-1 ring-inset ring-cyan-400/50"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
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
    </header>
  );
}

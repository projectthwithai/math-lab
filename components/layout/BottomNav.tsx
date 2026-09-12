'use client';

// ==========================================
// Apex Suite: Math Lab - Mobile Bottom Nav
// ==========================================
// スマホ専用 5 タブ。全角 2 文字ラベルで親指操作・文字見切れを防ぐ。

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookMarked, BookOpen, GraduationCap, Home, RotateCcw } from 'lucide-react';

const TABS = [
  { href: '/', label: 'ホーム', icon: Home, match: (path: string) => path === '/' },
  {
    href: '/units',
    label: '学習',
    icon: BookOpen,
    match: (path: string) => path === '/unit' || path.startsWith('/units') || path.startsWith('/workspace'),
  },
  {
    href: '/mock-exam',
    label: '模試',
    icon: GraduationCap,
    match: (path: string) => path.startsWith('/mock-exam'),
  },
  {
    href: '/patterns',
    label: '図鑑',
    icon: BookMarked,
    match: (path: string) => path.startsWith('/patterns') || path.startsWith('/armory'),
  },
  {
    href: '/library',
    label: '復習',
    icon: RotateCcw,
    match: (path: string) => path.startsWith('/library'),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/85 pb-safe backdrop-blur-lg dark:border-zinc-800/60 dark:bg-black/85 md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-w-0 flex-col items-center gap-0.5 px-1 pt-2 pb-2.5 text-center ${
                isActive ? 'font-semibold text-cyan-400' : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

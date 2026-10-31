'use client';

// ==========================================
// Apex Suite: Math Lab - Mobile Bottom Nav
// ==========================================
// 黄金の5大タブ。シェル上ではページ遷移せず、表示中のタブだけを切り替える。

import { BookOpen, GraduationCap, Home, Library, Shield } from 'lucide-react';

import { useMainTab } from '@/components/layout/MainTabProvider';
import type { MainTabKey } from '@/lib/navigation/mainTabs';
import { usePathname } from 'next/navigation';

const TABS: Array<{
  key: MainTabKey;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
}> = [
  { key: 'home', label: 'ホーム', icon: Home, match: (path) => path === '/' },
  {
    key: 'patterns',
    label: '図鑑',
    icon: BookOpen,
    match: (path) =>
      path === '/unit' || path.startsWith('/units') || path.startsWith('/patterns') || path.startsWith('/workspace'),
  },
  {
    key: 'mock',
    label: '模試',
    icon: GraduationCap,
    match: (path) => path.startsWith('/mock-exam'),
  },
  {
    key: 'armory',
    label: '武器庫',
    icon: Shield,
    match: (path) => path.startsWith('/armory'),
  },
  {
    key: 'library',
    label: '復習',
    icon: Library,
    match: (path) => path.startsWith('/library'),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { activeTab, onShell, setActiveTab } = useMainTab();

  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/85 pb-safe backdrop-blur-lg dark:border-zinc-800/80 dark:bg-black/85 md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = onShell ? activeTab === tab.key : tab.match(pathname);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-w-0 cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent px-1 pt-2 pb-2.5 text-center ${
                isActive ? 'font-semibold text-cyan-400' : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

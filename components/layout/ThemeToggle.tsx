'use client';

// ==========================================
// Apex Suite: Math Lab - Theme Toggle
// ==========================================

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

function subscribe() {
  return () => undefined;
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = !mounted || resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-zinc-800/60 dark:bg-zinc-950/80 dark:hover:border-zinc-700"
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={isDark ? 'ライトモード' : 'ダークモード'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-500" />
      )}
    </button>
  );
}

'use client';

// モバイルではヘッダーの図鑑/武器庫タブが非表示のため、図鑑系ページ内で一本化する。
// md以上はグローバルナビが唯一のルートなので出さない。

import Link from 'next/link';
import { BookOpen, Shield } from 'lucide-react';

interface CatalogFamilySwitchProps {
  active: 'patterns' | 'armory';
}

const ITEMS = [
  { id: 'patterns' as const, href: '/patterns', label: '図鑑', icon: BookOpen },
  { id: 'armory' as const, href: '/armory', label: '武器庫', icon: Shield },
] as const;

export default function CatalogFamilySwitch({ active }: CatalogFamilySwitchProps) {
  return (
    <nav
      aria-label="図鑑と武器庫"
      className="mb-4 flex w-fit rounded-lg border border-slate-200 p-0.5 dark:border-zinc-800 md:hidden"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
              isActive
                ? 'bg-slate-100 text-cyan-700 dark:bg-zinc-900 dark:text-cyan-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

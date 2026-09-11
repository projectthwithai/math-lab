'use client';

// ==========================================
// Math Lab - Brand mark（Math Lab 主役 / Apex は控え目）
// ==========================================

import { Sparkles } from 'lucide-react';

type BrandMarkSize = 'nav' | 'welcome' | 'hero';

interface BrandMarkProps {
  size?: BrandMarkSize;
  className?: string;
}

const SIZE: Record<
  BrandMarkSize,
  { iconBox: string; icon: string; title: string; badge: string; stack: string }
> = {
  nav: {
    iconBox: 'h-8 w-8 rounded-lg',
    icon: 'h-4 w-4',
    title: 'text-base font-extrabold tracking-tight sm:text-lg',
    badge: 'text-[8px] tracking-[0.16em]',
    stack: 'gap-0.5',
  },
  welcome: {
    iconBox: 'h-9 w-9 rounded-xl',
    icon: 'h-4 w-4',
    title: 'text-lg font-extrabold tracking-tight sm:text-xl',
    badge: 'text-[8px] tracking-[0.18em]',
    stack: 'gap-0.5',
  },
  hero: {
    iconBox: 'h-12 w-12 rounded-2xl',
    icon: 'h-6 w-6',
    title: 'text-4xl font-black tracking-tight sm:text-6xl',
    badge: 'text-[10px] tracking-[0.22em]',
    stack: 'gap-1.5',
  },
};

export default function BrandMark({ size = 'nav', className = '' }: BrandMarkProps) {
  const spec = SIZE[size];

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-400 ${spec.iconBox}`}
      >
        <Sparkles className={spec.icon} />
      </span>
      <span className={`flex min-w-0 flex-col ${spec.stack}`}>
        <span className={`leading-none text-slate-900 dark:text-white ${spec.title}`}>Math Lab</span>
        <span
          className={`font-medium uppercase leading-none text-slate-400 dark:text-slate-500 ${spec.badge}`}
        >
          AI LEARNING OS BY APEX
        </span>
      </span>
    </span>
  );
}

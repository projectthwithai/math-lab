// ==========================================
// Apex Suite: Math Lab - Subject Accent Colors
// ==========================================
// .cursorrules準拠のアクセントカラー（math=cyan-400, physics=violet-400,
// chemistry=emerald-400）を、複数のコンポーネントで共有するための定義。
//
// NOTE: Tailwindはソースコードを静的スキャンしてクラスを生成するため、
// 各クラス文字列は「完全な形（variantプレフィックスも含む）」で書き切ること。
// `hover:${accent.bg}` のように実行時に文字列結合すると、Tailwindが
// そのクラスを検出できずCSSが生成されないので絶対に行わないこと。

import type { Subject } from '@/types/mathLab';

export interface SubjectAccent {
  text: string;
  border: string;
  borderHover: string;
  shadowBase: string;
  shadowHover: string;
  focusRingColor: string;
  bg: string;
  bgSoft: string;
  bgSoftHover: string;
  gradient: string;
}

export const SUBJECT_ACCENT: Record<Subject, SubjectAccent> = {
  math: {
    text: 'text-cyan-400',
    border: 'border-slate-200 dark:border-slate-800',
    borderHover: 'hover:border-cyan-400/40',
    shadowBase: 'shadow-none',
    shadowHover: 'hover:bg-slate-50/80 dark:hover:bg-slate-900/80',
    focusRingColor: 'focus-visible:ring-cyan-400/60',
    bg: 'bg-cyan-400',
    bgSoft: 'bg-cyan-400/10',
    bgSoftHover: 'hover:bg-cyan-400/10',
    gradient: 'from-cyan-400/20 via-transparent to-transparent',
  },
  physics: {
    text: 'text-violet-400',
    border: 'border-slate-200 dark:border-slate-800',
    borderHover: 'hover:border-violet-400/40',
    shadowBase: 'shadow-none',
    shadowHover: 'hover:bg-slate-50/80 dark:hover:bg-slate-900/80',
    focusRingColor: 'focus-visible:ring-violet-400/60',
    bg: 'bg-violet-400',
    bgSoft: 'bg-violet-400/10',
    bgSoftHover: 'hover:bg-violet-400/10',
    gradient: 'from-violet-400/20 via-transparent to-transparent',
  },
  chemistry: {
    text: 'text-emerald-400',
    border: 'border-slate-200 dark:border-slate-800',
    borderHover: 'hover:border-emerald-400/40',
    shadowBase: 'shadow-none',
    shadowHover: 'hover:bg-slate-50/80 dark:hover:bg-slate-900/80',
    focusRingColor: 'focus-visible:ring-emerald-400/60',
    bg: 'bg-emerald-400',
    bgSoft: 'bg-emerald-400/10',
    bgSoftHover: 'hover:bg-emerald-400/10',
    gradient: 'from-emerald-400/20 via-transparent to-transparent',
  },
};

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
    border: 'border-cyan-400/30',
    borderHover: 'hover:border-cyan-400/70',
    shadowBase: 'shadow-[0_0_16px_rgba(34,211,238,0.25)]',
    shadowHover: 'hover:shadow-[0_0_28px_rgba(34,211,238,0.55)]',
    focusRingColor: 'focus-visible:ring-cyan-400/60',
    bg: 'bg-cyan-400',
    bgSoft: 'bg-cyan-400/10',
    bgSoftHover: 'hover:bg-cyan-400/10',
    gradient: 'from-cyan-400/20 via-transparent to-transparent',
  },
  physics: {
    text: 'text-violet-400',
    border: 'border-violet-400/30',
    borderHover: 'hover:border-violet-400/70',
    shadowBase: 'shadow-[0_0_16px_rgba(167,139,250,0.25)]',
    shadowHover: 'hover:shadow-[0_0_28px_rgba(167,139,250,0.55)]',
    focusRingColor: 'focus-visible:ring-violet-400/60',
    bg: 'bg-violet-400',
    bgSoft: 'bg-violet-400/10',
    bgSoftHover: 'hover:bg-violet-400/10',
    gradient: 'from-violet-400/20 via-transparent to-transparent',
  },
  chemistry: {
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
    borderHover: 'hover:border-emerald-400/70',
    shadowBase: 'shadow-[0_0_16px_rgba(52,211,153,0.25)]',
    shadowHover: 'hover:shadow-[0_0_28px_rgba(52,211,153,0.55)]',
    focusRingColor: 'focus-visible:ring-emerald-400/60',
    bg: 'bg-emerald-400',
    bgSoft: 'bg-emerald-400/10',
    bgSoftHover: 'hover:bg-emerald-400/10',
    gradient: 'from-emerald-400/20 via-transparent to-transparent',
  },
};

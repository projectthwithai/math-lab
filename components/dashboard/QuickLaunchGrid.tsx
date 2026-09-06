'use client';

// ==========================================
// Apex Suite: Math Lab - Quick Launch Grid
// ==========================================
// 「🚀 Quick Launch」: 4つのメイン機能へのサイバーパンク風ナビゲーションカード。

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, BookOpen, Swords, Library, type LucideIcon } from 'lucide-react';

interface QuickLaunchItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentText: string;
  accentGroupHoverText: string;
  accentBorder: string;
  accentShadow: string;
  accentGlow: string;
}

// NOTE: Tailwindは各クラス文字列を完全な形でソース上に静的に書く必要があるため、
// `group-hover:${accentText}` のような実行時文字列結合はしない
// （テンプレートリテラルだとクラスが検出されずCSSが生成されない）。
const QUICK_LAUNCH_ITEMS: QuickLaunchItem[] = [
  {
    href: '/units',
    title: '単元から選ぶ',
    description: '数学・物理・化学の全単元から、解きたいテーマを選んで出題する。',
    icon: Compass,
    accentText: 'text-cyan-300',
    accentGroupHoverText: 'group-hover:text-cyan-300',
    accentBorder: 'border-cyan-400/30 hover:border-cyan-400/70',
    accentShadow: 'hover:shadow-[0_0_28px_rgba(34,211,238,0.4)]',
    accentGlow: 'bg-cyan-400/10',
  },
  {
    href: '/patterns',
    title: '解法パターン図鑑を見る',
    description: '入試お決まりパターンをAI解説つきで攻略。自分流の解き方も書き込める。',
    icon: BookOpen,
    accentText: 'text-fuchsia-300',
    accentGroupHoverText: 'group-hover:text-fuchsia-300',
    accentBorder: 'border-fuchsia-400/30 hover:border-fuchsia-400/70',
    accentShadow: 'hover:shadow-[0_0_28px_rgba(232,121,249,0.4)]',
    accentGlow: 'bg-fuchsia-400/10',
  },
  {
    href: '/armory',
    title: '武器庫を開く',
    description: '定理・公式図鑑。使いどころ・発動条件・成り立ちアニメーションを確認。',
    icon: Swords,
    accentText: 'text-violet-300',
    accentGroupHoverText: 'group-hover:text-violet-300',
    accentBorder: 'border-violet-400/30 hover:border-violet-400/70',
    accentShadow: 'hover:shadow-[0_0_28px_rgba(167,139,250,0.4)]',
    accentGlow: 'bg-violet-400/10',
  },
  {
    href: '/library',
    title: 'マイライブラリで復習',
    description: '忘却曲線に基づき、今日復習すべき過去問を優先的にリストアップ。',
    icon: Library,
    accentText: 'text-emerald-300',
    accentGroupHoverText: 'group-hover:text-emerald-300',
    accentBorder: 'border-emerald-400/30 hover:border-emerald-400/70',
    accentShadow: 'hover:shadow-[0_0_28px_rgba(52,211,153,0.4)]',
    accentGlow: 'bg-emerald-400/10',
  },
];

export default function QuickLaunchGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUICK_LAUNCH_ITEMS.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Link
              href={item.href}
              className={`group flex h-full flex-col justify-between rounded-xl border ${item.accentBorder} bg-slate-900/70 p-4 transition-all ${item.accentShadow}`}
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${item.accentGlow} ${item.accentText}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3
                className={`text-sm font-bold text-white transition-colors ${item.accentGroupHoverText}`}
              >
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - Quick Launch Grid
// ==========================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, BookOpen, Shield, Library, ClipboardCheck, type LucideIcon } from 'lucide-react';

interface QuickLaunchItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentText: string;
}

const QUICK_LAUNCH_ITEMS: QuickLaunchItem[] = [
  {
    href: '/units',
    title: '単元から選ぶ',
    description: '数学・物理・化学の全単元から、解きたいテーマを選んで出題する。',
    icon: Compass,
    accentText: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    href: '/mock-exam',
    title: '全国統一AI実践模試',
    description: '範囲・時間を選んでタイマー模試。偏差値と保護者共有レポートまで一気通貫。',
    icon: ClipboardCheck,
    accentText: 'text-amber-500 dark:text-amber-300',
  },
  {
    href: '/patterns',
    title: '解法パターン図鑑を見る',
    description: '入試お決まりパターンを解法の真髄つきで攻略。自分流の解き方も書き込める。',
    icon: BookOpen,
    accentText: 'text-fuchsia-500 dark:text-fuchsia-400',
  },
  {
    href: '/patterns?view=armory',
    title: '武器庫を開く',
    description: '定理・公式図鑑。使いどころ・発動条件・成り立ちアニメーションを確認。',
    icon: Shield,
    accentText: 'text-violet-500 dark:text-violet-400',
  },
  {
    href: '/library',
    title: 'マイライブラリで復習',
    description: '忘却曲線に基づき、今日復習すべき過去問を優先的にリストアップ。',
    icon: Library,
    accentText: 'text-emerald-500 dark:text-emerald-400',
  },
];

export default function QuickLaunchGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur-md transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 ${item.accentText}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
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

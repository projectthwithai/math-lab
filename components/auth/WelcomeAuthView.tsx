'use client';

// ==========================================
// Apex Suite: Math Lab - Welcome & Google Auth first view
// ==========================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Flame, RefreshCw, Swords } from 'lucide-react';

import ThemeToggle from '@/components/layout/ThemeToggle';
import BrandMark from '@/components/layout/BrandMark';
import { signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseNetworkError, SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';
import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';

interface WelcomeAuthViewProps {
  onStartGuestDemo: () => void;
}

const FEATURES = [
  {
    icon: Swords,
    title: '106個の武器庫',
    body: '成り立ちアニメーション付き定理・公式図鑑',
    accent: 'from-cyan-400/20 to-cyan-400/5 text-cyan-600 dark:text-cyan-300',
  },
  {
    icon: Brain,
    title: '思考逆算ツリー',
    body: 'ゴールから条件への思考プロセスを完全可視化',
    accent: 'from-violet-400/20 to-violet-400/5 text-violet-600 dark:text-violet-300',
  },
  {
    icon: RefreshCw,
    title: '完全0円無限演習',
    body: '同じパターンの数字違い類題を一生解き放題',
    accent: 'from-emerald-400/20 to-emerald-400/5 text-emerald-600 dark:text-emerald-300',
  },
] as const;

export default function WelcomeAuthView({ onStartGuestDemo }: WelcomeAuthViewProps) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGoogleStart = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await signInWithGoogleOAuth();
      if (!result.ok) {
        setNotice(result.error);
        setBusy(false);
      }
    } catch (error) {
      console.error('[WelcomeAuthView] Google ログインに失敗しました', error);
      if (isSupabaseNetworkError(error)) {
        activateLocalDeveloperFallback();
        setNotice(SUPABASE_BOOTING_HINT);
      }
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-8rem] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-[-6rem] h-96 w-96 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10"
      />

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-10 flex items-center justify-between">
          <BrandMark size="welcome" />
          <ThemeToggle />
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center text-center"
        >
          <BrandMark size="hero" className="mb-6 justify-center" />
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            理数AI学習OS
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            東大・難関大レベルまで、最短で思考力を覚醒させる理数AI学習OS
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
            武器庫・逆算ツリー・ゼロコスト無限演習で、解法パターンを身体に染み込ませる。
          </p>

          <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08, duration: 0.4 }}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-b ${feature.accent} p-4 text-left backdrop-blur-md dark:border-slate-800`}
                >
                  <Icon className="mb-3 h-5 w-5" />
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{feature.title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{feature.body}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleGoogleStart();
              }}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(34,211,238,0.18)] transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              Googleアカウントで今すぐ始める
            </button>
            <button
              type="button"
              onClick={onStartGuestDemo}
              className="text-sm font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
            >
              ログインせずに1問だけ体験してみる
            </button>
            {notice && (
              <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {notice}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

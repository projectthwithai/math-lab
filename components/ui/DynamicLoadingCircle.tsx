'use client';

// ==========================================
// Math Lab - Dynamic Loading Circle
// ==========================================
// 問題生成中など、画面が止まっていないことをすぐ伝える二重ネオンリング。

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STATUS_MESSAGES = [
  'AIが問題の条件を構成中...',
  '数式モデルを解析中...',
  '思考逆算ツリーを構築中...',
] as const;

const MESSAGE_INTERVAL_MS = 1500;

type LoadingSize = 'md' | 'lg';

interface DynamicLoadingCircleProps {
  size?: LoadingSize;
  className?: string;
  label?: string;
}

const SIZE: Record<LoadingSize, { box: string; core: string; glow: string; text: string }> = {
  md: {
    box: 'h-28 w-28',
    core: 'h-10 w-10',
    glow: 'shadow-[0_0_28px_rgba(34,211,238,0.45)]',
    text: 'text-xs',
  },
  lg: {
    box: 'h-44 w-44 sm:h-52 sm:w-52',
    core: 'h-16 w-16 sm:h-20 sm:w-20',
    glow: 'shadow-[0_0_48px_rgba(34,211,238,0.55)]',
    text: 'text-sm sm:text-base',
  },
};

export default function DynamicLoadingCircle({
  size = 'lg',
  className = '',
  label,
}: DynamicLoadingCircleProps) {
  const spec = SIZE[size];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-7 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={`relative ${spec.box}`}>
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke="url(#math-lab-ring-outer)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="78 210"
            className="drop-shadow-[0_0_10px_rgba(34,211,238,0.85)]"
          />
          <defs>
            <linearGradient id="math-lab-ring-outer" x1="0" y1="0" x2="120" y2="120">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="55%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120" fill="none" aria-hidden>
          <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="1.5" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="60"
            cy="60"
            r="40"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-cyan-400/25 dark:text-cyan-300/20"
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`block rounded-full bg-gradient-to-br from-cyan-300/80 to-violet-400/70 ${spec.core} ${spec.glow} animate-pulse`}
          />
        </div>
      </div>

      <div className="min-h-8 px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={label ?? STATUS_MESSAGES[messageIndex]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`font-medium tracking-wide text-slate-500 dark:text-slate-400 ${spec.text}`}
          >
            {label ?? STATUS_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <span className="sr-only">問題を生成しています</span>
    </div>
  );
}

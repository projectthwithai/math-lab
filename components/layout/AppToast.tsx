'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { useAppToastStore } from '@/lib/store/appToastStore';

export default function AppToast() {
  const message = useAppToastStore((state) => state.message);
  const tone = useAppToastStore((state) => state.tone);
  const clearToast = useAppToastStore((state) => state.clearToast);
  const isError = tone === 'error' || Boolean(message?.startsWith('クラウド同期エラー'));

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => clearToast(), isError ? 5600 : 2400);
    return () => window.clearTimeout(timer);
  }, [message, isError, clearToast]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`fixed bottom-24 left-1/2 z-[90] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border px-4 py-3 shadow-xl md:bottom-5 ${
            isError
              ? 'border-amber-400/50 bg-[#0b0d14]'
              : 'border-emerald-400/40 bg-[#0b0d14]'
          }`}
          role="status"
        >
          <p
            className={`flex items-center gap-2 text-sm font-semibold leading-relaxed ${
              isError ? 'text-amber-100' : 'text-emerald-100'
            }`}
          >
            {isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            )}
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

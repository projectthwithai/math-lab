'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { useAppToastStore } from '@/lib/store/appToastStore';

export default function AppToast() {
  const message = useAppToastStore((state) => state.message);
  const clearToast = useAppToastStore((state) => state.clearToast);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => clearToast(), 2400);
    return () => window.clearTimeout(timer);
  }, [message, clearToast]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-24 left-1/2 z-[90] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-[#0b0d14] px-4 py-3 shadow-xl md:bottom-5"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-semibold leading-relaxed text-emerald-100">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

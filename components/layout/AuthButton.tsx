'use client';

// ==========================================
// Apex Suite: Math Lab - Google Auth Button
// ==========================================

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, LogOut, UserRound, X } from 'lucide-react';

import { signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseNetworkError, SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';
import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';
import { useAuthSession } from '@/lib/auth/useAuthSession';
import { signOut } from '@/lib/supabase/authSync';

interface AuthButtonProps {
  onNotice?: (message: string) => void;
  onLogout?: () => Promise<void> | void;
}

export default function AuthButton({ onNotice, onLogout }: AuthButtonProps) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useAuthSession({
    onNetworkHint: (message) => {
      if (onNotice) {
        onNotice(message);
        return;
      }
      setToast(message);
    },
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showNotice = (message: string) => {
    if (onNotice) {
      onNotice(message);
      return;
    }
    setToast(message);
  };

  const handleLogin = async () => {
    setBusy(true);
    try {
      const result = await signInWithGoogleOAuth();
      if (!result.ok) {
        showNotice(result.error);
        setBusy(false);
      }
    } catch (error) {
      console.error('[AuthButton] Google ログインに失敗しました', error);
      if (isSupabaseNetworkError(error)) {
        activateLocalDeveloperFallback();
        showNotice(SUPABASE_BOOTING_HINT);
      }
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      if (onLogout) {
        await onLogout();
        return;
      }
      await signOut();
      window.location.assign('/');
    } finally {
      setBusy(false);
    }
  };

  const toastNode = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-amber-400/50 bg-slate-950/95 px-4 py-3 shadow-xl md:bottom-5"
          role="status"
        >
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm leading-relaxed text-amber-100">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-full p-0.5 text-amber-300/70 hover:text-white"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (user) {
    const name =
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      user.email ||
      'アカウント';
    const avatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;

    return (
      <>
        <div className="flex items-center gap-1.5">
          <span
            className="flex max-w-[9.5rem] items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-800 dark:text-cyan-200 sm:max-w-[14rem] sm:text-xs"
            title={name}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-4 w-4 rounded-full" />
            ) : (
              <UserRound className="h-3.5 w-3.5" />
            )}
            <span className="hidden truncate sm:inline">{name}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={busy}
            className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-cyan-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
        {toastNode}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleLogin();
        }}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-400/25 via-orange-400/15 to-cyan-400/20 px-3 py-1.5 text-[11px] font-bold tracking-tight text-amber-800 shadow-[0_0_18px_rgba(251,191,36,0.25)] transition hover:border-amber-300 dark:border-amber-400/50 dark:from-amber-400/20 dark:to-cyan-400/10 dark:text-amber-200 sm:text-xs"
      >
        <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
        <span className="hidden sm:inline">Googleで保存</span>
        <span className="sm:hidden">保存</span>
      </button>
      {toastNode}
    </>
  );
}

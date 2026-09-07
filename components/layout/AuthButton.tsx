'use client';

// ==========================================
// Apex Suite: Math Lab - Google Auth Button
// ==========================================

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, UserRound, X } from 'lucide-react';

import { getSupabaseBrowserClient, signInWithGoogleOAuth } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/authSync';

interface AuthButtonProps {
  onNotice?: (message: string) => void;
}

export default function AuthButton({ onNotice }: AuthButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

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
        if (result.missingEnv && !onNotice) {
          window.alert(result.error);
        }
        showNotice(result.error);
        setBusy(false);
      }
    } catch (error) {
      console.error('[AuthButton] Google ログインに失敗しました', error);
      showNotice('.env.localのSupabaseURLを確認してください');
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  const toastNode = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-5 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-amber-400/50 bg-slate-950/95 px-4 py-3 shadow-xl"
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
            <span className="truncate">{name}</span>
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
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium tracking-tight text-cyan-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-cyan-300 dark:hover:border-slate-700 sm:text-xs"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Googleでログイン</span>
        <span className="sm:hidden">ログイン</span>
      </button>
      {toastNode}
    </>
  );
}

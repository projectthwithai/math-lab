'use client';

// ==========================================
// Apex Suite: Math Lab - Google Auth Button
// ==========================================

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, UserRound } from 'lucide-react';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { signInWithGoogle, signOut } from '@/lib/supabase/authSync';

export default function AuthButton() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) return;
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
  }, [configured]);

  const handleLogin = async () => {
    setBusy(true);
    const result = await signInWithGoogle();
    if (result.error) {
      window.alert(result.error);
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  if (!configured) {
    return (
      <button
        type="button"
        disabled
        title="Supabase の環境変数が未設定です"
        className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 sm:text-xs dark:border-slate-700 dark:bg-slate-900"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Googleでログイン</span>
        <span className="sm:hidden">ログイン</span>
      </button>
    );
  }

  if (user) {
    const name =
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      user.email ||
      'アカウント';
    const avatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;

    return (
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
    );
  }

  return (
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
  );
}

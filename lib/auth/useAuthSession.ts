'use client';

// ==========================================
// Apex Suite: Math Lab - Browser auth session hook
// ==========================================

import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseNetworkError, SUPABASE_BOOTING_HINT } from '@/lib/supabase/config';

interface UseAuthSessionOptions {
  onNetworkHint?: (message: string) => void;
}

export function useAuthSession(options?: UseAuthSessionOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const onNetworkHintRef = useRef(options?.onNetworkHint);
  onNetworkHintRef.current = options?.onNetworkHint;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser(null);
      setReady(true);
      return;
    }

    let active = true;
    const notify = (message: string) => {
      onNetworkHintRef.current?.(message);
    };

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error && isSupabaseNetworkError(error)) {
          activateLocalDeveloperFallback();
          notify(SUPABASE_BOOTING_HINT);
          setUser(null);
          setReady(true);
          return;
        }
        setUser(data.user ?? null);
        setReady(true);
      })
      .catch((error) => {
        console.warn('[useAuthSession] セッション確認をスキップしました（DNS/ネットワーク）', error);
        if (!active) return;
        if (isSupabaseNetworkError(error)) {
          activateLocalDeveloperFallback();
          notify(SUPABASE_BOOTING_HINT);
        }
        setUser(null);
        setReady(true);
      });

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setReady(true);
      });
      subscription = data.subscription;
    } catch (error) {
      console.warn('[useAuthSession] Auth 購読をスキップしました', error);
      if (isSupabaseNetworkError(error)) {
        activateLocalDeveloperFallback();
        notify(SUPABASE_BOOTING_HINT);
      }
      setReady(true);
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    ready,
    isAuthenticated: Boolean(user),
  };
}

// ==========================================
// Apex Suite: Math Lab - Supabase browser client
// ==========================================

import { createBrowserClient } from '@supabase/ssr';
import {
  SUPABASE_BOOTING_HINT,
  getSupabasePublicEnv,
  getSupabasePublicKey,
  isSupabaseConfigured,
  isSupabaseNetworkError,
} from '@/lib/supabase/config';
import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';

function sanitizeEnvValue(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["']|["']$/g, '').trim();
}

let didLogSupabaseConnection = false;

export function getSupabaseBrowserClient() {
  const url = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publicKey =
    sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    getSupabasePublicKey();
  const env = getSupabasePublicEnv();
  const resolvedUrl = url || env?.url || '';
  const resolvedKey = publicKey || env?.anonKey || '';

  if (!didLogSupabaseConnection) {
    didLogSupabaseConnection = true;
    console.log('Connecting to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  if (!resolvedUrl || !resolvedKey) return null;
  try {
    return createBrowserClient(resolvedUrl, resolvedKey);
  } catch (error) {
    console.error('[supabase/client] ブラウザクライアントの生成に失敗しました', error);
    return null;
  }
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; dnsUnavailable?: boolean; developerFallback?: boolean; error: string };

function dnsFailure(): GoogleSignInResult {
  const developerFallback = activateLocalDeveloperFallback();
  return {
    ok: false,
    dnsUnavailable: true,
    developerFallback,
    error: SUPABASE_BOOTING_HINT,
  };
}

/**
 * Google OAuth を開始する。事前の URL 検証や alert ブロックは行わない。
 */
export async function signInWithGoogleOAuth(): Promise<GoogleSignInResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase クライアントを初期化できませんでした。' };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('[supabase/client] Google ログインに失敗しました', error);
      if (isSupabaseNetworkError(error) || isSupabaseNetworkError(error.message)) {
        return dnsFailure();
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.error('[supabase/client] Google ログインで例外が発生しました', error);
    if (isSupabaseNetworkError(error)) {
      return dnsFailure();
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Google ログインに失敗しました。' };
  }
}

/** `redirectTo` がオリジン直下のとき、URL の code をセッションに交換する */
export async function completeOAuthRedirectIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[supabase/client] OAuth code の交換に失敗しました', error);
      if (isSupabaseNetworkError(error)) {
        activateLocalDeveloperFallback();
      }
      return;
    }
  } catch (error) {
    console.error('[supabase/client] OAuth code 交換で例外が発生しました', error);
    if (isSupabaseNetworkError(error)) {
      activateLocalDeveloperFallback();
    }
    return;
  }

  params.delete('code');
  params.delete('state');
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next || '/');
}

export { isSupabaseConfigured, SUPABASE_BOOTING_HINT, isSupabaseNetworkError, getSupabasePublicKey };

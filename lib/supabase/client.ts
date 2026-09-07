// ==========================================
// Apex Suite: Math Lab - Supabase browser client
// ==========================================

import { createBrowserClient } from '@supabase/ssr';
import {
  SUPABASE_BOOTING_HINT,
  SUPABASE_URL_HINT,
  getSupabasePublicEnv,
  inspectSupabaseEnv,
  isSafeOAuthAuthorizeUrl,
  isSupabaseConfigured,
  isSupabaseNetworkError,
} from '@/lib/supabase/config';
import { activateLocalDeveloperFallback } from '@/lib/auth/developerAccess';

export const SUPABASE_ENV_HINT = '.env.local に Supabase の環境変数を設定してください';

export function getSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  try {
    return createBrowserClient(env.url, env.anonKey);
  } catch (error) {
    console.error('[supabase/client] ブラウザクライアントの生成に失敗しました', error);
    return null;
  }
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; missingEnv: true; dnsUnavailable?: false; error: string }
  | { ok: false; missingEnv: false; dnsUnavailable?: boolean; developerFallback?: boolean; error: string };

function envFailure(): GoogleSignInResult {
  return { ok: false, missingEnv: true, error: SUPABASE_URL_HINT };
}

function dnsFailure(): GoogleSignInResult {
  const developerFallback = activateLocalDeveloperFallback();
  return {
    ok: false,
    missingEnv: false,
    dnsUnavailable: true,
    developerFallback,
    error: SUPABASE_BOOTING_HINT,
  };
}

/**
 * Google OAuth を開始する。
 * URL が壊れている場合はリダイレクトせず、呼び出し側でアラートできるように返す。
 */
export async function signInWithGoogleOAuth(): Promise<GoogleSignInResult> {
  if (typeof window === 'undefined') {
    return { ok: false, missingEnv: false, error: 'ブラウザでのみログインできます。' };
  }

  const inspected = inspectSupabaseEnv();
  if (!inspected.ok) {
    return envFailure();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return envFailure();
  }

  const redirectTo = window.location.origin || 'http://localhost:3000';

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('[supabase/client] Google ログインに失敗しました', error);
      if (isSupabaseNetworkError(error) || isSupabaseNetworkError(error.message)) {
        return dnsFailure();
      }
      if (/invalid|url|redirect/i.test(error.message) && !/fetch/i.test(error.message)) {
        return envFailure();
      }
      return { ok: false, missingEnv: false, error: error.message };
    }

    if (!data.url || !isSafeOAuthAuthorizeUrl(data.url, inspected.url)) {
      return envFailure();
    }

    window.location.assign(data.url);
    return { ok: true };
  } catch (error) {
    console.error('[supabase/client] Google ログインで例外が発生しました', error);
    if (isSupabaseNetworkError(error)) {
      return dnsFailure();
    }
    return envFailure();
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

export { isSupabaseConfigured, SUPABASE_URL_HINT, SUPABASE_BOOTING_HINT, isSupabaseNetworkError };

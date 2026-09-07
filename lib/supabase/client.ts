// ==========================================
// Apex Suite: Math Lab - Supabase browser client
// ==========================================

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/config';

export const SUPABASE_ENV_HINT = '.env.local に Supabase の環境変数を設定してください';

export function getSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; missingEnv: true; error: string }
  | { ok: false; missingEnv: false; error: string };

/**
 * Google OAuth を開始する。
 * 環境変数が無い場合は throw せず、呼び出し側でトースト案内できるように返す。
 */
export async function signInWithGoogleOAuth(): Promise<GoogleSignInResult> {
  if (typeof window === 'undefined') {
    return { ok: false, missingEnv: false, error: 'ブラウザでのみログインできます。' };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, missingEnv: true, error: SUPABASE_ENV_HINT };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, missingEnv: true, error: SUPABASE_ENV_HINT };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}` },
  });

  if (error) {
    console.error('[supabase/client] Google ログインに失敗しました', error);
    return { ok: false, missingEnv: false, error: error.message };
  }

  return { ok: true };
}

/** `redirectTo` がオリジン直下のとき、URL の code をセッションに交換する */
export async function completeOAuthRedirectIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[supabase/client] OAuth code の交換に失敗しました', error);
    return;
  }

  params.delete('code');
  params.delete('state');
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next || '/');
}

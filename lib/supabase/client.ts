// ==========================================
// Apex Suite: Math Lab - Supabase browser client
// ==========================================

import { createBrowserClient } from '@supabase/ssr';
import {
  SUPABASE_URL_HINT,
  getSupabasePublicEnv,
  inspectSupabaseEnv,
  isSafeOAuthAuthorizeUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

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
  | { ok: false; missingEnv: true; error: string }
  | { ok: false; missingEnv: false; error: string };

function envFailure(): GoogleSignInResult {
  return { ok: false, missingEnv: true, error: SUPABASE_URL_HINT };
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
      if (/invalid|url|redirect|failed to fetch|fetch/i.test(error.message)) {
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

export { isSupabaseConfigured, SUPABASE_URL_HINT };

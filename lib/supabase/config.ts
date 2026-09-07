// ==========================================
// Apex Suite: Math Lab - Supabase public env
// ==========================================

export const SUPABASE_URL_HINT = '.env.localのSupabaseURLを確認してください';

function isValidSupabaseUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (!host || host === 'undefined' || host === 'null') return false;
    if (host.includes('example') || host.includes('placeholder') || host.includes('your-project')) {
      return false;
    }
    return (
      host.includes('supabase.co') ||
      host.includes('supabase.in') ||
      host.endsWith('.supabase.com') ||
      host === '127.0.0.1' ||
      host === 'localhost'
    );
  } catch {
    return false;
  }
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (!isValidSupabaseUrl(url)) return null;
  return { url, anonKey };
}

export function inspectSupabaseEnv():
  | { ok: true; url: string; anonKey: string }
  | { ok: false; reason: 'missing' | 'bad_url' } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!url || !anonKey) return { ok: false, reason: 'missing' };
  if (!isValidSupabaseUrl(url)) return { ok: false, reason: 'bad_url' };
  return { ok: true, url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}

export function isSafeOAuthAuthorizeUrl(oauthUrl: string, supabaseUrl: string): boolean {
  try {
    const target = new URL(oauthUrl);
    const origin = new URL(supabaseUrl);
    return target.origin === origin.origin && target.pathname.includes('/auth/v1/authorize');
  } catch {
    return false;
  }
}

// ==========================================
// Apex Suite: Math Lab - Supabase public env
// ==========================================

export const SUPABASE_BOOTING_HINT =
  'Supabaseプロジェクトが起動準備中です。数分待つかSupabaseでProject Restartを押してください';

function sanitizeEnvValue(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * 公開APIキー。従来の anon key と、新しい publishable key のどちらでも受け付ける。
 * Next.js のクライアント埋め込みのため、両変数は静的な `process.env.NEXT_PUBLIC_*` 参照である必要がある。
 */
export function getSupabasePublicKey(): string {
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const publishableKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return anonKey || publishableKey;
}

export function getSupabasePublicUrl(): string {
  return sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = getSupabasePublicUrl();
  const anonKey = getSupabasePublicKey();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 4 || error == null) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const cause =
      'cause' in error && error.cause !== undefined ? collectErrorText(error.cause, depth + 1) : '';
    return `${error.name} ${error.message} ${cause}`;
  }
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return [record.message, record.code, record.details, record.error]
      .filter((value) => typeof value === 'string')
      .join(' ');
  }
  return String(error);
}

/** DNS未反映 (NXDOMAIN) / Failed to fetch など、プロジェクト未起動相当のネットワーク障害 */
export function isSupabaseNetworkError(error: unknown): boolean {
  const text = collectErrorText(error).toLowerCase();
  if (!text.trim()) return false;
  return (
    text.includes('failed to fetch') ||
    text.includes('fetch failed') ||
    text.includes('load failed') ||
    text.includes('networkerror') ||
    text.includes('network request failed') ||
    text.includes('err_name_not_resolved') ||
    text.includes('err_connection') ||
    text.includes('err_internet_disconnected') ||
    text.includes('nxdomain') ||
    text.includes('enotfound') ||
    text.includes('eai_again') ||
    text.includes('name_not_resolved') ||
    (text.includes('dns') && text.includes('not resolved'))
  );
}

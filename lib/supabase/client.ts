// ==========================================
// Apex Suite: Math Lab - Supabase browser client
// ==========================================

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicEnv } from '@/lib/supabase/config';

export function getSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}

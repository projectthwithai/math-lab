// ==========================================
// Apex Suite: Math Lab - Supabase server client
// ==========================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicEnv } from '@/lib/supabase/config';

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components からは cookie を書けないことがある。
          // middleware がセッション更新を担当する。
        }
      },
    },
  });
}

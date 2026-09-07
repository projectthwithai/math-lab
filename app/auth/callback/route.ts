import { NextResponse } from 'next/server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') ? next : '/';

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[auth/callback] セッション交換に失敗しました', error);
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}

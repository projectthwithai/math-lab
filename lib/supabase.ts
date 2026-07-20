import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabaseの環境変数が設定されているか確認する関数
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// シングルトンパターンでSupabaseクライアントを取得する関数
let supabaseInstance: any = null;
export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Googleログインを実行する関数
export const signInWithGoogle = async () => {
  const sb = getSupabase();
  if (!sb) {
    alert("Supabaseが正しく設定されていません。環境変数を確認してください。");
    return;
  }
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // ログイン後のリダイレクト先
    },
  });
};

// ログイン状態の変化を監視するリスナー関数
export const onAuthStateChange = (callback: (session: any) => void) => {
  const sb = getSupabase();
  if (!sb) return () => {};

  const { data: { subscription } } = sb.auth.onAuthStateChange((_event: string, session: any) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
};

// ユーザー設定や途中経過データを一括ロードする関数
export const fetchAllData = async (userId: string) => {
  const sb = getSupabase();
  if (!sb) return {};

  try {
    const { data, error } = await sb
      .from('user_states')
      .select('key, value')
      .eq('user_id', userId);

    if (error) throw error;

    // 配列形式から { [key]: value } のオブジェクト形式に変換して返却
    const result: Record<string, any> = {};
    data?.forEach((row: { key: string; value: any }) => {
      result[row.key] = row.value;
    });
    return result;
  } catch (err) {
    console.error("fetchAllData Error:", err);
    return {};
  }
};

// データをクラウドにセーブ（保存・更新）する汎用関数
export const upsertData = async (userId: string, key: string, value: any) => {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb
      .from('user_states')
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );

    if (error) throw error;
  } catch (err) {
    console.error(`upsertData [${key}] Error:`, err);
    throw err;
  }
};
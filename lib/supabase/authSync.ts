// ==========================================
// Apex Suite: Math Lab - Auth + realtime cloud sync
// ==========================================
// Google ログイン中だけ Supabase `user_app_data` と双方向同期する。
// 未ログイン時は通信せず、Zustand / LocalStorage のみで動く。

import type { RealtimeChannel, User } from '@supabase/supabase-js';

import { getSupabaseBrowserClient, completeOAuthRedirectIfNeeded, signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseConfigured, isSupabaseNetworkError } from '@/lib/supabase/config';
import { USER_APP_DATA_TABLE, type UserAppDataRow } from '@/lib/supabase/progress';
import {
  applyRemoteAppDataRow,
  flushCloudSave,
  loadUserDataFromCloud,
  setCloudSyncUserId,
} from '@/lib/supabase/cloudSync';
import { useUserStore } from '@/lib/store/userStore';
import { useCloudSyncStore } from '@/lib/store/cloudSyncStore';
import { activateLocalDeveloperFallback, syncDeveloperSession } from '@/lib/auth/developerAccess';

const RESYNC_ON_VISIBLE_MS = 8_000;

let started = false;
let signedInUser: User | null = null;
let unsubscribeAuth: { data: { subscription: { unsubscribe: () => void } } } | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let visibilityHandler: (() => void) | null = null;
let lastPullAt = 0;
let lastHydratedUserId: string | null = null;
let pullInflight: Promise<void> | null = null;

function applyLocalDeveloperFallback(): void {
  if (activateLocalDeveloperFallback()) {
    useUserStore.setState({ isDeveloper: true });
  }
}

function applyDeveloperFromUser(user: User | null | undefined): void {
  const allowed = syncDeveloperSession(user?.email);
  useUserStore.setState({ isDeveloper: allowed });
}

function detachRealtime(): void {
  if (!realtimeChannel) return;
  const supabase = getSupabaseBrowserClient();
  void supabase?.removeChannel(realtimeChannel);
  realtimeChannel = null;
}

function attachRealtime(user: User): void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  detachRealtime();

  realtimeChannel = supabase
    .channel(`user-app-data:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: USER_APP_DATA_TABLE,
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (!signedInUser) return;
        const row = payload.new as UserAppDataRow | undefined;
        if (!row || typeof row !== 'object') return;
        applyRemoteAppDataRow(row, signedInUser.id);
      }
    )
    .subscribe();
}

async function hydrateFromCloud(user: User): Promise<void> {
  lastPullAt = Date.now();
  await loadUserDataFromCloud(user.id);
}

async function handleSignedIn(user: User): Promise<void> {
  const sameUser = signedInUser?.id === user.id;
  signedInUser = user;
  setCloudSyncUserId(user.id);
  useCloudSyncStore.getState().setAuthenticated(true);
  applyDeveloperFromUser(user);
  if (!sameUser) attachRealtime(user);
  if (lastHydratedUserId === user.id && Date.now() - lastPullAt < 2500 && pullInflight) {
    return pullInflight;
  }
  lastHydratedUserId = user.id;
  pullInflight = hydrateFromCloud(user).finally(() => {
    pullInflight = null;
  });
  await pullInflight;
}

function handleSignedOut(): void {
  signedInUser = null;
  lastHydratedUserId = null;
  pullInflight = null;
  setCloudSyncUserId(null);
  detachRealtime();
  applyDeveloperFromUser(null);
  useUserStore.setState({ isGuestDemo: false, isDeveloper: false });
  useCloudSyncStore.getState().setLocal();
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const result = await signInWithGoogleOAuth();
  if (result.ok) return {};
  return { error: result.error };
}

export async function signOut(): Promise<void> {
  if (signedInUser) {
    await flushCloudSave();
  }
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const globalResult = await supabase.auth.signOut({ scope: 'global' });
      if (globalResult.error) {
        console.error('[authSync] グローバルログアウトに失敗したため、この端末のセッションのみ解除します', globalResult.error);
        const localResult = await supabase.auth.signOut({ scope: 'local' });
        if (localResult.error) {
          console.error('[authSync] ログアウトに失敗しました', localResult.error);
        }
      }
    } catch (error) {
      console.warn('[authSync] ログアウトをスキップしました（DNS/ネットワーク）', error);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        console.warn('[authSync] ローカルセッション解除にも失敗しました', localError);
      }
    }
  }
  handleSignedOut();
}

export function startAuthSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  if (!isSupabaseConfigured()) {
    applyDeveloperFromUser(null);
    useCloudSyncStore.getState().setLocal();
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    applyDeveloperFromUser(null);
    useCloudSyncStore.getState().setLocal();
    return;
  }

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible' || !signedInUser) return;
    if (Date.now() - lastPullAt < RESYNC_ON_VISIBLE_MS) return;
    void flushCloudSave()
      .then(() => loadUserDataFromCloud(signedInUser!.id))
      .catch((error) => {
        console.warn('[authSync] 再同期をスキップしました', error);
      });
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  void completeOAuthRedirectIfNeeded()
    .then(() =>
      supabase.auth.getUser().then(({ data, error }) => {
        if (error && isSupabaseNetworkError(error)) {
          applyLocalDeveloperFallback();
          return;
        }
        if (data.user) {
          void handleSignedIn(data.user);
          return;
        }
        applyDeveloperFromUser(null);
        useCloudSyncStore.getState().setLocal();
      })
    )
    .catch((error) => {
      console.warn('[authSync] 初期セッション確認をスキップしました（DNS/ネットワーク）', error);
      if (isSupabaseNetworkError(error)) {
        applyLocalDeveloperFallback();
      }
    });

  try {
    unsubscribeAuth = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        handleSignedOut();
        return;
      }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (event === 'TOKEN_REFRESHED' && signedInUser?.id === session.user.id) {
          signedInUser = session.user;
          setCloudSyncUserId(session.user.id);
          applyDeveloperFromUser(session.user);
          return;
        }
        void handleSignedIn(session.user).catch((error) => {
          console.warn('[authSync] 進捗同期をスキップしました', error);
        });
      }
    });
  } catch (error) {
    console.warn('[authSync] Auth 購読をスキップしました', error);
    if (isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
    }
  }
}

export function stopAuthSync(): void {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  detachRealtime();
  unsubscribeAuth?.data.subscription.unsubscribe();
  unsubscribeAuth = null;
  started = false;
  signedInUser = null;
  setCloudSyncUserId(null);
  applyDeveloperFromUser(null);
  useCloudSyncStore.getState().setLocal();
}

/** 互換用。ストア更新の自動保存は cloudSync の 1 秒デバウンスへ委譲する。 */
export { scheduleCloudSave as scheduleAuthProgressPush } from '@/lib/supabase/cloudSync';

// ==========================================
// Apex Suite: Math Lab - Auth + bidirectional progress sync
// ==========================================
// Google ログイン後、XP / レベル / ストリーク / Energy / 解放武器 /
// 解法ノート / 発掘パターンを Supabase `user_progress` と双方向同期する。
// 環境変数が無い場合はローカル専用で動作し、ログインは無効化する。

import type { User } from '@supabase/supabase-js';

import { getSupabaseBrowserClient, completeOAuthRedirectIfNeeded, signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseConfigured, isSupabaseNetworkError } from '@/lib/supabase/config';
import { onProgressDirty } from '@/lib/supabase/progressDirty';
import {
  USER_PROGRESS_TABLE,
  levelFieldsFromXp,
  mergeProgress,
  rowToSnapshot,
  snapshotToRow,
  type UserProgressRow,
  type UserProgressSnapshot,
} from '@/lib/supabase/progress';
import { getAllCustomSolutionNotes, replaceAllCustomSolutionNotes } from '@/lib/storage/customSolutionNotesStore';
import { getAllPatternOverrides, replaceAllPatternOverrides } from '@/lib/storage/patternStrategyStore';
import { useUserStore } from '@/lib/store/userStore';
import { activateLocalDeveloperFallback, syncDeveloperSession } from '@/lib/auth/developerAccess';

const PUSH_DEBOUNCE_MS = 800;

let started = false;
let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let unsubscribeDirty: (() => void) | null = null;
let unsubscribeAuth: { data: { subscription: { unsubscribe: () => void } } } | null = null;

function applyLocalDeveloperFallback(): void {
  if (activateLocalDeveloperFallback()) {
    useUserStore.setState({ isDeveloper: true });
  }
}

function applyDeveloperFromUser(user: User | null | undefined): void {
  const allowed = syncDeveloperSession(user?.email);
  useUserStore.setState({ isDeveloper: allowed });
}

function collectLocalSnapshot(): UserProgressSnapshot {
  const state = useUserStore.getState();
  return {
    totalXp: state.totalXp,
    streakDays: state.streakDays,
    lastActiveDateISO: state.lastActiveDateISO,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    lastEnergyRefillDateISO: state.lastEnergyRefillDateISO,
    progressUpdatedAt: state.progressUpdatedAt,
    clearedPatternIds: state.clearedPatternIds,
    discoveredPatterns: state.discoveredPatterns,
    unlockedWeaponIds: state.unlockedWeaponIds,
    currentDifficulty: state.currentDifficulty,
    consecutiveCorrect: state.consecutiveCorrect,
    consecutiveIncorrect: state.consecutiveIncorrect,
    solutionNotes: getAllCustomSolutionNotes(),
    strategyOverrides: getAllPatternOverrides(),
  };
}

function applySnapshot(snapshot: UserProgressSnapshot, userId?: string | null): void {
  applyingRemote = true;
  try {
    const xp = levelFieldsFromXp(snapshot.totalXp);
    useUserStore.setState({
      ...xp,
      streakDays: snapshot.streakDays,
      lastActiveDateISO: snapshot.lastActiveDateISO,
      energy: snapshot.energy,
      maxEnergy: snapshot.maxEnergy,
      lastEnergyRefillDateISO: snapshot.lastEnergyRefillDateISO,
      progressUpdatedAt: snapshot.progressUpdatedAt,
      clearedPatternIds: snapshot.clearedPatternIds,
      masteredPatterns: snapshot.clearedPatternIds,
      discoveredPatterns: snapshot.discoveredPatterns,
      unlockedWeaponIds: snapshot.unlockedWeaponIds,
      currentDifficulty: snapshot.currentDifficulty,
      consecutiveCorrect: snapshot.consecutiveCorrect,
      consecutiveIncorrect: snapshot.consecutiveIncorrect,
    });
    replaceAllCustomSolutionNotes(snapshot.solutionNotes);
    replaceAllPatternOverrides(snapshot.strategyOverrides);
    useUserStore.getState().applyDeviceEnergyLock(userId ?? null);
  } finally {
    applyingRemote = false;
  }
}

async function pushSnapshot(user: User, snapshot: UserProgressSnapshot): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from(USER_PROGRESS_TABLE).upsert(snapshotToRow(user.id, snapshot), {
      onConflict: 'user_id',
    });

    if (error) {
      console.error('[authSync] 進捗の保存に失敗しました', error);
    }
  } catch (error) {
    console.warn('[authSync] 進捗の保存をスキップしました（DNS/ネットワーク）', error);
  }
}

async function pullMergeAndPush(user: User): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from(USER_PROGRESS_TABLE)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[authSync] 進捗の取得に失敗しました', error);
      if (isSupabaseNetworkError(error)) {
        applyLocalDeveloperFallback();
      }
      return;
    }

    const local = collectLocalSnapshot();
    const remoteSnapshot = data ? rowToSnapshot(data as UserProgressRow) : null;
    const merged = remoteSnapshot ? mergeProgress(local, remoteSnapshot) : local;
    // Energy の日次付与判定は「このアカウント自身のリフィル日」を使う。
    // 端末に残った別アカウントの lastEnergyRefillDateISO を引き継ぐと二重付与判定が崩れる。
    applySnapshot(
      {
        ...merged,
        energy: remoteSnapshot?.energy ?? local.energy,
        lastEnergyRefillDateISO: remoteSnapshot?.lastEnergyRefillDateISO ?? null,
      },
      user.id
    );
    await pushSnapshot(user, collectLocalSnapshot());
  } catch (error) {
    console.warn('[authSync] 進捗同期をスキップしました（DNS/ネットワーク）', error);
    if (isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
    }
  }
}

async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
      return null;
    }
    return data.user ?? null;
  } catch (error) {
    console.warn('[authSync] ユーザー取得をスキップしました（DNS/ネットワーク）', error);
    if (isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
    }
    return null;
  }
}

async function flushPush(): Promise<void> {
  if (applyingRemote) return;
  const user = await getCurrentUser();
  if (!user) return;
  await pushSnapshot(user, collectLocalSnapshot());
}

export function scheduleAuthProgressPush(): void {
  if (applyingRemote || !isSupabaseConfigured()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void flushPush();
  }, PUSH_DEBOUNCE_MS);
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const result = await signInWithGoogleOAuth();
  if (result.ok) return {};
  return { error: result.error };
}

export async function signOut(): Promise<void> {
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
  applyDeveloperFromUser(null);
  useUserStore.setState({ isGuestDemo: false, isDeveloper: false });
}

export function startAuthSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  if (!isSupabaseConfigured()) {
    applyDeveloperFromUser(null);
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    applyDeveloperFromUser(null);
    return;
  }

  unsubscribeStore = useUserStore.subscribe(() => {
    scheduleAuthProgressPush();
  });
  unsubscribeDirty = onProgressDirty(() => {
    scheduleAuthProgressPush();
  });

  void completeOAuthRedirectIfNeeded()
    .then(() =>
      supabase.auth.getUser().then(({ data, error }) => {
        if (error && isSupabaseNetworkError(error)) {
          applyLocalDeveloperFallback();
          return;
        }
        applyDeveloperFromUser(data.user ?? null);
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
      applyDeveloperFromUser(session?.user ?? null);
      if (!session?.user) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        void pullMergeAndPush(session.user).catch((error) => {
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
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  unsubscribeStore?.();
  unsubscribeDirty?.();
  unsubscribeAuth?.data.subscription.unsubscribe();
  unsubscribeStore = null;
  unsubscribeDirty = null;
  unsubscribeAuth = null;
  started = false;
  applyDeveloperFromUser(null);
}

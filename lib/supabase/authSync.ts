// ==========================================
// Apex Suite: Math Lab - Auth + bidirectional progress sync
// ==========================================
// Google ログイン後、XP / レベル / ストリーク / Energy / 解放武器 /
// 解法ノート / 発掘パターンを Supabase `user_progress` と双方向同期する。
// 環境変数が無い場合はローカル専用で動作し、ログインは無効化する。

import type { User } from '@supabase/supabase-js';

import { getSupabaseBrowserClient, completeOAuthRedirectIfNeeded, signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
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
import { syncDeveloperSession } from '@/lib/auth/developerAccess';

const PUSH_DEBOUNCE_MS = 800;

let started = false;
let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let unsubscribeDirty: (() => void) | null = null;
let unsubscribeAuth: { data: { subscription: { unsubscribe: () => void } } } | null = null;

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

function applySnapshot(snapshot: UserProgressSnapshot): void {
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
      discoveredPatterns: snapshot.discoveredPatterns,
      unlockedWeaponIds: snapshot.unlockedWeaponIds,
      currentDifficulty: snapshot.currentDifficulty,
      consecutiveCorrect: snapshot.consecutiveCorrect,
      consecutiveIncorrect: snapshot.consecutiveIncorrect,
    });
    replaceAllCustomSolutionNotes(snapshot.solutionNotes);
    replaceAllPatternOverrides(snapshot.strategyOverrides);
  } finally {
    applyingRemote = false;
  }
}

async function pushSnapshot(user: User, snapshot: UserProgressSnapshot): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from(USER_PROGRESS_TABLE).upsert(snapshotToRow(user.id, snapshot), {
    onConflict: 'user_id',
  });

  if (error) {
    console.error('[authSync] 進捗の保存に失敗しました', error);
  }
}

async function pullMergeAndPush(user: User): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { data, error } = await supabase
    .from(USER_PROGRESS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[authSync] 進捗の取得に失敗しました', error);
    return;
  }

  const local = collectLocalSnapshot();
  const merged = data ? mergeProgress(local, rowToSnapshot(data as UserProgressRow)) : local;
  applySnapshot(merged);
  await pushSnapshot(user, merged);
}

async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
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
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[authSync] ログアウトに失敗しました', error);
  }
  applyDeveloperFromUser(null);
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

  void completeOAuthRedirectIfNeeded().then(() => {
    void supabase.auth.getUser().then(({ data }) => {
      applyDeveloperFromUser(data.user ?? null);
    });
  });

  unsubscribeAuth = supabase.auth.onAuthStateChange((event, session) => {
    applyDeveloperFromUser(session?.user ?? null);
    if (!session?.user) return;
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      void pullMergeAndPush(session.user);
    }
  });
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

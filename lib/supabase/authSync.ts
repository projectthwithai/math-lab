// ==========================================
// Apex Suite: Math Lab - Auth + realtime cloud sync
// ==========================================
// Google ログイン中だけ Supabase `user_app_data` と双方向同期する。
// 未ログイン時は通信せず、Zustand / LocalStorage のみで動く。

import type { RealtimeChannel, User } from '@supabase/supabase-js';

import { getSupabaseBrowserClient, completeOAuthRedirectIfNeeded, signInWithGoogleOAuth } from '@/lib/supabase/client';
import { isSupabaseConfigured, isSupabaseNetworkError } from '@/lib/supabase/config';
import { onProgressDirty } from '@/lib/supabase/progressDirty';
import {
  USER_APP_DATA_TABLE,
  USER_PROGRESS_TABLE,
  appDataRowToSnapshot,
  emptyDailyQuestSnapshot,
  isMissingRelationError,
  legacyProgressRowToSnapshot,
  levelFieldsFromXp,
  mergeProgress,
  snapshotToAppDataRow,
  type UserAppDataRow,
  type UserProgressRow,
  type UserProgressSnapshot,
} from '@/lib/supabase/progress';
import { getAllCustomSolutionNotes, replaceAllCustomSolutionNotes } from '@/lib/storage/customSolutionNotesStore';
import { getAllPatternOverrides, replaceAllPatternOverrides } from '@/lib/storage/patternStrategyStore';
import {
  getAllSolvedProblemRecords,
  replaceAllSolvedProblemRecords,
} from '@/lib/storage/solvedProblemsStore';
import {
  mergePatternNoteMaps,
  mirrorPatternNotesToLegacyStores,
  patternNotesToOverrides,
} from '@/lib/storage/patternNotes';
import { useUserStore } from '@/lib/store/userStore';
import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import { useCloudSyncStore } from '@/lib/store/cloudSyncStore';
import { activateLocalDeveloperFallback, syncDeveloperSession } from '@/lib/auth/developerAccess';

const PUSH_DEBOUNCE_MS = 600;
const RESYNC_ON_VISIBLE_MS = 8_000;

let started = false;
let applyingRemote = false;
let signedInUser: User | null = null;
let lastPushedAt: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let unsubscribeQuests: (() => void) | null = null;
let unsubscribeDirty: (() => void) | null = null;
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

function collectLocalSnapshot(): UserProgressSnapshot {
  const state = useUserStore.getState();
  const quests = useDailyQuestStore.getState();
  return {
    totalXp: state.totalXp,
    streakDays: state.streakDays,
    lastActiveDateISO: state.lastActiveDateISO,
    lastStreakGrantDateISO: state.lastStreakGrantDateISO,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    lastEnergyRefillDateISO: state.lastEnergyRefillDateISO,
    progressUpdatedAt: state.progressUpdatedAt ?? new Date().toISOString(),
    clearedPatternIds: [...new Set([...state.clearedPatternIds, ...state.masteredPatterns])],
    discoveredPatterns: state.discoveredPatterns,
    patternNotes: state.patternNotes,
    patternCustomNames: state.patternCustomNames,
    patternVariantCounts: state.patternVariantCounts,
    patternVariants: state.patternVariants,
    customFiles: state.customFiles,
    unlockedWeaponIds: state.unlockedWeaponIds,
    masteredWeaponIds: state.masteredWeaponIds,
    currentDifficulty: state.currentDifficulty,
    difficultyScaleVersion: state.difficultyScaleVersion,
    consecutiveCorrect: state.consecutiveCorrect,
    consecutiveIncorrect: state.consecutiveIncorrect,
    solutionNotes: getAllCustomSolutionNotes(),
    strategyOverrides: {
      ...getAllPatternOverrides(),
      ...patternNotesToOverrides(state.patternNotes),
    },
    dailyQuests: {
      dateISO: quests.dateISO,
      questCount: quests.questCount,
      quests: quests.quests,
      rewardsClaimedToday: quests.rewardsClaimedToday,
    },
    solvedProblems: getAllSolvedProblemRecords(),
  };
}

function applySnapshot(snapshot: UserProgressSnapshot, userId?: string | null): void {
  applyingRemote = true;
  try {
    const xp = levelFieldsFromXp(snapshot.totalXp);
    const mastered = snapshot.clearedPatternIds;
    useUserStore.setState({
      ...xp,
      streakDays: snapshot.streakDays,
      lastActiveDateISO: snapshot.lastActiveDateISO,
      lastStreakGrantDateISO: snapshot.lastStreakGrantDateISO,
      energy: snapshot.energy,
      maxEnergy: snapshot.maxEnergy,
      lastEnergyRefillDateISO: snapshot.lastEnergyRefillDateISO,
      progressUpdatedAt: snapshot.progressUpdatedAt,
      clearedPatternIds: mastered,
      masteredPatterns: mastered,
      discoveredPatterns: snapshot.discoveredPatterns,
      patternNotes: snapshot.patternNotes,
      patternCustomNames: snapshot.patternCustomNames,
      patternVariantCounts: snapshot.patternVariantCounts,
      patternVariants: snapshot.patternVariants,
      customFiles: snapshot.customFiles,
      unlockedWeaponIds: snapshot.unlockedWeaponIds,
      masteredWeaponIds: snapshot.masteredWeaponIds,
      currentDifficulty: snapshot.currentDifficulty,
      difficultyScaleVersion: snapshot.difficultyScaleVersion,
      consecutiveCorrect: snapshot.consecutiveCorrect,
      consecutiveIncorrect: snapshot.consecutiveIncorrect,
      isGuestDemo: false,
    });
    replaceAllCustomSolutionNotes(snapshot.solutionNotes);
    replaceAllPatternOverrides(snapshot.strategyOverrides);
    replaceAllSolvedProblemRecords(snapshot.solvedProblems);
    const mergedNotes = mergePatternNoteMaps(snapshot.patternNotes, useUserStore.getState().patternNotes);
    useUserStore.setState({ patternNotes: mergedNotes });
    mirrorPatternNotesToLegacyStores(mergedNotes);

    const daily = snapshot.dailyQuests ?? emptyDailyQuestSnapshot();
    useDailyQuestStore.setState({
      dateISO: daily.dateISO,
      questCount: daily.questCount,
      quests: daily.quests,
      rewardsClaimedToday: daily.rewardsClaimedToday,
    });
    useDailyQuestStore.getState().ensureToday();
    useUserStore.getState().applyDeviceEnergyLock(userId ?? null);
  } finally {
    applyingRemote = false;
  }
}

async function pushSnapshot(user: User, snapshot: UserProgressSnapshot): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const row = snapshotToAppDataRow(user.id, {
    ...snapshot,
    progressUpdatedAt: snapshot.progressUpdatedAt ?? new Date().toISOString(),
  });

  try {
    const { error } = await supabase.from(USER_APP_DATA_TABLE).upsert(row, {
      onConflict: 'user_id',
    });
    if (error) {
      console.error('[authSync] user_app_data の保存に失敗しました', error);
      useCloudSyncStore.getState().setError(error.message);
      return false;
    }
    lastPushedAt = row.updated_at ?? null;
    useCloudSyncStore.getState().setSynced();
    return true;
  } catch (error) {
    console.warn('[authSync] 進捗の保存をスキップしました（DNS/ネットワーク）', error);
    if (isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
    }
    useCloudSyncStore.getState().setError('クラウド保存に失敗しました');
    return false;
  }
}

async function selectAppData(userId: string): Promise<UserProgressSnapshot | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(USER_APP_DATA_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return appDataRowToSnapshot(data as UserAppDataRow);
}

async function selectLegacyProgress(userId: string): Promise<UserProgressSnapshot | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(USER_PROGRESS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return legacyProgressRowToSnapshot(data as UserProgressRow);
}

async function pullMergeAndPush(user: User): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  useCloudSyncStore.getState().setSyncing();
  lastPullAt = Date.now();

  try {
    const local = collectLocalSnapshot();
    const remote = (await selectAppData(user.id)) ?? (await selectLegacyProgress(user.id));
    const merged = remote ? mergeProgress(local, remote) : local;
    applySnapshot(
      {
        ...merged,
        energy: remote?.energy ?? local.energy,
        lastEnergyRefillDateISO: remote?.lastEnergyRefillDateISO ?? null,
      },
      user.id
    );
    await pushSnapshot(user, collectLocalSnapshot());
  } catch (error) {
    console.warn('[authSync] 進捗同期をスキップしました（DNS/ネットワーク）', error);
    useCloudSyncStore.getState().setError('クラウド同期に失敗しました');
    if (isSupabaseNetworkError(error)) {
      applyLocalDeveloperFallback();
    }
  }
}

async function flushPush(): Promise<void> {
  if (applyingRemote || !signedInUser) return;
  useCloudSyncStore.getState().setSyncing();
  await pushSnapshot(signedInUser, collectLocalSnapshot());
}

export function scheduleAuthProgressPush(): void {
  if (applyingRemote || !signedInUser || !isSupabaseConfigured()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void flushPush();
  }, PUSH_DEBOUNCE_MS);
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
        if (applyingRemote || !signedInUser) return;
        const row = payload.new as UserAppDataRow | undefined;
        if (!row || typeof row !== 'object') return;
        if (row.updated_at && row.updated_at === lastPushedAt) return;
        applySnapshot(appDataRowToSnapshot(row), signedInUser.id);
        useCloudSyncStore.getState().setSynced();
      }
    )
    .subscribe();
}

async function handleSignedIn(user: User): Promise<void> {
  const sameUser = signedInUser?.id === user.id;
  signedInUser = user;
  useCloudSyncStore.getState().setAuthenticated(true);
  applyDeveloperFromUser(user);
  if (!sameUser) attachRealtime(user);
  if (lastHydratedUserId === user.id && Date.now() - lastPullAt < 2500 && pullInflight) {
    return pullInflight;
  }
  lastHydratedUserId = user.id;
  pullInflight = pullMergeAndPush(user).finally(() => {
    pullInflight = null;
  });
  await pullInflight;
}

function handleSignedOut(): void {
  signedInUser = null;
  lastPushedAt = null;
  lastHydratedUserId = null;
  pullInflight = null;
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
    await flushPush();
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

  unsubscribeStore = useUserStore.subscribe(() => {
    scheduleAuthProgressPush();
  });
  unsubscribeQuests = useDailyQuestStore.subscribe(() => {
    scheduleAuthProgressPush();
  });
  unsubscribeDirty = onProgressDirty(() => {
    scheduleAuthProgressPush();
  });

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible' || !signedInUser) return;
    if (Date.now() - lastPullAt < RESYNC_ON_VISIBLE_MS) return;
    void pullMergeAndPush(signedInUser).catch((error) => {
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
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  detachRealtime();
  unsubscribeStore?.();
  unsubscribeQuests?.();
  unsubscribeDirty?.();
  unsubscribeAuth?.data.subscription.unsubscribe();
  unsubscribeStore = null;
  unsubscribeQuests = null;
  unsubscribeDirty = null;
  unsubscribeAuth = null;
  started = false;
  signedInUser = null;
  applyDeveloperFromUser(null);
  useCloudSyncStore.getState().setLocal();
}

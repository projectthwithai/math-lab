// ==========================================
// Apex Suite: Math Lab - Realtime cloud sync engine
// ==========================================
// Google ログイン中の学習データ正本は Supabase `user_app_data`。
// load はクラウドでストアを完全上書きし、save は 1 秒デバウンスで upsert する。

import {
  USER_APP_DATA_TABLE,
  appDataRowToSnapshot,
  emptyDailyQuestSnapshot,
  levelFieldsFromXp,
  snapshotToAppDataRow,
  type UserAppDataRow,
  type UserProgressSnapshot,
} from '@/lib/supabase/progress';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { onProgressDirty } from '@/lib/supabase/progressDirty';
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
import { useCatalogStore } from '@/lib/store/catalogStore';
import { useCloudSyncStore } from '@/lib/store/cloudSyncStore';
import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import { useAppToastStore } from '@/lib/store/appToastStore';
import { useUserStore } from '@/lib/store/userStore';

const PUSH_DEBOUNCE_MS = 1000;

let applyingRemote = false;
let signedInUserId: string | null = null;
let lastPushedAt: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let autoPushStarted = false;
let unsubscribeUserStore: (() => void) | null = null;
let unsubscribeQuestStore: (() => void) | null = null;
let unsubscribeDirty: (() => void) | null = null;

export function isApplyingCloudData(): boolean {
  return applyingRemote;
}

export function getLastCloudPushedAt(): string | null {
  return lastPushedAt;
}

export function setCloudSyncUserId(userId: string | null): void {
  signedInUserId = userId;
  if (!userId && pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

export function collectUserDataSnapshot(): UserProgressSnapshot {
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function snapshotFromState(state?: unknown): UserProgressSnapshot {
  const live = collectUserDataSnapshot();
  if (!state || typeof state !== 'object') return live;
  const source = asRecord(state);
  const daily = asRecord(source.dailyQuests);
  return {
    ...live,
    totalXp:
      typeof source.totalXp === 'number'
        ? source.totalXp
        : typeof source.xp === 'number'
          ? source.xp
          : live.totalXp,
    streakDays: typeof source.streakDays === 'number' ? source.streakDays : live.streakDays,
    lastActiveDateISO:
      typeof source.lastActiveDateISO === 'string' || source.lastActiveDateISO === null
        ? (source.lastActiveDateISO as string | null)
        : live.lastActiveDateISO,
    lastStreakGrantDateISO:
      typeof source.lastStreakGrantDateISO === 'string' || source.lastStreakGrantDateISO === null
        ? (source.lastStreakGrantDateISO as string | null)
        : live.lastStreakGrantDateISO,
    energy: typeof source.energy === 'number' ? source.energy : live.energy,
    maxEnergy: typeof source.maxEnergy === 'number' ? source.maxEnergy : live.maxEnergy,
    lastEnergyRefillDateISO:
      typeof source.lastEnergyRefillDateISO === 'string' || source.lastEnergyRefillDateISO === null
        ? (source.lastEnergyRefillDateISO as string | null)
        : live.lastEnergyRefillDateISO,
    progressUpdatedAt:
      typeof source.progressUpdatedAt === 'string' ? source.progressUpdatedAt : live.progressUpdatedAt,
    clearedPatternIds: Array.isArray(source.clearedPatternIds)
      ? (source.clearedPatternIds as string[])
      : Array.isArray(source.masteredPatterns)
        ? (source.masteredPatterns as string[])
        : live.clearedPatternIds,
    discoveredPatterns: Array.isArray(source.discoveredPatterns)
      ? (source.discoveredPatterns as UserProgressSnapshot['discoveredPatterns'])
      : live.discoveredPatterns,
    patternNotes:
      source.patternNotes && typeof source.patternNotes === 'object'
        ? (source.patternNotes as UserProgressSnapshot['patternNotes'])
        : live.patternNotes,
    patternCustomNames:
      source.patternCustomNames && typeof source.patternCustomNames === 'object'
        ? (source.patternCustomNames as Record<string, string>)
        : live.patternCustomNames,
    patternVariantCounts:
      source.patternVariantCounts && typeof source.patternVariantCounts === 'object'
        ? (source.patternVariantCounts as Record<string, number>)
        : live.patternVariantCounts,
    patternVariants:
      source.patternVariants && typeof source.patternVariants === 'object'
        ? (source.patternVariants as UserProgressSnapshot['patternVariants'])
        : live.patternVariants,
    customFiles: Array.isArray(source.customFiles)
      ? (source.customFiles as UserProgressSnapshot['customFiles'])
      : live.customFiles,
    unlockedWeaponIds: Array.isArray(source.unlockedWeaponIds)
      ? (source.unlockedWeaponIds as string[])
      : live.unlockedWeaponIds,
    masteredWeaponIds: Array.isArray(source.masteredWeaponIds)
      ? (source.masteredWeaponIds as string[])
      : live.masteredWeaponIds,
    currentDifficulty:
      typeof source.currentDifficulty === 'number' ? source.currentDifficulty : live.currentDifficulty,
    consecutiveCorrect:
      typeof source.consecutiveCorrect === 'number' ? source.consecutiveCorrect : live.consecutiveCorrect,
    consecutiveIncorrect:
      typeof source.consecutiveIncorrect === 'number' ? source.consecutiveIncorrect : live.consecutiveIncorrect,
    solutionNotes:
      source.solutionNotes && typeof source.solutionNotes === 'object'
        ? (source.solutionNotes as UserProgressSnapshot['solutionNotes'])
        : live.solutionNotes,
    dailyQuests:
      source.dailyQuests && typeof source.dailyQuests === 'object'
        ? {
            dateISO: typeof daily.dateISO === 'string' ? daily.dateISO : live.dailyQuests.dateISO,
            questCount: typeof daily.questCount === 'number' ? daily.questCount : live.dailyQuests.questCount,
            quests: Array.isArray(daily.quests) ? (daily.quests as UserProgressSnapshot['dailyQuests']['quests']) : live.dailyQuests.quests,
            rewardsClaimedToday:
              typeof daily.rewardsClaimedToday === 'number'
                ? daily.rewardsClaimedToday
                : live.dailyQuests.rewardsClaimedToday,
          }
        : live.dailyQuests,
    solvedProblems: Array.isArray(source.solvedProblems)
      ? (source.solvedProblems as UserProgressSnapshot['solvedProblems'])
      : Array.isArray(source.mistakeHistory)
        ? (source.mistakeHistory as UserProgressSnapshot['solvedProblems'])
        : live.solvedProblems,
  };
}

export function hydrateStoresFromSnapshot(snapshot: UserProgressSnapshot, userId?: string | null): void {
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
    useCatalogStore.getState().preload();
  } finally {
    applyingRemote = false;
  }
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string };
    if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
    if (typeof record.details === 'string' && record.details.trim()) return record.details.trim();
    if (typeof record.hint === 'string' && record.hint.trim()) return record.hint.trim();
  }
  return 'unknown error';
}

function isNoRowResult(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { code?: string; message?: string; details?: string };
  const text = `${record.code ?? ''} ${record.message ?? ''} ${record.details ?? ''}`.toLowerCase();
  return (
    record.code === 'PGRST116' ||
    text.includes('0 rows') ||
    text.includes('no rows') ||
    text.includes('multiple (or no) rows')
  );
}

function markCloudSynced(): void {
  useCloudSyncStore.getState().setSynced();
  const toast = useAppToastStore.getState();
  if (toast.message?.includes('クラウド同期')) {
    toast.clearToast();
  }
}

function notifyCloudSyncRetry(error: unknown, context: string): void {
  console.error(`[cloudSync] ${context}`, extractErrorMessage(error), error);
  useCloudSyncStore.getState().setSyncing();
  useAppToastStore.getState().showToast('クラウド同期を再試行しています', 'info');
}

async function insertInitialUserRow(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase クライアントを初期化できません');

  const snapshot = collectUserDataSnapshot();
  const updatedAt = new Date().toISOString();
  const row = snapshotToAppDataRow(userId, {
    ...snapshot,
    progressUpdatedAt: updatedAt,
  });
  const { error } = await supabase.from(USER_APP_DATA_TABLE).insert({
    ...row,
    user_id: userId,
    updated_at: updatedAt,
  });

  if (error) {
    const record = error as { code?: string };
    if (record.code === '23505') {
      const { data } = await supabase
        .from(USER_APP_DATA_TABLE)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        hydrateStoresFromSnapshot(appDataRowToSnapshot(data as UserAppDataRow), userId);
        lastPushedAt = (data as UserAppDataRow).updated_at ?? updatedAt;
        return;
      }
    }
    throw error;
  }
  lastPushedAt = updatedAt;
}

async function loadUserDataFromCloudOnce(userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase クライアントを初期化できません');

  useCloudSyncStore.getState().setSyncing();

  const { data, error } = await supabase
    .from(USER_APP_DATA_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && !isNoRowResult(error)) {
    throw error;
  }

  if (data) {
    hydrateStoresFromSnapshot(appDataRowToSnapshot(data as UserAppDataRow), userId);
    lastPushedAt = (data as UserAppDataRow).updated_at ?? null;
    markCloudSynced();
    return true;
  }

  await insertInitialUserRow(userId);
  markCloudSynced();
  return true;
}

/**
 * クラウドの学習データを端末へ完全復元する。
 * レコードがなければエラーにせず、現在のストア初期状態で INSERT する。
 */
export async function loadUserDataFromCloud(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  if (!getSupabaseBrowserClient()) {
    console.error('[cloudSync] クラウド読込に失敗しました', 'Supabase クライアントを初期化できません');
    useAppToastStore.getState().showToast('クラウド同期を再試行しています', 'info');
    return false;
  }

  try {
    return await loadUserDataFromCloudOnce(userId);
  } catch (error) {
    notifyCloudSyncRetry(error, 'user_app_data の読込に失敗しました');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      return await loadUserDataFromCloudOnce(userId);
    } catch (retryError) {
      console.error(
        '[cloudSync] クラウド同期の再試行に失敗しました',
        extractErrorMessage(retryError),
        retryError
      );
      useCloudSyncStore.getState().setSyncing();
      return false;
    }
  }
}

/**
 * ストアの最新状態を `user_app_data` へ upsert する。
 */
export async function saveUserDataToCloud(userId: string, state?: unknown): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    console.error('[cloudSync] クラウド保存に失敗しました', 'Supabase クライアントを初期化できません');
    useAppToastStore.getState().showToast('クラウド同期を再試行しています', 'info');
    return false;
  }

  const snapshot = snapshotFromState(state);
  const updatedAt = new Date().toISOString();
  const row = snapshotToAppDataRow(userId, {
    ...snapshot,
    progressUpdatedAt: updatedAt,
  });

  useCloudSyncStore.getState().setSyncing();
  try {
    const { error } = await supabase.from(USER_APP_DATA_TABLE).upsert(
      { ...row, user_id: userId, updated_at: updatedAt },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    lastPushedAt = updatedAt;
    markCloudSynced();
    return true;
  } catch (error) {
    notifyCloudSyncRetry(error, 'user_app_data の保存に失敗しました');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      const { error: retryError } = await supabase.from(USER_APP_DATA_TABLE).upsert(
        { ...row, user_id: userId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (retryError) throw retryError;
      lastPushedAt = updatedAt;
      markCloudSynced();
      return true;
    } catch (retryError) {
      console.error(
        '[cloudSync] クラウド保存の再試行に失敗しました',
        extractErrorMessage(retryError),
        retryError
      );
      useCloudSyncStore.getState().setSyncing();
      return false;
    }
  }
}

export function applyRemoteAppDataRow(row: UserAppDataRow, userId: string): void {
  if (!row || typeof row !== 'object') return;
  if (row.updated_at && row.updated_at === lastPushedAt) return;
  hydrateStoresFromSnapshot(appDataRowToSnapshot(row), userId);
  lastPushedAt = row.updated_at ?? lastPushedAt;
  markCloudSynced();
}

export function scheduleCloudSave(): void {
  if (applyingRemote || !signedInUserId || !isSupabaseConfigured()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (applyingRemote || !signedInUserId) return;
    void saveUserDataToCloud(signedInUserId, collectUserDataSnapshot());
  }, PUSH_DEBOUNCE_MS);
}

export async function flushCloudSave(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (applyingRemote || !signedInUserId) return;
  await saveUserDataToCloud(signedInUserId, collectUserDataSnapshot());
}

/** ログイン中のストア更新を 1 秒デバウンスでクラウドへ送る。 */
export function startCloudSyncAutoPush(): () => void {
  if (autoPushStarted) {
    return stopCloudSyncAutoPush;
  }
  autoPushStarted = true;
  unsubscribeUserStore = useUserStore.subscribe(() => {
    scheduleCloudSave();
  });
  unsubscribeQuestStore = useDailyQuestStore.subscribe(() => {
    scheduleCloudSave();
  });
  unsubscribeDirty = onProgressDirty(() => {
    scheduleCloudSave();
  });
  return stopCloudSyncAutoPush;
}

export function stopCloudSyncAutoPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  unsubscribeUserStore?.();
  unsubscribeQuestStore?.();
  unsubscribeDirty?.();
  unsubscribeUserStore = null;
  unsubscribeQuestStore = null;
  unsubscribeDirty = null;
  autoPushStarted = false;
}

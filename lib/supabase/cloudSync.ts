// ==========================================
// Apex Suite: Math Lab - Realtime cloud sync engine
// ==========================================
// Google ログイン中の学習データ正本は Supabase `user_app_data`。
// load はクラウドでストアを完全上書きし、save は 1 秒デバウンスで upsert する。

import {
  USER_APP_DATA_TABLE,
  USER_PROGRESS_TABLE,
  appDataRowToSnapshot,
  emptyDailyQuestSnapshot,
  isMissingRelationError,
  legacyProgressRowToSnapshot,
  levelFieldsFromXp,
  snapshotToAppDataRow,
  type UserAppDataRow,
  type UserProgressRow,
  type UserProgressSnapshot,
} from '@/lib/supabase/progress';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured, isSupabaseNetworkError } from '@/lib/supabase/config';
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

export function describeCloudSyncError(error: unknown): string {
  if (isMissingRelationError(error)) {
    return `テーブル ${USER_APP_DATA_TABLE} が存在しません`;
  }
  if (isSupabaseNetworkError(error)) {
    return 'ネットワークに接続できません';
  }
  if (!error) return '原因不明のエラー';
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'object') {
    const record = error as { message?: string; code?: string; details?: string; hint?: string };
    if (record.code === '42501' || record.code === 'PGRST301') return '保存権限がありません（RLS）';
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.details ? `${record.message}（${record.details}）` : record.message;
    }
    if (typeof record.details === 'string' && record.details.trim()) return record.details;
    if (typeof record.hint === 'string' && record.hint.trim()) return record.hint;
  }
  return '原因不明のエラー';
}

function notifyCloudSyncError(error: unknown, context: string): void {
  const reason = describeCloudSyncError(error);
  console.error(`[cloudSync] ${context}`, error);
  useCloudSyncStore.getState().setError(reason);
  useAppToastStore.getState().showToast(`クラウド同期エラー: ${reason}`, 'error');
}

async function selectAppData(userId: string): Promise<UserProgressSnapshot | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase クライアントを初期化できません');

  const { data, error } = await supabase
    .from(USER_APP_DATA_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
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

async function insertInitialRow(userId: string, snapshot: UserProgressSnapshot): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase クライアントを初期化できません');

  const row = snapshotToAppDataRow(userId, {
    ...snapshot,
    progressUpdatedAt: new Date().toISOString(),
  });
  const { error } = await supabase.from(USER_APP_DATA_TABLE).insert(row);
  if (error) {
    const record = error as { code?: string };
    if (record.code === '23505') {
      const existing = await selectAppData(userId);
      if (existing) {
        hydrateStoresFromSnapshot(existing, userId);
        lastPushedAt = existing.progressUpdatedAt;
        return true;
      }
    }
    throw error;
  }
  lastPushedAt = row.updated_at ?? null;
  return true;
}

/**
 * クラウドの学習データを端末へ完全復元する。
 * レコードがなければ、現在のストア初期状態で INSERT する。
 */
export async function loadUserDataFromCloud(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    notifyCloudSyncError(new Error('Supabase クライアントを初期化できません'), 'クラウド読込に失敗しました');
    return false;
  }

  useCloudSyncStore.getState().setSyncing();
  try {
    const remote = await selectAppData(userId);
    if (remote) {
      hydrateStoresFromSnapshot(remote, userId);
      lastPushedAt = remote.progressUpdatedAt;
      useCloudSyncStore.getState().setSynced();
      scheduleCloudSave();
      return true;
    }

    const legacy = await selectLegacyProgress(userId);
    const seed = legacy ?? collectUserDataSnapshot();
    if (legacy) hydrateStoresFromSnapshot(legacy, userId);
    await insertInitialRow(userId, seed);
    useCloudSyncStore.getState().setSynced();
    return true;
  } catch (error) {
    notifyCloudSyncError(error, 'user_app_data の読込に失敗しました');
    return false;
  }
}

/**
 * ストアの最新状態を `user_app_data` へ upsert する。
 */
export async function saveUserDataToCloud(userId: string, state?: unknown): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    notifyCloudSyncError(new Error('Supabase クライアントを初期化できません'), 'クラウド保存に失敗しました');
    return false;
  }

  const snapshot = snapshotFromState(state);
  const row = snapshotToAppDataRow(userId, {
    ...snapshot,
    progressUpdatedAt: new Date().toISOString(),
  });

  useCloudSyncStore.getState().setSyncing();
  try {
    const { error } = await supabase.from(USER_APP_DATA_TABLE).upsert(
      { ...row, user_id: userId, updated_at: row.updated_at },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    lastPushedAt = row.updated_at ?? null;
    useCloudSyncStore.getState().setSynced();
    return true;
  } catch (error) {
    notifyCloudSyncError(error, 'user_app_data の保存に失敗しました');
    return false;
  }
}

export function applyRemoteAppDataRow(row: UserAppDataRow, userId: string): void {
  if (!row || typeof row !== 'object') return;
  if (row.updated_at && row.updated_at === lastPushedAt) return;
  hydrateStoresFromSnapshot(appDataRowToSnapshot(row), userId);
  lastPushedAt = row.updated_at ?? lastPushedAt;
  useCloudSyncStore.getState().setSynced();
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

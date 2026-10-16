// ==========================================
// Apex Suite: Math Lab - Cross-device app data merge
// ==========================================
// `user_app_data` が正本。旧 `user_progress` は初回移行の読み取り専用フォールバック。

import type {
  CustomDailyQuest,
  CustomProblemFile,
  CustomSolutionNote,
  GeneratedProblem,
  PatternNotesMap,
  PatternVariant,
  SolutionPattern,
  SolvedProblemRecord,
} from '@/types/mathLab';
import type { PatternOverride } from '@/lib/storage/patternStrategyStore';
import { clampDifficulty, DEFAULT_DIFFICULTY, DIFFICULTY_SCALE_VERSION } from '@/lib/engine/difficultyScale';
import { DEFAULT_MAX_ENERGY } from '@/lib/engine/energyCosts';
import { calculateLevelFromTotalXp } from '@/lib/engine/adaptiveEngine';
import { clampQuestCount, DEFAULT_DAILY_QUEST_COUNT, normalizeDailyQuests } from '@/data/dailyQuests';
import { mergePatternNoteMaps, normalizePatternNotes, overridesToPatternNotes } from '@/lib/storage/patternNotes';

export const USER_APP_DATA_TABLE = 'user_app_data';
export const USER_PROGRESS_TABLE = 'user_progress';

const MAX_SOLVED_RECORDS = 300;

export interface DailyQuestCloudSnapshot {
  dateISO: string;
  questCount: number;
  quests: CustomDailyQuest[];
  rewardsClaimedToday: number;
}

export interface UserProgressSnapshot {
  totalXp: number;
  streakDays: number;
  lastActiveDateISO: string | null;
  lastStreakGrantDateISO: string | null;
  energy: number;
  maxEnergy: number;
  lastEnergyRefillDateISO: string | null;
  progressUpdatedAt: string | null;
  clearedPatternIds: string[];
  discoveredPatterns: SolutionPattern[];
  patternNotes: PatternNotesMap;
  patternCustomNames: Record<string, string>;
  patternVariantCounts: Record<string, number>;
  patternVariants: Record<string, PatternVariant[]>;
  customFiles: CustomProblemFile[];
  unlockedWeaponIds: string[];
  masteredWeaponIds: string[];
  currentDifficulty: number;
  difficultyScaleVersion: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  solutionNotes: Record<string, CustomSolutionNote>;
  strategyOverrides: Record<string, PatternOverride>;
  dailyQuests: DailyQuestCloudSnapshot;
  solvedProblems: SolvedProblemRecord[];
}

export interface UserAppDataRow {
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date_iso: string | null;
  last_streak_grant_date_iso: string | null;
  energy: number;
  max_energy: number;
  last_energy_refill_date_iso: string | null;
  mastered_pattern_ids: string[];
  discovered_patterns: SolutionPattern[];
  pattern_notes: PatternNotesMap;
  pattern_custom_names: Record<string, string>;
  pattern_variant_counts: Record<string, number>;
  pattern_variants: Record<string, PatternVariant[]>;
  custom_files: CustomProblemFile[];
  unlocked_weapon_ids: string[];
  mastered_weapon_ids: string[];
  current_difficulty: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  solution_notes: Record<string, CustomSolutionNote>;
  daily_quests: DailyQuestCloudSnapshot | null;
  solved_problems: SolvedProblemRecord[];
  updated_at?: string;
}

/** 旧 user_progress 行。初回だけ読んで user_app_data へ移す */
export interface UserProgressRow {
  user_id: string;
  total_xp: number;
  streak_days: number;
  last_active_date_iso: string | null;
  energy: number;
  max_energy: number;
  last_energy_refill_date_iso: string | null;
  cleared_pattern_ids: string[];
  discovered_patterns: SolutionPattern[];
  unlocked_weapon_ids: string[];
  current_difficulty: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  solution_notes: Record<string, CustomSolutionNote>;
  strategy_overrides: Record<string, PatternOverride>;
  updated_at?: string;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, item] of Object.entries(asRecord(value))) {
    if (typeof item === 'string' && item.trim()) next[key] = item.trim();
  }
  return next;
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, item] of Object.entries(asRecord(value))) {
    const parsed = typeof item === 'number' ? item : Number(item);
    if (Number.isFinite(parsed) && parsed > 0) next[key] = Math.round(parsed);
  }
  return next;
}

function isGeneratedProblemLike(value: unknown): value is GeneratedProblem {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.questionText === 'string';
}

function isSolutionPatternLike(value: unknown): value is SolutionPattern {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.patternName === 'string' &&
    typeof candidate.strategyText === 'string'
  );
}

function normalizeDiscovered(value: unknown): SolutionPattern[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSolutionPatternLike).map((pattern) => ({ ...pattern, discovered: true }));
}

function normalizePatternVariants(value: unknown): Record<string, PatternVariant[]> {
  const next: Record<string, PatternVariant[]> = {};
  for (const [patternId, items] of Object.entries(asRecord(value))) {
    if (!Array.isArray(items)) continue;
    const variants = items.filter((item): item is PatternVariant => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.patternId === 'string' &&
        isGeneratedProblemLike(candidate.problem)
      );
    });
    if (variants.length > 0) next[patternId] = variants;
  }
  return next;
}

function normalizeCustomFiles(value: unknown): CustomProblemFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is CustomProblemFile => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === 'string' && typeof candidate.title === 'string' && Array.isArray(candidate.problems);
    })
    .map((file) => {
      const problems = file.problems.filter(isGeneratedProblemLike);
      return {
        ...file,
        title: file.title.trim() || '無題のファイル',
        problems,
        problemIds: problems.map((problem) => problem.id),
      };
    });
}

function normalizeSolvedProblems(value: unknown): SolvedProblemRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is SolvedProblemRecord => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === 'string' && isGeneratedProblemLike(candidate.problem);
    })
    .sort((left, right) => (right.solvedAt ?? '').localeCompare(left.solvedAt ?? ''))
    .slice(0, MAX_SOLVED_RECORDS);
}

export function emptyDailyQuestSnapshot(): DailyQuestCloudSnapshot {
  return {
    dateISO: '',
    questCount: DEFAULT_DAILY_QUEST_COUNT,
    quests: normalizeDailyQuests(undefined, DEFAULT_DAILY_QUEST_COUNT),
    rewardsClaimedToday: 0,
  };
}

function normalizeDailyQuestSnapshot(value: unknown): DailyQuestCloudSnapshot {
  const source = asRecord(value);
  const questCount = clampQuestCount(
    typeof source.questCount === 'number' ? source.questCount : DEFAULT_DAILY_QUEST_COUNT
  );
  return {
    dateISO: typeof source.dateISO === 'string' ? source.dateISO : '',
    questCount,
    quests: normalizeDailyQuests(source.quests as CustomDailyQuest[] | undefined, questCount),
    rewardsClaimedToday:
      typeof source.rewardsClaimedToday === 'number' ? Math.max(0, Math.round(source.rewardsClaimedToday)) : 0,
  };
}

function mergeDiscovered(local: SolutionPattern[], remote: SolutionPattern[]): SolutionPattern[] {
  const byId = new Map<string, SolutionPattern>();
  const byKey = new Map<string, string>();
  for (const pattern of [...remote, ...local]) {
    if (!pattern || typeof pattern.id !== 'string') continue;
    const key = `${pattern.unitId ?? ''}::${pattern.patternName}`;
    const existingId = byKey.get(key);
    if (existingId && existingId !== pattern.id) continue;
    byId.set(pattern.id, { ...pattern, discovered: true });
    byKey.set(key, pattern.id);
  }
  return [...byId.values()];
}

function pickLaterDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function mergeByUpdatedAt<T extends { updatedAt: string }>(
  local: Record<string, T>,
  remote: Record<string, T>
): Record<string, T> {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const next: Record<string, T> = {};
  keys.forEach((key) => {
    const left = local[key];
    const right = remote[key];
    if (!left) {
      next[key] = right;
      return;
    }
    if (!right) {
      next[key] = left;
      return;
    }
    next[key] = left.updatedAt >= right.updatedAt ? left : right;
  });
  return next;
}

function mergeStringRecords(
  local: Record<string, string>,
  remote: Record<string, string>
): Record<string, string> {
  return { ...remote, ...local };
}

function mergeNumberRecords(
  local: Record<string, number>,
  remote: Record<string, number>
): Record<string, number> {
  const next = { ...remote };
  for (const [key, value] of Object.entries(local)) {
    next[key] = Math.max(next[key] ?? 0, value);
  }
  return next;
}

function mergePatternVariants(
  local: Record<string, PatternVariant[]>,
  remote: Record<string, PatternVariant[]>
): Record<string, PatternVariant[]> {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const next: Record<string, PatternVariant[]> = {};
  ids.forEach((patternId) => {
    const byId = new Map<string, PatternVariant>();
    for (const variant of [...(remote[patternId] ?? []), ...(local[patternId] ?? [])]) {
      if (variant?.id) byId.set(variant.id, variant);
    }
    const merged = [...byId.values()];
    if (merged.length > 0) next[patternId] = merged;
  });
  return next;
}

function mergeCustomFiles(local: CustomProblemFile[], remote: CustomProblemFile[]): CustomProblemFile[] {
  const byId = new Map<string, CustomProblemFile>();
  for (const file of [...remote, ...local]) {
    if (!file?.id) continue;
    const existing = byId.get(file.id);
    if (!existing) {
      byId.set(file.id, file);
      continue;
    }
    const newer = (file.updatedAt ?? '') >= (existing.updatedAt ?? '') ? file : existing;
    const older = newer === file ? existing : file;
    const problemsById = new Map(older.problems.map((problem) => [problem.id, problem]));
    for (const problem of newer.problems) problemsById.set(problem.id, problem);
    const problems = [...problemsById.values()];
    byId.set(file.id, {
      ...newer,
      problems,
      problemIds: problems.map((problem) => problem.id),
    });
  }
  return [...byId.values()].sort((left, right) => (right.updatedAt ?? '').localeCompare(left.updatedAt ?? ''));
}

function mergeSolvedProblems(
  local: SolvedProblemRecord[],
  remote: SolvedProblemRecord[]
): SolvedProblemRecord[] {
  const byId = new Map<string, SolvedProblemRecord>();
  for (const record of [...remote, ...local]) {
    if (!record?.id) continue;
    const existing = byId.get(record.id);
    if (!existing || (record.solvedAt ?? '') >= (existing.solvedAt ?? '')) {
      byId.set(record.id, record);
    }
  }
  return [...byId.values()]
    .sort((left, right) => (right.solvedAt ?? '').localeCompare(left.solvedAt ?? ''))
    .slice(0, MAX_SOLVED_RECORDS);
}

function mergeDailyQuests(
  local: DailyQuestCloudSnapshot,
  remote: DailyQuestCloudSnapshot
): DailyQuestCloudSnapshot {
  if (!local.dateISO) return remote;
  if (!remote.dateISO) return local;
  if (local.dateISO !== remote.dateISO) {
    return local.dateISO >= remote.dateISO ? local : remote;
  }
  const questCount = Math.max(local.questCount, remote.questCount);
  const remoteById = new Map(remote.quests.map((quest) => [quest.id, quest]));
  const localById = new Map(local.quests.map((quest) => [quest.id, quest]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);
  const mergedQuests = [...ids].map((id) => {
    const left = localById.get(id);
    const right = remoteById.get(id);
    if (!left) return right as CustomDailyQuest;
    if (!right) return left;
    return {
      ...left,
      isCompleted: left.isCompleted || right.isCompleted,
      isRewardClaimed: left.isRewardClaimed || right.isRewardClaimed,
    };
  });
  return {
    dateISO: local.dateISO,
    questCount,
    quests: normalizeDailyQuests(mergedQuests, questCount),
    rewardsClaimedToday: Math.max(local.rewardsClaimedToday, remote.rewardsClaimedToday),
  };
}

export function snapshotToAppDataRow(userId: string, snapshot: UserProgressSnapshot): UserAppDataRow {
  const xpInfo = calculateLevelFromTotalXp(snapshot.totalXp);
  return {
    user_id: userId,
    xp: snapshot.totalXp,
    level: xpInfo.level,
    streak_days: snapshot.streakDays,
    last_active_date_iso: snapshot.lastActiveDateISO,
    last_streak_grant_date_iso: snapshot.lastStreakGrantDateISO,
    energy: snapshot.energy,
    max_energy: DEFAULT_MAX_ENERGY,
    last_energy_refill_date_iso: snapshot.lastEnergyRefillDateISO,
    mastered_pattern_ids: uniqueStrings(snapshot.clearedPatternIds),
    discovered_patterns: snapshot.discoveredPatterns,
    pattern_notes: snapshot.patternNotes,
    pattern_custom_names: snapshot.patternCustomNames,
    pattern_variant_counts: snapshot.patternVariantCounts,
    pattern_variants: snapshot.patternVariants,
    custom_files: snapshot.customFiles,
    unlocked_weapon_ids: snapshot.unlockedWeaponIds,
    mastered_weapon_ids: snapshot.masteredWeaponIds,
    current_difficulty: snapshot.currentDifficulty,
    consecutive_correct: snapshot.consecutiveCorrect,
    consecutive_incorrect: snapshot.consecutiveIncorrect,
    solution_notes: snapshot.solutionNotes,
    daily_quests: snapshot.dailyQuests,
    solved_problems: snapshot.solvedProblems,
    updated_at: snapshot.progressUpdatedAt ?? new Date().toISOString(),
  };
}

export function appDataRowToSnapshot(row: UserAppDataRow): UserProgressSnapshot {
  const mastered = Array.isArray(row.mastered_pattern_ids) ? row.mastered_pattern_ids : [];
  const patternNotes = normalizePatternNotes(row.pattern_notes);
  return {
    totalXp: row.xp ?? 0,
    streakDays: row.streak_days ?? 0,
    lastActiveDateISO: row.last_active_date_iso ?? null,
    lastStreakGrantDateISO: row.last_streak_grant_date_iso ?? null,
    energy: row.energy ?? DEFAULT_MAX_ENERGY,
    maxEnergy: DEFAULT_MAX_ENERGY,
    lastEnergyRefillDateISO: row.last_energy_refill_date_iso ?? null,
    progressUpdatedAt: row.updated_at ?? null,
    clearedPatternIds: uniqueStrings(mastered),
    discoveredPatterns: normalizeDiscovered(row.discovered_patterns),
    patternNotes,
    patternCustomNames: normalizeStringRecord(row.pattern_custom_names),
    patternVariantCounts: normalizeNumberRecord(row.pattern_variant_counts),
    patternVariants: normalizePatternVariants(row.pattern_variants),
    customFiles: normalizeCustomFiles(row.custom_files),
    unlockedWeaponIds: Array.isArray(row.unlocked_weapon_ids) ? row.unlocked_weapon_ids : [],
    masteredWeaponIds: Array.isArray(row.mastered_weapon_ids) ? row.mastered_weapon_ids : [],
    currentDifficulty: clampDifficulty(row.current_difficulty ?? DEFAULT_DIFFICULTY),
    difficultyScaleVersion: DIFFICULTY_SCALE_VERSION,
    consecutiveCorrect: row.consecutive_correct ?? 0,
    consecutiveIncorrect: row.consecutive_incorrect ?? 0,
    solutionNotes: row.solution_notes ?? {},
    strategyOverrides: {},
    dailyQuests: normalizeDailyQuestSnapshot(row.daily_quests),
    solvedProblems: normalizeSolvedProblems(row.solved_problems),
  };
}

export function legacyProgressRowToSnapshot(row: UserProgressRow): UserProgressSnapshot {
  const notesFromOverrides = overridesToPatternNotes(row.strategy_overrides ?? {});
  return {
    totalXp: row.total_xp ?? 0,
    streakDays: row.streak_days ?? 0,
    lastActiveDateISO: row.last_active_date_iso ?? null,
    lastStreakGrantDateISO: null,
    energy: row.energy ?? DEFAULT_MAX_ENERGY,
    maxEnergy: DEFAULT_MAX_ENERGY,
    lastEnergyRefillDateISO: row.last_energy_refill_date_iso ?? null,
    progressUpdatedAt: row.updated_at ?? null,
    clearedPatternIds: Array.isArray(row.cleared_pattern_ids) ? row.cleared_pattern_ids : [],
    discoveredPatterns: normalizeDiscovered(row.discovered_patterns),
    patternNotes: notesFromOverrides,
    patternCustomNames: {},
    patternVariantCounts: {},
    patternVariants: {},
    customFiles: [],
    unlockedWeaponIds: Array.isArray(row.unlocked_weapon_ids) ? row.unlocked_weapon_ids : [],
    masteredWeaponIds: [],
    currentDifficulty: clampDifficulty(row.current_difficulty ?? DEFAULT_DIFFICULTY),
    difficultyScaleVersion: DIFFICULTY_SCALE_VERSION,
    consecutiveCorrect: row.consecutive_correct ?? 0,
    consecutiveIncorrect: row.consecutive_incorrect ?? 0,
    solutionNotes: row.solution_notes ?? {},
    strategyOverrides: row.strategy_overrides ?? {},
    dailyQuests: emptyDailyQuestSnapshot(),
    solvedProblems: [],
  };
}

export function mergeProgress(
  local: UserProgressSnapshot,
  remote: UserProgressSnapshot
): UserProgressSnapshot {
  const totalXp = Math.max(local.totalXp, remote.totalXp);
  const localIsNewer = (local.progressUpdatedAt ?? '') >= (remote.progressUpdatedAt ?? '');
  const energy = localIsNewer ? local.energy : remote.energy;
  const progressUpdatedAt = pickLaterDate(local.progressUpdatedAt, remote.progressUpdatedAt);
  const patternNotes = mergePatternNoteMaps(remote.patternNotes, local.patternNotes);

  return {
    totalXp,
    streakDays: Math.max(local.streakDays, remote.streakDays),
    lastActiveDateISO: pickLaterDate(local.lastActiveDateISO, remote.lastActiveDateISO),
    lastStreakGrantDateISO: pickLaterDate(local.lastStreakGrantDateISO, remote.lastStreakGrantDateISO),
    energy,
    maxEnergy: DEFAULT_MAX_ENERGY,
    lastEnergyRefillDateISO: pickLaterDate(local.lastEnergyRefillDateISO, remote.lastEnergyRefillDateISO),
    progressUpdatedAt,
    clearedPatternIds: uniqueStrings([...local.clearedPatternIds, ...remote.clearedPatternIds]),
    discoveredPatterns: mergeDiscovered(local.discoveredPatterns, remote.discoveredPatterns),
    patternNotes,
    patternCustomNames: mergeStringRecords(local.patternCustomNames, remote.patternCustomNames),
    patternVariantCounts: mergeNumberRecords(local.patternVariantCounts, remote.patternVariantCounts),
    patternVariants: mergePatternVariants(local.patternVariants, remote.patternVariants),
    customFiles: mergeCustomFiles(local.customFiles, remote.customFiles),
    unlockedWeaponIds: uniqueStrings([...local.unlockedWeaponIds, ...remote.unlockedWeaponIds]),
    masteredWeaponIds: uniqueStrings([...local.masteredWeaponIds, ...remote.masteredWeaponIds]),
    currentDifficulty: clampDifficulty(
      Math.max(local.currentDifficulty, remote.currentDifficulty)
    ),
    difficultyScaleVersion: DIFFICULTY_SCALE_VERSION,
    consecutiveCorrect: Math.max(local.consecutiveCorrect, remote.consecutiveCorrect),
    consecutiveIncorrect: Math.max(local.consecutiveIncorrect, remote.consecutiveIncorrect),
    solutionNotes: mergeByUpdatedAt(local.solutionNotes, remote.solutionNotes),
    strategyOverrides: mergeByUpdatedAt(local.strategyOverrides, remote.strategyOverrides),
    dailyQuests: mergeDailyQuests(local.dailyQuests, remote.dailyQuests),
    solvedProblems: mergeSolvedProblems(local.solvedProblems, remote.solvedProblems),
  };
}

export function levelFieldsFromXp(totalXp: number) {
  const info = calculateLevelFromTotalXp(totalXp);
  return {
    totalXp,
    level: info.level,
    xpIntoCurrentLevel: info.xpIntoCurrentLevel,
    xpRequiredForNextLevel: info.xpRequiredForNextLevel,
  };
}

export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { code?: string; message?: string; details?: string };
  const text = `${record.code ?? ''} ${record.message ?? ''} ${record.details ?? ''}`.toLowerCase();
  return (
    record.code === '42P01' ||
    record.code === 'PGRST205' ||
    text.includes('schema cache') ||
    text.includes('does not exist') ||
    text.includes('could not find the table')
  );
}

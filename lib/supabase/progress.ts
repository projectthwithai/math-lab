// ==========================================
// Apex Suite: Math Lab - Cross-device progress merge
// ==========================================

import type { CustomSolutionNote, SolutionPattern } from '@/types/mathLab';
import type { PatternOverride } from '@/lib/storage/patternStrategyStore';
import { calculateLevelFromTotalXp } from '@/lib/engine/adaptiveEngine';
import { DEFAULT_MAX_ENERGY } from '@/lib/engine/energyCosts';

export const USER_PROGRESS_TABLE = 'user_progress';

export interface UserProgressSnapshot {
  totalXp: number;
  streakDays: number;
  lastActiveDateISO: string | null;
  energy: number;
  maxEnergy: number;
  lastEnergyRefillDateISO: string | null;
  progressUpdatedAt: string | null;
  clearedPatternIds: string[];
  discoveredPatterns: SolutionPattern[];
  unlockedWeaponIds: string[];
  currentDifficulty: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  solutionNotes: Record<string, CustomSolutionNote>;
  strategyOverrides: Record<string, PatternOverride>;
}

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

function mergeDiscovered(
  local: SolutionPattern[],
  remote: SolutionPattern[]
): SolutionPattern[] {
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

export function snapshotToRow(userId: string, snapshot: UserProgressSnapshot): UserProgressRow {
  return {
    user_id: userId,
    total_xp: snapshot.totalXp,
    streak_days: snapshot.streakDays,
    last_active_date_iso: snapshot.lastActiveDateISO,
    energy: snapshot.energy,
    max_energy: DEFAULT_MAX_ENERGY,
    last_energy_refill_date_iso: snapshot.lastEnergyRefillDateISO,
    cleared_pattern_ids: snapshot.clearedPatternIds,
    discovered_patterns: snapshot.discoveredPatterns,
    unlocked_weapon_ids: snapshot.unlockedWeaponIds,
    current_difficulty: snapshot.currentDifficulty,
    consecutive_correct: snapshot.consecutiveCorrect,
    consecutive_incorrect: snapshot.consecutiveIncorrect,
    solution_notes: snapshot.solutionNotes,
    strategy_overrides: snapshot.strategyOverrides,
  };
}

export function rowToSnapshot(row: UserProgressRow): UserProgressSnapshot {
  return {
    totalXp: row.total_xp ?? 0,
    streakDays: row.streak_days ?? 0,
    lastActiveDateISO: row.last_active_date_iso ?? null,
    energy: row.energy ?? DEFAULT_MAX_ENERGY,
    maxEnergy: DEFAULT_MAX_ENERGY,
    lastEnergyRefillDateISO: row.last_energy_refill_date_iso ?? null,
    progressUpdatedAt: row.updated_at ?? null,
    clearedPatternIds: Array.isArray(row.cleared_pattern_ids) ? row.cleared_pattern_ids : [],
    discoveredPatterns: Array.isArray(row.discovered_patterns) ? row.discovered_patterns : [],
    unlockedWeaponIds: Array.isArray(row.unlocked_weapon_ids) ? row.unlocked_weapon_ids : [],
    currentDifficulty: row.current_difficulty ?? 5,
    consecutiveCorrect: row.consecutive_correct ?? 0,
    consecutiveIncorrect: row.consecutive_incorrect ?? 0,
    solutionNotes: row.solution_notes ?? {},
    strategyOverrides: row.strategy_overrides ?? {},
  };
}

export function mergeProgress(
  local: UserProgressSnapshot,
  remote: UserProgressSnapshot
): UserProgressSnapshot {
  const totalXp = Math.max(local.totalXp, remote.totalXp);
  const maxEnergy = DEFAULT_MAX_ENERGY;
  const localIsNewer = (local.progressUpdatedAt ?? '') >= (remote.progressUpdatedAt ?? '');
  const energy = localIsNewer ? local.energy : remote.energy;
  const progressUpdatedAt = pickLaterDate(local.progressUpdatedAt, remote.progressUpdatedAt);

  return {
    totalXp,
    streakDays: Math.max(local.streakDays, remote.streakDays),
    lastActiveDateISO: pickLaterDate(local.lastActiveDateISO, remote.lastActiveDateISO),
    energy,
    maxEnergy,
    lastEnergyRefillDateISO: pickLaterDate(
      local.lastEnergyRefillDateISO,
      remote.lastEnergyRefillDateISO
    ),
    progressUpdatedAt,
    clearedPatternIds: uniqueStrings([...local.clearedPatternIds, ...remote.clearedPatternIds]),
    discoveredPatterns: mergeDiscovered(local.discoveredPatterns, remote.discoveredPatterns),
    unlockedWeaponIds: uniqueStrings([...local.unlockedWeaponIds, ...remote.unlockedWeaponIds]),
    currentDifficulty: Math.max(local.currentDifficulty, remote.currentDifficulty),
    consecutiveCorrect: Math.max(local.consecutiveCorrect, remote.consecutiveCorrect),
    consecutiveIncorrect: Math.max(local.consecutiveIncorrect, remote.consecutiveIncorrect),
    solutionNotes: mergeByUpdatedAt(local.solutionNotes, remote.solutionNotes),
    strategyOverrides: mergeByUpdatedAt(local.strategyOverrides, remote.strategyOverrides),
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

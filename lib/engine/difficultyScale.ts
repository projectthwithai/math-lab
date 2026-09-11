// ==========================================
// Apex Suite: Math Lab - Difficulty Scale ★1〜★5
// ==========================================

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;
export const DEFAULT_DIFFICULTY = 3;
/** persist された旧 1〜10 スケールを識別する */
export const DIFFICULTY_SCALE_VERSION = 5;

export interface DifficultyStarMeta {
  value: number;
  starLabel: string;
  label: string;
  hint: string;
}

export const DIFFICULTY_STAR_META: readonly DifficultyStarMeta[] = [
  { value: 1, starLabel: '★1', label: '基礎', hint: '公式直接代入・計算' },
  { value: 2, starLabel: '★2', label: '標準', hint: '定期テスト・共通テスト基礎' },
  { value: 3, starLabel: '★3', label: '応用', hint: '共通テスト標準・典型入試' },
  { value: 4, starLabel: '★4', label: '発展', hint: '難関大・国公立・MARCH二次' },
  { value: 5, starLabel: '★5', label: '最難関', hint: '東大・京大・旧帝・医学部難問' },
] as const;

export function clampDifficulty(difficulty: number): number {
  if (!Number.isFinite(difficulty)) return DEFAULT_DIFFICULTY;
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.round(difficulty)));
}

/** 旧 1〜10 スケールを ★1〜★5 へ写像する（1-2→1 … 9-10→5） */
export function migrateDifficultyFromLegacy10(difficulty: number): number {
  if (!Number.isFinite(difficulty)) return DEFAULT_DIFFICULTY;
  const rounded = Math.round(difficulty);
  if (rounded <= 0) return MIN_DIFFICULTY;
  if (rounded > MAX_DIFFICULTY) {
    return clampDifficulty(Math.ceil(rounded / 2));
  }
  return clampDifficulty(rounded);
}

export function migrateStoredDifficulty(difficulty: number, scaleVersion?: number): number {
  if (scaleVersion === DIFFICULTY_SCALE_VERSION) {
    return clampDifficulty(difficulty);
  }
  if (!Number.isFinite(difficulty)) return DEFAULT_DIFFICULTY;
  const rounded = Math.round(difficulty);
  if (rounded > MAX_DIFFICULTY) {
    return clampDifficulty(Math.ceil(rounded / 2));
  }
  // 旧ストアは 1〜10 で、5 が中央だった。バージョン未記録なら 1〜10 とみなして写像する。
  return clampDifficulty(Math.ceil(rounded / 2));
}

export function getDifficultyMeta(difficulty: number): DifficultyStarMeta {
  const value = clampDifficulty(difficulty);
  return DIFFICULTY_STAR_META[value - 1];
}

export function formatStarDifficulty(difficulty: number): string {
  const meta = getDifficultyMeta(difficulty);
  return `${meta.starLabel} ${meta.label}`;
}

export type DifficultyTier = 'basic' | 'standard' | 'hard';

/** ★1=基礎 / ★2-3=標準・応用 / ★4-5=発展・最難関 */
export function getDifficultyTier(difficulty: number): DifficultyTier {
  const value = clampDifficulty(difficulty);
  if (value <= 1) return 'basic';
  if (value <= 3) return 'standard';
  return 'hard';
}

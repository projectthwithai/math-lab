// ==========================================
// Math Lab - Solution Patterns Master Data
// ==========================================
// 各サブトピックに ★1〜★4 の標準4型（基礎定義 / 標準連立 / 応用範囲 / 発展ひっかけ）を配備する。
// 例題・方針の実体は `standardSubtopicPatterns.ts`。ここが図鑑・出題プールの公開API。

import type { SolutionPattern } from '@/types/mathLab';
import { clampDifficulty } from '@/lib/engine/difficultyScale';
import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory } from './unitsData';
import {
  buildStandardSubtopicPatterns,
  PATTERN_STAR_ARCHETYPES,
} from './standardSubtopicPatterns';

export const PATTERN_LEVEL_LABELS: Record<SolutionPattern['level'], string> = {
  basic: '基本',
  standard: '標準',
  advanced: '応用',
};

export const PATTERN_STAR_TYPE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '★1 基礎定義',
  2: '★2 標準連立',
  3: '★3 応用範囲',
  4: '★4 発展ひっかけ',
};

export const SOLUTION_PATTERNS: SolutionPattern[] = buildStandardSubtopicPatterns();

/** 旧図鑑ID → 標準4型ID。ゲスト体験・保存済み攻略IDの互換用。 */
const LEGACY_PATTERN_ALIASES: Record<string, string> = {
  'sp-numbers-01': 'sp-num-factor-t1',
  'sp-numbers-02': 'sp-num-abs-t4',
  'sp-numbers-03': 'sp-num-ineq-t3',
  'sp-quadratic-01': 'sp-quad-complete-t2',
  'sp-quadratic-02': 'sp-quad-minmax-axis-t3',
  'sp-quadratic-03': 'sp-quad-minmax-range-t3',
};

export function getPatternDefaultDifficulty(level: SolutionPattern['level']): number {
  if (level === 'basic') return 1;
  if (level === 'standard') return 2;
  return 4;
}

export function getPatternStarDifficulty(
  pattern: Pick<SolutionPattern, 'difficulty' | 'level'>
): number {
  if (typeof pattern.difficulty === 'number' && Number.isFinite(pattern.difficulty)) {
    return clampDifficulty(pattern.difficulty);
  }
  return getPatternDefaultDifficulty(pattern.level);
}

export function getPatternStarTypeLabel(pattern: Pick<SolutionPattern, 'difficulty' | 'level'>): string {
  const star = getPatternStarDifficulty(pattern);
  if (star >= 1 && star <= 4) {
    return PATTERN_STAR_TYPE_LABELS[star as 1 | 2 | 3 | 4];
  }
  return `★${star}`;
}

export function findSolutionPatternById(patternId: string | undefined): SolutionPattern | undefined {
  if (!patternId) return undefined;
  const direct = SOLUTION_PATTERNS.find((pattern) => pattern.id === patternId);
  if (direct) return direct;
  const aliased = LEGACY_PATTERN_ALIASES[patternId];
  if (!aliased) return undefined;
  return SOLUTION_PATTERNS.find((pattern) => pattern.id === aliased);
}

export function getSolutionPatternsByUnit(unitId: string): SolutionPattern[] {
  return SOLUTION_PATTERNS.filter((pattern) => pattern.unitId === unitId);
}

export function getSolutionPatternsBySubtopic(subtopicId: string): SolutionPattern[] {
  return SOLUTION_PATTERNS.filter((pattern) => pattern.subtopicId === subtopicId);
}

function categoryForUnitId(unitId: string | undefined): UnitCategory | null {
  if (!unitId) return null;
  const unit = UNITS_DATA.find((candidate) => candidate.id === unitId);
  return unit?.category ?? null;
}

function masteryPercent(clearedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((clearedCount / totalCount) * 100);
}

/** 静的図鑑 + 発掘パターンを ID 重複なしで結合した実カタログ */
export function collectPatternCatalog(discoveredPatterns: SolutionPattern[] = []): SolutionPattern[] {
  const byId = new Map<string, SolutionPattern>();
  for (const pattern of SOLUTION_PATTERNS) {
    byId.set(pattern.id, pattern);
  }
  for (const pattern of discoveredPatterns) {
    if (!pattern || typeof pattern.id !== 'string' || pattern.id.length === 0) continue;
    if (byId.has(pattern.id)) continue;
    byId.set(pattern.id, { ...pattern, discovered: true });
  }
  return [...byId.values()];
}

/** 制覇ID。旧図鑑エイリアスも現行IDへ正規化する */
export function resolveMasteredPatternIds(clearedPatternIds: string[]): Set<string> {
  const mastered = new Set<string>();
  for (const id of clearedPatternIds) {
    if (typeof id !== 'string' || id.length === 0) continue;
    mastered.add(id);
    const aliased = LEGACY_PATTERN_ALIASES[id];
    if (aliased) mastered.add(aliased);
  }
  return mastered;
}

export function countMasteredInCatalog(
  catalog: SolutionPattern[],
  masteredIds: Set<string>
): number {
  return catalog.filter((pattern) => masteredIds.has(pattern.id)).length;
}

export interface WeaknessRadarAxis {
  label: UnitCategory;
  /** そのカテゴリの攻略達成率 (0-100) = 制覇数 / 総パターン数 * 100 */
  value: number;
  totalCount: number;
  clearedCount: number;
}

export function getWeaknessRadarData(
  clearedPatternIds: string[],
  discoveredPatterns: SolutionPattern[] = []
): WeaknessRadarAxis[] {
  const catalog = collectPatternCatalog(discoveredPatterns);
  const masteredIds = resolveMasteredPatternIds(clearedPatternIds);

  return UNIT_CATEGORIES.map((category) => {
    const patternsInCategory = catalog.filter(
      (pattern) => categoryForUnitId(pattern.unitId) === category
    );
    const totalCount = patternsInCategory.length;
    const clearedCount = countMasteredInCatalog(patternsInCategory, masteredIds);
    return {
      label: category,
      value: masteryPercent(clearedCount, totalCount),
      totalCount,
      clearedCount,
    };
  });
}

export interface PatternCompletionSummary {
  totalCount: number;
  clearedCount: number;
  completionPercent: number;
}

export function getCompletionSummary(
  clearedPatternIds: string[],
  discoveredPatterns: SolutionPattern[] = []
): PatternCompletionSummary {
  const catalog = collectPatternCatalog(discoveredPatterns);
  const masteredIds = resolveMasteredPatternIds(clearedPatternIds);
  const totalCount = catalog.length;
  const clearedCount = countMasteredInCatalog(catalog, masteredIds);
  return {
    totalCount,
    clearedCount,
    completionPercent: masteryPercent(clearedCount, totalCount),
  };
}

export interface UnitPatternStats {
  unitId: string;
  totalCount: number;
  clearedCount: number;
  completionPercent: number;
}

export function getUnitPatternStats(
  unitId: string,
  clearedPatternIds: string[],
  discoveredPatterns: SolutionPattern[] = []
): UnitPatternStats {
  const catalog = collectPatternCatalog(discoveredPatterns).filter((pattern) => pattern.unitId === unitId);
  const masteredIds = resolveMasteredPatternIds(clearedPatternIds);
  const totalCount = catalog.length;
  const clearedCount = countMasteredInCatalog(catalog, masteredIds);
  return {
    unitId,
    totalCount,
    clearedCount,
    completionPercent: masteryPercent(clearedCount, totalCount),
  };
}

export function getCatalogPatternsForUnit(
  unitId: string,
  discoveredPatterns: SolutionPattern[] = []
): SolutionPattern[] {
  return collectPatternCatalog(discoveredPatterns).filter((pattern) => pattern.unitId === unitId);
}

export function getCatalogPatternsForSubtopic(
  subtopicId: string,
  discoveredPatterns: SolutionPattern[] = []
): SolutionPattern[] {
  return collectPatternCatalog(discoveredPatterns).filter((pattern) => pattern.subtopicId === subtopicId);
}

export { PATTERN_STAR_ARCHETYPES };

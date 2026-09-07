// ==========================================
// Apex Suite: Math Lab - Unit Practice Pattern Pool
// ==========================================
// 単元演習の出題プール = 図鑑の固定パターン + ユーザーが発掘したパターン。
// patternId 指定時はそのパターンを優先。未指定時は均等抽選。

import type { SolutionPattern } from '@/types/mathLab';
import { SOLUTION_PATTERNS, getSolutionPatternsByUnit } from '@/data/patternsData';

export interface PickedPracticePattern {
  pattern: SolutionPattern | null;
  fromDiscovered: boolean;
}

function isDiscoveredPattern(pattern: SolutionPattern): boolean {
  return pattern.discovered === true || pattern.id.startsWith('ai-pat-');
}

export function findPatternInPools(
  patternId: string | undefined,
  discoveredPatterns: SolutionPattern[]
): PickedPracticePattern | null {
  if (!patternId) return null;
  const fromDiscovered = discoveredPatterns.find((pattern) => pattern.id === patternId);
  if (fromDiscovered) {
    return { pattern: fromDiscovered, fromDiscovered: true };
  }
  const fromCatalog = SOLUTION_PATTERNS.find((pattern) => pattern.id === patternId);
  if (fromCatalog) {
    return { pattern: fromCatalog, fromDiscovered: isDiscoveredPattern(fromCatalog) };
  }
  return null;
}

export function pickPracticePattern(params: {
  unitId?: string;
  patternId?: string;
  discoveredPatterns: SolutionPattern[];
}): PickedPracticePattern {
  const explicit = findPatternInPools(params.patternId, params.discoveredPatterns);
  if (explicit) return explicit;

  const unitId = params.unitId;
  const catalog = unitId ? getSolutionPatternsByUnit(unitId) : [];
  const excavated = params.discoveredPatterns.filter((pattern) => {
    if (!unitId) return true;
    return pattern.unitId === unitId;
  });

  const pool: PickedPracticePattern[] = [
    ...catalog.map((pattern) => ({
      pattern,
      fromDiscovered: false,
    })),
    ...excavated.map((pattern) => ({
      pattern,
      fromDiscovered: true,
    })),
  ];

  if (pool.length === 0) {
    return { pattern: null, fromDiscovered: false };
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

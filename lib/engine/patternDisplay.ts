// ==========================================
// Apex Suite: Math Lab - Pattern display names & 6-layer view model
// ==========================================

import type { PatternItem, SolutionPattern } from '@/types/mathLab';
import { getPatternStarDifficulty } from '@/data/patternsData';

export function resolvePatternDisplayName(
  pattern: Pick<SolutionPattern, 'patternName' | 'customName'> | null | undefined,
  customName?: string | null
): string {
  const renamed = customName?.trim() || pattern?.customName?.trim();
  if (renamed) return renamed;
  return pattern?.patternName ?? '';
}

export function solutionPatternToItem(
  pattern: SolutionPattern,
  options?: { customName?: string; isMastered?: boolean; variantsCount?: number }
): PatternItem {
  return {
    id: pattern.id,
    subtopicId: pattern.subtopicId ?? '',
    unitId: pattern.unitId ?? '',
    subject: pattern.subject,
    defaultName: pattern.patternName,
    customName: options?.customName?.trim() || pattern.customName,
    difficulty: getPatternStarDifficulty(pattern),
    strategyText: pattern.strategyText,
    exampleQuestion: pattern.exampleQuestion,
    variantsCount: options?.variantsCount ?? pattern.variantsCount,
    isMastered: options?.isMastered,
  };
}

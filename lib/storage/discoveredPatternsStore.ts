// ==========================================
// Apex Suite: Math Lab - Discovered Patterns Store (compat)
// ==========================================
// 正本は `lib/store/userStore.ts` の `discoveredPatterns`。
// 旧 LocalStorage 直書きAPIを残し、Zustand へ委譲する。

import type { SolutionPattern } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';

export function getAllDiscoveredPatterns(): SolutionPattern[] {
  return useUserStore.getState().discoveredPatterns;
}

export function getDiscoveredPatternsByUnit(unitId: string): SolutionPattern[] {
  return useUserStore.getState().discoveredPatterns.filter((pattern) => pattern.unitId === unitId);
}

export function appendDiscoveredPatterns(unitId: string, incoming: SolutionPattern[]): SolutionPattern[] {
  const stamped = incoming.map((pattern) => ({
    ...pattern,
    unitId: pattern.unitId ?? unitId,
    discovered: true as const,
  }));
  return useUserStore.getState().appendDiscoveredPatterns(stamped);
}

export function updateDiscoveredPatternStrategy(patternId: string, strategyText: string): void {
  useUserStore.getState().updateDiscoveredPatternStrategy(patternId, strategyText);
}

// ==========================================
// Apex Suite: Math Lab - 単元総復習（ボスバトル）
// ==========================================
// 全サブトピックから満遍なく patternId を抽出し、模試エンジンで 5 問を開始する。

import { getSubtopicsForUnit } from '@/data/subtopicsData';
import { getSolutionPatternsByUnit } from '@/data/patternsData';
import { saveMockExamConfig } from '@/lib/engine/mockExam';

export function pickCoveringPatternIds(unitId: string, count = 5): string[] {
  const subtopics = getSubtopicsForUnit(unitId);
  const patterns = getSolutionPatternsByUnit(unitId);
  if (patterns.length === 0) return [];

  const picked: string[] = [];
  const used = new Set<string>();

  for (const subtopic of subtopics) {
    const pool = patterns.filter((pattern) => pattern.subtopicId === subtopic.id && !used.has(pattern.id));
    if (pool.length === 0) continue;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    picked.push(choice.id);
    used.add(choice.id);
    if (picked.length >= count) break;
  }

  let cursor = 0;
  while (picked.length < count && cursor < patterns.length * 2) {
    const candidate = patterns[cursor % patterns.length];
    cursor += 1;
    if (used.has(candidate.id)) continue;
    picked.push(candidate.id);
    used.add(candidate.id);
  }

  return picked.slice(0, count);
}

export function startUnitReviewExam(unitId: string): void {
  const patternIds = pickCoveringPatternIds(unitId, 5);
  saveMockExamConfig({
    unitIds: [unitId],
    difficulty: 2,
    minutes: 25,
    questionCount: Math.max(1, patternIds.length || 5),
    style: 'mixed',
    patternIds: patternIds.length > 0 ? patternIds : undefined,
  });
}

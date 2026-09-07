// ==========================================
// Apex Suite: Math Lab - Pattern memo lookup
// ==========================================
// 単元演習で patternId が付いた問題に、図鑑の自分流メモ /
// 過去問で書き換えた解法ノートを自動紐付けする。

import type { PatternLinkedMemo } from '@/types/mathLab';
import { getAllCustomSolutionNotes } from '@/lib/storage/customSolutionNotesStore';
import { getPatternOverride } from '@/lib/storage/patternStrategyStore';
import { getAllSolvedProblemRecords } from '@/lib/storage/solvedProblemsStore';
import { SOLUTION_PATTERNS } from '@/data/patternsData';

export function findPatternLinkedMemo(patternId: string | undefined): PatternLinkedMemo | null {
  if (!patternId) return null;

  const override = getPatternOverride(patternId);
  if (override && override.customStrategyText.trim().length > 0) {
    return {
      patternId,
      content: override.customStrategyText,
      updatedAt: override.updatedAt,
      source: 'strategy',
      label: '図鑑の自分流メモ',
    };
  }

  const notes = Object.values(getAllCustomSolutionNotes()).filter(
    (note) => note.patternId === patternId && note.content.trim().length > 0
  );
  notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (notes[0]) {
    return {
      patternId,
      content: notes[0].content,
      updatedAt: notes[0].updatedAt,
      source: 'note',
      label: 'このパターンの解法ノート',
    };
  }

  const records = getAllSolvedProblemRecords().filter((record) => record.problem.patternId === patternId);
  for (const record of records) {
    const note = getAllCustomSolutionNotes()[record.problem.id];
    if (note && note.content.trim().length > 0) {
      return {
        patternId,
        content: note.content,
        updatedAt: note.updatedAt,
        source: 'note',
        label: '過去に書いた自分メモ',
      };
    }
  }

  return null;
}

export function getPatternDisplayName(patternId: string | undefined): string | undefined {
  if (!patternId) return undefined;
  return SOLUTION_PATTERNS.find((pattern) => pattern.id === patternId)?.patternName;
}

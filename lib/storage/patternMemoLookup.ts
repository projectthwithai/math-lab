// ==========================================
// Apex Suite: Math Lab - Pattern memo lookup
// ==========================================
// 単元演習で patternId が付いた問題に、一元管理された解法メモを自動紐付けする。

import type { PatternLinkedMemo } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';
import { getAllCustomSolutionNotes } from '@/lib/storage/customSolutionNotesStore';
import { getPatternOverride } from '@/lib/storage/patternStrategyStore';
import { findSolutionPatternById } from '@/data/patternsData';

export function findPatternLinkedMemo(patternId: string | undefined): PatternLinkedMemo | null {
  if (!patternId) return null;

  const unified = useUserStore.getState().patternNotes[patternId];
  if (unified && unified.customText.trim().length > 0) {
    return {
      patternId,
      content: unified.customText,
      updatedAt: unified.updatedAt,
      source: 'strategy',
      label: 'このパターンの自分流メモ',
    };
  }

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

  return null;
}

export function getPatternDisplayName(patternId: string | undefined): string | undefined {
  if (!patternId) return undefined;
  return findSolutionPatternById(patternId)?.patternName;
}

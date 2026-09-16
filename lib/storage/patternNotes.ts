// ==========================================
// Apex Suite: Math Lab - Pattern notes (patternId 一元管理)
// ==========================================
// 解法メモの正本は userStore.patternNotes。
// 旧 LocalStorage（問題IDノート / 図鑑オーバーライド）と Supabase 同期用に
// 双方向へミラーし、patternId をプライマリキーとしてマージする。

import type { CustomSolutionNote, PatternNote, PatternNotesMap } from '@/types/mathLab';
import {
  getAllCustomSolutionNotes,
  replaceAllCustomSolutionNotes,
} from '@/lib/storage/customSolutionNotesStore';
import {
  getAllPatternOverrides,
  replaceAllPatternOverrides,
  type PatternOverride,
} from '@/lib/storage/patternStrategyStore';

export function isPatternNote(value: unknown): value is PatternNote {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.customText === 'string' && typeof candidate.updatedAt === 'string';
}

export function normalizePatternNotes(raw: unknown): PatternNotesMap {
  if (!raw || typeof raw !== 'object') return {};
  const next: PatternNotesMap = {};
  for (const [patternId, note] of Object.entries(raw as Record<string, unknown>)) {
    const id = patternId.trim();
    if (!id || !isPatternNote(note)) continue;
    next[id] = {
      customText: note.customText,
      updatedAt: note.updatedAt,
      ...(typeof note.aiFeedback === 'string' && note.aiFeedback.trim()
        ? { aiFeedback: note.aiFeedback }
        : {}),
    };
  }
  return next;
}

export function mergePatternNoteMaps(...maps: PatternNotesMap[]): PatternNotesMap {
  const next: PatternNotesMap = {};
  for (const map of maps) {
    for (const [patternId, note] of Object.entries(map)) {
      if (!patternId || !note) continue;
      const existing = next[patternId];
      if (!existing || note.updatedAt >= existing.updatedAt) {
        next[patternId] = {
          customText: note.customText,
          updatedAt: note.updatedAt,
          aiFeedback: note.aiFeedback || existing?.aiFeedback,
        };
      } else if (!existing.aiFeedback && note.aiFeedback) {
        next[patternId] = { ...existing, aiFeedback: note.aiFeedback };
      }
    }
  }
  return next;
}

function patternKeyFromProblemId(problemId: string): string | null {
  if (problemId.startsWith('pattern:')) {
    const id = problemId.slice('pattern:'.length).trim();
    return id || null;
  }
  return null;
}

export function collectLegacyPatternNotes(): PatternNotesMap {
  const fromOverrides: PatternNotesMap = {};
  for (const [patternId, override] of Object.entries(getAllPatternOverrides())) {
    if (!patternId || !override?.customStrategyText?.trim()) continue;
    fromOverrides[patternId] = {
      customText: override.customStrategyText,
      updatedAt: override.updatedAt,
      ...(override.aiFeedback?.trim() ? { aiFeedback: override.aiFeedback } : {}),
    };
  }

  const fromProblemNotes: PatternNotesMap = {};
  for (const note of Object.values(getAllCustomSolutionNotes())) {
    if (!note?.content?.trim()) continue;
    const patternId = note.patternId?.trim() || patternKeyFromProblemId(note.problemId);
    if (!patternId) continue;
    const existing = fromProblemNotes[patternId];
    if (!existing || note.updatedAt >= existing.updatedAt) {
      fromProblemNotes[patternId] = {
        customText: note.content,
        updatedAt: note.updatedAt,
      };
    }
  }

  return mergePatternNoteMaps(fromOverrides, fromProblemNotes);
}

export function patternNotesToOverrides(notes: PatternNotesMap): Record<string, PatternOverride> {
  const overrides: Record<string, PatternOverride> = {};
  for (const [patternId, note] of Object.entries(notes)) {
    if (!patternId || !note.customText.trim()) continue;
    overrides[patternId] = {
      patternId,
      customStrategyText: note.customText,
      updatedAt: note.updatedAt,
      ...(note.aiFeedback?.trim() ? { aiFeedback: note.aiFeedback } : {}),
    };
  }
  return overrides;
}

export function overridesToPatternNotes(overrides: Record<string, PatternOverride>): PatternNotesMap {
  const notes: PatternNotesMap = {};
  for (const [patternId, override] of Object.entries(overrides ?? {})) {
    if (!patternId || !override?.customStrategyText?.trim()) continue;
    notes[patternId] = {
      customText: override.customStrategyText,
      updatedAt: override.updatedAt,
      ...(override.aiFeedback?.trim() ? { aiFeedback: override.aiFeedback } : {}),
    };
  }
  return notes;
}

export function solutionNotesToPatternNotes(
  solutionNotes: Record<string, CustomSolutionNote>
): PatternNotesMap {
  const notes: PatternNotesMap = {};
  for (const note of Object.values(solutionNotes ?? {})) {
    if (!note?.content?.trim()) continue;
    const patternId = note.patternId?.trim() || patternKeyFromProblemId(note.problemId);
    if (!patternId) continue;
    const existing = notes[patternId];
    if (!existing || note.updatedAt >= existing.updatedAt) {
      notes[patternId] = {
        customText: note.content,
        updatedAt: note.updatedAt,
      };
    }
  }
  return notes;
}

/** userStore 正本を旧ストレージへミラーし、図鑑・クラウド同期と互換を保つ。 */
export function mirrorPatternNotesToLegacyStores(notes: PatternNotesMap): void {
  replaceAllPatternOverrides(patternNotesToOverrides(notes));

  const existing = getAllCustomSolutionNotes();
  const next: Record<string, CustomSolutionNote> = {};
  for (const [key, note] of Object.entries(existing)) {
    const patternId = note.patternId?.trim() || patternKeyFromProblemId(note.problemId);
    if (patternId && notes[patternId]) continue;
    if (patternId && !notes[patternId]) continue;
    next[key] = note;
  }
  for (const [patternId, note] of Object.entries(notes)) {
    if (!note.customText.trim()) continue;
    next[`pattern:${patternId}`] = {
      problemId: `pattern:${patternId}`,
      patternId,
      content: note.customText,
      updatedAt: note.updatedAt,
    };
  }
  replaceAllCustomSolutionNotes(next);
}

export function resolvePatternNoteText(
  notes: PatternNotesMap,
  patternId: string | undefined | null
): string {
  if (!patternId) return '';
  return notes[patternId]?.customText?.trim() ?? '';
}

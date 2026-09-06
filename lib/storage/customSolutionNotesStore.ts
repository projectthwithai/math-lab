// ==========================================
// Apex Suite: Math Lab - Custom Solution Notes Store
// ==========================================
// 「✍️ 自分の言葉で解説を書き換えてノートに保存」機能のためのLocalStorage永続化。
// Supabase連携までのゼロコストな暫定実装。

import type { CustomSolutionNote } from '@/types/mathLab';

const STORAGE_KEY = 'math-lab:custom-solution-notes';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readAllNotes(): Record<string, CustomSolutionNote> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CustomSolutionNote>;
  } catch (error) {
    console.error('[customSolutionNotesStore] 読み込みに失敗しました', error);
    return {};
  }
}

function writeAllNotes(notes: Record<string, CustomSolutionNote>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('[customSolutionNotesStore] 保存に失敗しました', error);
  }
}

export function getCustomSolutionNote(problemId: string): CustomSolutionNote | null {
  const notes = readAllNotes();
  return notes[problemId] ?? null;
}

export function saveCustomSolutionNote(problemId: string, content: string): CustomSolutionNote {
  const notes = readAllNotes();
  const note: CustomSolutionNote = {
    problemId,
    content,
    updatedAt: new Date().toISOString(),
  };
  notes[problemId] = note;
  writeAllNotes(notes);
  return note;
}

export function deleteCustomSolutionNote(problemId: string): void {
  const notes = readAllNotes();
  delete notes[problemId];
  writeAllNotes(notes);
}

// ==========================================
// Apex Suite: Math Lab - Solved Problems Store（マイライブラリ永続化）
// ==========================================
// 過去に解いた問題（マイ問題集）をLocalStorageに保存する。
// エビングハウスの忘却曲線（lib/engine/forgettingCurve.ts）に基づき、
// 各レコードは「次回復習日時（nextReviewAt）」を持つ。
// Supabase連携までのゼロコストな暫定実装。

import type { GeneratedProblem, SolvedProblemRecord } from '@/types/mathLab';
import { advanceReviewStage, computeNextReviewAt } from '@/lib/engine/forgettingCurve';

const STORAGE_KEY = 'math-lab:solved-problems';
/** 1ユーザーあたり保持する解答履歴の上限（LocalStorage肥大化防止） */
const MAX_RECORDS = 300;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readAllRecords(): SolvedProblemRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SolvedProblemRecord[];
  } catch (error) {
    console.error('[solvedProblemsStore] 読み込みに失敗しました', error);
    return [];
  }
}

function writeAllRecords(records: SolvedProblemRecord[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('[solvedProblemsStore] 保存に失敗しました', error);
  }
}

/** 全ての解答履歴を、解いた日時が新しい順で取得する */
export function getAllSolvedProblemRecords(): SolvedProblemRecord[] {
  return [...readAllRecords()].sort(
    (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
  );
}

/** 1問解答した結果をマイライブラリに新規記録する（reviewStage=0からスタート） */
export function addSolvedProblemRecord(
  problem: GeneratedProblem,
  isCorrect: boolean
): SolvedProblemRecord {
  const solvedAt = new Date().toISOString();
  const record: SolvedProblemRecord = {
    id: `solved-${problem.id}-${Date.now()}`,
    problem,
    isCorrect,
    solvedAt,
    reviewStage: 0,
    nextReviewAt: computeNextReviewAt(solvedAt, 0),
  };

  const records = [record, ...readAllRecords()].slice(0, MAX_RECORDS);
  writeAllRecords(records);
  return record;
}

/** 復習（再挑戦）した結果を反映し、reviewStageと次回復習日時を更新する */
export function markRecordReviewed(recordId: string, isCorrect: boolean): SolvedProblemRecord | null {
  const records = readAllRecords();
  const index = records.findIndex((record) => record.id === recordId);
  if (index === -1) return null;

  const target = records[index];
  const advanced = advanceReviewStage(target.reviewStage, isCorrect);
  const updated: SolvedProblemRecord = {
    ...target,
    isCorrect,
    reviewStage: advanced.reviewStage,
    nextReviewAt: advanced.nextReviewAt,
  };

  records[index] = updated;
  writeAllRecords(records);
  return updated;
}

/** マイライブラリから1件削除する */
export function deleteSolvedProblemRecord(recordId: string): void {
  const records = readAllRecords().filter((record) => record.id !== recordId);
  writeAllRecords(records);
}

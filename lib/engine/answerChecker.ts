// ==========================================
// Apex Suite: Math Lab - Answer Checker（採点ロジック共通化）
// ==========================================
// WorkspaceView（本番の出題）とマイライブラリのRetryModal（復習の再挑戦）の
// 両方から使う採点ロジックを1箇所に集約する。

import type { GeneratedProblem } from '@/types/mathLab';
import { reconcileCorrectAnswer } from '@/lib/engine/correctAnswer';

function parseNumericAnswer(raw: string): number | null {
  const parsed = Number(raw.trim().replace(/,/g, ''));
  return Number.isFinite(parsed) && raw.trim().length > 0 ? parsed : null;
}

/** ユーザーの入力と正解を比較し、正誤を判定する（数値は誤差0.05まで許容、文字列は trim して比較） */
export function checkAnswer(userInput: string, correctAnswer: string | number): boolean {
  const trimmed = userInput.trim();
  if (trimmed.length === 0) return false;
  const expected = String(correctAnswer).trim();
  if (expected.length === 0) return false;

  const userNum = parseNumericAnswer(trimmed);
  const expectedNum = parseNumericAnswer(expected);
  if (userNum != null && expectedNum != null) {
    return Math.abs(userNum - expectedNum) < 0.05;
  }

  const normalize = (value: string) => value.replace(/[\s、。，,]/g, '').toLowerCase();
  return normalize(trimmed) === normalize(expected);
}

/** 問題文・解説と correctAnswer が食い違っていても、同期した正解で採点する */
export function checkProblemAnswer(userInput: string, problem: GeneratedProblem): boolean {
  return checkAnswer(userInput.trim(), reconcileCorrectAnswer(problem));
}

// ==========================================
// Apex Suite: Math Lab - Answer Checker（採点ロジック共通化）
// ==========================================
// WorkspaceView（本番の出題）と模試・マイライブラリ復習の採点を1箇所に集約する。
// 文字列の完全一致ではなく、mathEvaluator の数学的同値性で判定する。

import type { GeneratedProblem } from '@/types/mathLab';
import { reconcileCorrectAnswer } from '@/lib/engine/correctAnswer';
import { isMathAnswerEquivalent } from '@/lib/engine/mathEvaluator';

/** ユーザーの入力と正解を比較し、正誤を判定する（因数・解の順不同と表記ゆれを許容） */
export function checkAnswer(userInput: string, correctAnswer: string | number): boolean {
  return isMathAnswerEquivalent(userInput, String(correctAnswer));
}

/** 問題文・解説と correctAnswer が食い違っていても、同期した正解で採点する */
export function checkProblemAnswer(userInput: string, problem: GeneratedProblem): boolean {
  return checkAnswer(userInput.trim(), reconcileCorrectAnswer(problem));
}

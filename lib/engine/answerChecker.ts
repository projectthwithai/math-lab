// ==========================================
// Apex Suite: Math Lab - Answer Checker（採点ロジック共通化）
// ==========================================
// WorkspaceView（本番の出題）とマイライブラリのRetryModal（復習の再挑戦）の
// 両方から使う採点ロジックを1箇所に集約する。

/** ユーザーの入力と正解を比較し、正誤を判定する（数値は誤差0.05まで許容、文字列は空白・記号を無視） */
export function checkAnswer(userInput: string, correctAnswer: string | number): boolean {
  const trimmed = userInput.trim();
  if (trimmed.length === 0) return false;

  if (typeof correctAnswer === 'number') {
    const parsed = Number(trimmed.replace(/,/g, ''));
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - correctAnswer) < 0.05;
  }

  const normalize = (value: string) => value.replace(/[\s、。，,]/g, '').toLowerCase();
  return normalize(trimmed) === normalize(String(correctAnswer));
}

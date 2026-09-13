// ==========================================
// Apex Suite: Math Lab - Solution Chat Mock
// ==========================================
// GEMINI_API_KEY 未設定・タイムアウト時のみ使う短いフォールバック。

import type { GeneratedProblem } from '@/types/mathLab';

export function buildChatSolutionMockReply(userMessage: string, problem: GeneratedProblem): string {
  const message = userMessage.toLowerCase();
  const trap = problem.explanation.commonMistakes || '定義域・符号・場合分けの漏れ';

  if (message.includes('別解') || message.includes('他の解き方') || message.includes('違う方法')) {
    return (
      `別解の骨格は使えそうだが、この問題では「${trap}」が反例になりやすい。` +
      '同じ結論になるか、境界の値で一度検算してから本番の答案に書こう。'
    );
  }
  if (message.includes('公式') || message.includes('formula')) {
    return `鍵は ${problem.explanation.keyFormula || '問題の条件に合う公式'} だ。適用条件を先に書いてから代入しないと、類似問題で落ちる。`;
  }
  if (message.includes('わからない') || message.includes('ヒント') || message.includes('分からない')) {
    return `${problem.hints[0]} その次に、答えだけでなく「なぜその変形が許されるか」を一文で言えるか確認しよう。`;
  }

  return (
    `いまの方針で進めてよいが、飛躍がないかは「${trap}」で切る。` +
    '途中式を1行ずつ、仮定した条件がまだ生きているかだけ見てほしい。'
  );
}

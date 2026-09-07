// ==========================================
// Apex Suite: Math Lab - Stamp Discovered Pattern on a Problem
// ==========================================
// 単元の解けるモック／LLM問題に、発掘パターンのメタ情報を重ねる。
// 数字再生成（templateConfig）は維持したまま、図鑑連動バッジ用フラグを付ける。

import type { GeneratedProblem, SolutionPattern } from '@/types/mathLab';

function splitStrategyHints(strategyText: string): [string, string, string] {
  const sentences = strategyText
    .split(/(?<=[。！？\n])/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return [
    sentences[0] ?? '発掘した方針の最初の一歩を確認する。',
    sentences[1] ?? '数字が変わっても同じ手順が使えるか確かめる。',
    sentences[2] ?? '例外・場合分け・定義域を最後に見直す。',
  ];
}

export function stampDiscoveredProblem(
  problem: GeneratedProblem,
  pattern: SolutionPattern
): GeneratedProblem {
  return {
    ...problem,
    id: `discovered-${pattern.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    patternId: pattern.id,
    fromDiscoveredPattern: true,
    title: pattern.patternName,
    hints: splitStrategyHints(pattern.strategyText),
    explanation: {
      ...problem.explanation,
      commonMistakes:
        problem.explanation.commonMistakes ||
        '発掘パターンを過一般化して、条件が違う類似問題にそのまま当てはめること。',
    },
  };
}

export function stampCatalogProblem(
  problem: GeneratedProblem,
  pattern: SolutionPattern
): GeneratedProblem {
  return {
    ...problem,
    patternId: pattern.id,
    fromDiscoveredPattern: false,
  };
}

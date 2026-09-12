// ==========================================
// Apex Suite: Math Lab - LaTeX / 数式クリーナー
// ==========================================
// 係数 1 の不自然な表記（1x, -1x, 1x^2, 1(x+1) 等）を除去する。
// 10, 11, 21x, 1.5x のような実数・複数桁は壊さない。

import type { GeneratedProblem } from '@/types/mathLab';

/** 変数記号・LaTeXコマンド・括弧の直前にある係数 1 を消す対象 */
const AFTER_ONE = '(?:[A-Za-zθπΔδλμσω]|\\\\[A-Za-z]+|\\()';

function cleanOnce(source: string): string {
  // 下付き `_1x` や `{1}` の 1 は係数ではないので消さない（x_1x_2 → x_x_2 を防止）
  return source
    .replace(new RegExp(`(^|[^0-9._])-1(?=${AFTER_ONE})`, 'g'), '$1-')
    .replace(new RegExp(`(^|[^0-9._])\\+1(?=${AFTER_ONE})`, 'g'), '$1+')
    .replace(new RegExp(`(^|[^0-9._])1(?=${AFTER_ONE})`, 'g'), '$1');
}

/**
 * LaTeX / 混在テキスト内の係数 1 を整形する。
 * `$1x$` → `$x$` / `$-1x$` → `$-x$` / `$1x^2$` → `$x^2$`
 */
export function cleanLatexFormula(latex: string): string {
  if (!latex) return latex;
  let current = latex;
  for (let i = 0; i < 3; i += 1) {
    const next = cleanOnce(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function cleanGeneratedProblem(problem: GeneratedProblem): GeneratedProblem {
  return {
    ...problem,
    title: cleanLatexFormula(problem.title),
    questionText: cleanLatexFormula(problem.questionText),
    choices: problem.choices?.map((choice) => cleanLatexFormula(choice)),
    correctAnswer:
      typeof problem.correctAnswer === 'string'
        ? cleanLatexFormula(problem.correctAnswer)
        : problem.correctAnswer,
    hints: [
      cleanLatexFormula(problem.hints[0]),
      cleanLatexFormula(problem.hints[1]),
      cleanLatexFormula(problem.hints[2]),
    ],
    explanation: {
      stepByStep: problem.explanation.stepByStep.map((step) => cleanLatexFormula(step)),
      keyFormula: cleanLatexFormula(problem.explanation.keyFormula),
      commonMistakes: cleanLatexFormula(problem.explanation.commonMistakes),
    },
    templateConfig: problem.templateConfig
      ? {
          ...problem.templateConfig,
          templateText: cleanLatexFormula(problem.templateConfig.templateText),
        }
      : problem.templateConfig,
  };
}

// ==========================================
// Apex Suite: Math Lab - Local Regeneration Engine
// ==========================================
// 「数字を変えて再生成（APIコスト0）」を実現する、100%クライアントサイドで
// 動作する再計算エンジン。`templateConfig` に保存されたテンプレートと計算ロジックを
// 使い、新しい乱数の組み合わせで問題を再生成する。

import type { GeneratedProblem } from '@/types/mathLab';
import { attachMathGraphVisual } from '@/lib/engine/mathGraphVisual';
import { attachGeometryVisual } from '@/lib/engine/geometryVisual';

/** [min, max]をstep刻みで取り得る値からランダムに1つ選ぶ */
function randomInRange(min: number, max: number, step: number): number {
  const effectiveStep = step > 0 ? step : 1;
  const stepCount = Math.floor((max - min) / effectiveStep);
  const chosenStep = Math.floor(Math.random() * (stepCount + 1));
  const value = min + chosenStep * effectiveStep;
  // 浮動小数点誤差対策
  return Math.round(value * 1000) / 1000;
}

interface CalcLogicResult {
  vars: Record<string, number | string>;
  correctAnswer: string | number;
  choices?: string[];
  explanationSteps?: string[];
}

/**
 * `calcLogicJS` 文字列（関数本体）を評価し、生成された変数から
 * 計算結果（正解・派生変数・任意で選択肢・解説ステップ）を得る。
 * このプロジェクト内で管理するテンプレートのみを評価するため、
 * 外部入力を評価することはない。
 */
function evaluateCalcLogic(
  calcLogicJS: string,
  vars: Record<string, number>
): CalcLogicResult {
  const fn = new Function('vars', calcLogicJS) as (
    vars: Record<string, number>
  ) => CalcLogicResult;
  return fn(vars);
}

/** `{{key}}` 形式のプレースホルダーを`vars`の値で置換する */
function fillTemplate(template: string, vars: Record<string, number | string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return key in vars ? String(vars[key]) : match;
  });
}

/**
 * `templateConfig` を持つ問題を、新しいランダム値で再生成する。
 * APIコストは一切発生しない（ローカル計算のみ）。
 */
export function regenerateProblemLocally(problem: GeneratedProblem): GeneratedProblem {
  const templateConfig = problem.templateConfig;
  if (!templateConfig) {
    // 再生成テンプレートを持たない問題はそのまま返す
    return problem;
  }

  const rawVars: Record<string, number> = {};
  for (const [key, range] of Object.entries(templateConfig.variables)) {
    rawVars[key] = randomInRange(range.min, range.max, range.step);
  }

  let result: CalcLogicResult;
  try {
    result = evaluateCalcLogic(templateConfig.calcLogicJS, rawVars);
  } catch (error) {
    console.error('[localRegenerator] calcLogicJS の評価に失敗しました', error);
    return problem;
  }

  const questionText = fillTemplate(templateConfig.templateText, result.vars);
  const geometry = attachGeometryVisual(problem, result.vars);
  const visual =
    geometry.visualType === 'geometry_svg' ? geometry : attachMathGraphVisual(problem, result.vars);

  return {
    ...problem,
    questionText,
    correctAnswer: result.correctAnswer,
    choices: result.choices ?? problem.choices,
    explanation: {
      ...problem.explanation,
      stepByStep: result.explanationSteps ?? problem.explanation.stepByStep,
    },
    visualType: visual.visualType,
    visualConfig: visual.visualConfig,
  };
}

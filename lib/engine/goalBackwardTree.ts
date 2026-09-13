// ==========================================
// Apex Suite: Math Lab - Goal-Backward Tree
// ==========================================
// 求めたいゴール ➔ 必要な武器 ➔ 不足条件 ➔ 逆算アプローチ
// 公式・途中式は KaTeX（$...$）で読めるように問題の keyFormula / stepByStep を優先する。

import type { GeneratedProblem, GoalBackwardTreeModel } from '@/types/mathLab';
import { WEAPONS_DATA } from '@/data/weaponsData';

export function buildGoalBackwardTree(problem: GeneratedProblem): GoalBackwardTreeModel {
  const haystack = [
    problem.title,
    problem.questionText,
    problem.explanation.keyFormula,
    problem.explanation.commonMistakes,
    ...problem.explanation.stepByStep,
    ...problem.hints,
  ]
    .join(' ')
    .toLowerCase();

  const catalogWeapons = WEAPONS_DATA.filter((weapon) => {
    if (weapon.subject !== problem.subject) return false;
    const name = weapon.name.toLowerCase();
    const category = weapon.category.toLowerCase();
    return haystack.includes(name) || haystack.includes(category.slice(0, 4));
  }).slice(0, 2);

  const formula = problem.explanation.keyFormula.trim();
  const weapons = [
    ...(formula
      ? [
          {
            name: 'この問題の鍵公式',
            formula,
            why: 'ゴールから逆算するときの最初の武器。適用条件を先に確認する。',
          },
        ]
      : []),
    ...catalogWeapons.map((weapon) => ({
      name: weapon.name,
      formula: weapon.formulaLaTeX,
      why: weapon.usageScenario,
    })),
  ].slice(0, 3);

  const missing = [
    ...problem.hints.slice(0, 2),
    ...problem.explanation.commonMistakes
      .split(/[。．]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 4),
  ].slice(0, 3);

  const approach =
    problem.explanation.stepByStep.length > 0
      ? problem.explanation.stepByStep.slice(0, 6)
      : [problem.hints[0], problem.hints[1], '鍵公式を適用し、最後に定義域・符号・単位を検算する。'];

  return {
    goal: {
      label: problem.title,
      detail: problem.questionText.replace(/\s+/g, ' ').slice(0, 220),
    },
    weapons:
      weapons.length > 0
        ? weapons
        : WEAPONS_DATA.filter((weapon) => weapon.subject === problem.subject)
            .slice(0, 2)
            .map((weapon) => ({
              name: weapon.name,
              formula: weapon.formulaLaTeX,
              why: weapon.usageScenario,
            })),
    missingConditions:
      missing.length > 0
        ? missing
        : ['与えられていない長さ・角・符号・単位を、図と条件から先に復元する'],
    approach,
  };
}

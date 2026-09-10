// ==========================================
// Apex Suite: Math Lab - Goal-Backward Tree
// ==========================================
// 求めたいゴール ➔ 必要な武器 ➔ 不足条件 ➔ 逆算アプローチ

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

  const weapons = WEAPONS_DATA.filter((weapon) => {
    if (weapon.subject !== problem.subject) return false;
    const name = weapon.name.toLowerCase();
    const category = weapon.category.toLowerCase();
    return haystack.includes(name) || haystack.includes(category.slice(0, 4));
  }).slice(0, 3);

  const fallbackWeapons =
    weapons.length > 0
      ? weapons
      : WEAPONS_DATA.filter((weapon) => weapon.subject === problem.subject).slice(0, 2);

  const missing = problem.explanation.commonMistakes
    .split(/[。．]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 4)
    .slice(0, 3);

  const approach = problem.explanation.stepByStep.slice(0, 4);

  return {
    goal: {
      label: problem.title,
      detail: problem.questionText.replace(/\s+/g, ' ').slice(0, 180),
    },
    weapons: fallbackWeapons.map((weapon) => ({
      name: weapon.name,
      formula: weapon.formulaLaTeX,
      why: weapon.usageScenario,
    })),
    missingConditions:
      missing.length > 0
        ? missing
        : ['与えられていない長さ・角・符号を、図と条件から先に復元する'],
    approach:
      approach.length > 0
        ? approach
        : [problem.hints[0], '必要な公式を適用し、最後に定義域・符号を検算する'],
  };
}

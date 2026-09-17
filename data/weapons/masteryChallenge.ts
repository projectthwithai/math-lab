// ==========================================
// Apex Suite: Math Lab - Weapon mastery quiz helper
// ==========================================
// 武器庫の成り立ち試練は LLM を使わず、静的4択のみ。

import type { WeaponItem, WeaponMasteryChallenge } from '@/types/mathLab';

export function mc(
  questionText: string,
  choices: [string, string, string, string],
  correctAnswerIndex: 0 | 1 | 2 | 3,
  explanation: string
): WeaponMasteryChallenge {
  return { questionText, choices, correctAnswerIndex, explanation };
}

export type MasteryChallengeMap = Record<string, WeaponMasteryChallenge>;

const DISTRACTORS = [
  '両辺に同じ数を掛けて形だけ合わせる',
  '単位や定義域を無視して暗記した式を使う',
  '例外条件をすべて無視して公式を適用する',
] as const;

/** 個別プリセットが無いときの導出ステップ由来フォールバック */
export function fallbackMasteryChallenge(
  draft: Pick<WeaponItem, 'name' | 'derivationSteps' | 'formulaLaTeX'>
): WeaponMasteryChallenge {
  const key = draft.derivationSteps.find((step) => step.trim().length > 0) ?? `${draft.name} の定義に戻る`;
  return mc(
    `${draft.name} が成り立つ核心のステップはどれか。`,
    [key, DISTRACTORS[0], DISTRACTORS[1], DISTRACTORS[2]],
    0,
    draft.derivationSteps.join(' ') || '公式の定義と適用条件をセットで押さえる。'
  );
}

export function resolveMasteryChallenge(
  draft: Omit<WeaponItem, 'subject'>,
  preset?: WeaponMasteryChallenge
): WeaponMasteryChallenge {
  return preset ?? draft.masteryChallenge ?? fallbackMasteryChallenge(draft);
}

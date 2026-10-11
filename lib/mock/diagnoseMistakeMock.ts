// ==========================================
// Apex Suite: Math Lab - Mistake diagnosis mock
// ==========================================

import type { MistakeDiagnosis } from '@/types/mathLab';

export function diagnoseMistakeMock(params: {
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string | number;
}): MistakeDiagnosis {
  const user = (params.userAnswer ?? '').trim();
  const correct = String(params.correctAnswer ?? '').trim();
  const looksNumeric = /^-?\d+(\.\d+)?$/.test(user) && /^-?\d+(\.\d+)?$/.test(correct);

  if (looksNumeric) {
    return {
      primaryTag: 'calc_error',
      mistakeAnalysisText:
        '専属ガイド: 方針は近いのに、途中の符号か代入で数値がずれ、最後の答えだけ正解と食い違った可能性が高い。',
    };
  }
  if (!user) {
    return {
      primaryTag: 'approach_unknown',
      mistakeAnalysisText:
        '専属ガイド: 途中式や答えが残っておらず、どの公式から入るかが立っていなかったように見える。',
    };
  }
  return {
    primaryTag: 'condition_overlook',
    mistakeAnalysisText:
      '専属ガイド: 公式の形は使えているが、定義域・場合分け・使える条件のどれかを飛ばして最後まで進めてしまった。',
  };
}

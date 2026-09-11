// ==========================================
// Apex Suite: Math Lab - Prompt Intent Resolver
// ==========================================
// 「共通テスト風のベクトルの難問を作って」などの自然文から
// 単元IDと難易度を推定する（モック生成・即時バー用）。

import { DEFAULT_DIFFICULTY } from '@/lib/engine/difficultyScale';

export interface PromptIntent {
  unitId: string;
  difficulty: number;
}

const UNIT_KEYWORDS: Array<{ keys: string[]; unitId: string }> = [
  { keys: ['ベクトル', 'vector'], unitId: 'math-2bc-vectors' },
  { keys: ['二次関数', '2次関数', '平方完成', '放物線'], unitId: 'math-1a-quadratic-functions' },
  { keys: ['三角比', '正弦定理', '余弦定理'], unitId: 'math-1a-trigonometric-ratios' },
  { keys: ['三角関数', 'sin', 'cos'], unitId: 'math-2bc-trigonometric-functions' },
  { keys: ['指数', '対数', 'log'], unitId: 'math-2bc-exponential-logarithmic' },
  { keys: ['数列', '漸化式'], unitId: 'math-2bc-sequences' },
  { keys: ['極限'], unitId: 'math-3-limits' },
  { keys: ['微分'], unitId: 'math-2bc-differentiation' },
  { keys: ['積分'], unitId: 'math-2bc-integration' },
  { keys: ['場合の数', '確率', '順列'], unitId: 'math-1a-combinatorics-probability' },
  { keys: ['整数'], unitId: 'mathA-integers' },
  { keys: ['図形'], unitId: 'mathA-plane-geometry' },
  { keys: ['複素', '二次曲線'], unitId: 'mathC-complex-plane-conics' },
  { keys: ['力学', '運動', '加速度'], unitId: 'physics-mechanics' },
  { keys: ['波', '波長'], unitId: 'physics-waves' },
  { keys: ['電流', 'オーム', '電磁'], unitId: 'physics-electromagnetism' },
  { keys: ['物質量', 'モル'], unitId: 'chemistry-composition' },
  { keys: ['中和', '酸', '塩基'], unitId: 'chemistry-acid-base' },
  { keys: ['有機'], unitId: 'chemistry-organic' },
];

export function resolvePromptIntent(prompt: string): PromptIntent {
  const text = prompt.toLowerCase();
  const unitId =
    UNIT_KEYWORDS.find((rule) => rule.keys.some((key) => text.includes(key.toLowerCase()) || prompt.includes(key)))
      ?.unitId ?? 'math-2bc-vectors';

  let difficulty = DEFAULT_DIFFICULTY;
  if (/基礎|基本|易しい|簡単/.test(prompt)) difficulty = 1;
  else if (/最難関|東大|京大|医学部/.test(prompt)) difficulty = 5;
  else if (/難問|難関|難しい|発展/.test(prompt)) difficulty = 4;
  else if (/応用|二次|難関大/.test(prompt)) difficulty = 3;
  else if (/共通テスト|センター|標準/.test(prompt)) difficulty = 2;

  return { unitId, difficulty };
}

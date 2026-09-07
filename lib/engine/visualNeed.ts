// ==========================================
// Apex Suite: Math Lab - Visual need gate
// ==========================================
// グラフ・図形は「視覚的解釈が不可欠な問題」だけに付ける。
// 単なる代入計算・理論知識では visualType を none のままにする。

import type { GeneratedProblem } from '@/types/mathLab';

export const NONE_VISUAL: Pick<GeneratedProblem, 'visualType' | 'visualConfig'> = {
  visualType: 'none',
  visualConfig: { type: 'none', params: {} },
};

const ACTIVE_VISUAL_TYPES = [
  'math_graph',
  'geometry_svg',
  'physics_simulation',
  'chemistry_animation',
] as const;

export type ActiveVisualType = (typeof ACTIVE_VISUAL_TYPES)[number];

export function isActiveVisualType(value: unknown): value is ActiveVisualType {
  return (
    value === 'math_graph' ||
    value === 'geometry_svg' ||
    value === 'physics_simulation' ||
    value === 'chemistry_animation'
  );
}

export function parseVisualType(value: unknown): GeneratedProblem['visualType'] {
  return isActiveVisualType(value) ? value : 'none';
}

/** LLM に渡す、visualType の厳格ルール */
export const VISUAL_TYPE_PROMPT_RULES =
  'visualType は次のいずれか: none | math_graph | geometry_svg | physics_simulation | chemistry_animation。' +
  '視覚的解釈が不可欠な問題にだけ visualType を付け、それ以外は必ず visualType:"none" と visualConfig:{type:"none",params:{}}。' +
  '【付けてよい】関数のグラフ・頂点・定義域の最大最小の図示、不等式の領域、三角形/円/接線/ベクトル図、' +
  '斜面上の力（角度θが与えられる）、回路図（抵抗と電圧が与えられる）、熱化学のエネルギー図（発熱/吸熱）、' +
  'P-Vグラフ（2状態の P,V が与えられる）、電池の電極図。' +
  '【禁止=none】公式へ数値を代入するだけ、解の公式、判別式、因数分解、物質量・中和の体積計算、' +
  'v=v0+at、F=ma、半減期、波長の掛け算、酸化還元の電子mol、平衡定数の代入、理論知識の穴埋め。' +
  'none のときは geometryScene を出さない。パラメータが足りず精密に描けない図も none。';

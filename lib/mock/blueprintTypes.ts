// ==========================================
// Apex Suite: Math Lab - Problem Blueprint Types
// ==========================================
// モック問題生成で共有する型と、難易度★1〜★5の3段階分岐ヘルパー。

import type { ProblemFormat, Subject } from '@/types/mathLab';
import {
  clampDifficulty,
  getDifficultyTier,
  type DifficultyTier,
} from '@/lib/engine/difficultyScale';

export { getDifficultyTier };
export type { DifficultyTier };

export type PatternKey =
  | 'numbers'
  | 'quadratic'
  | 'trigonometry'
  | 'data_analysis'
  | 'combinatorics'
  | 'plane_geometry'
  | 'integers'
  | 'remainder_theorem'
  | 'coordinate_geometry'
  | 'trig_composition'
  | 'logarithm'
  | 'differentiation'
  | 'integration'
  | 'sequence'
  | 'statistics'
  | 'limits'
  | 'differentiation_advanced'
  | 'integration_advanced'
  | 'parametric'
  | 'vector'
  | 'complex_plane'
  | 'mechanics'
  | 'gas_law_physics'
  | 'wave_speed'
  | 'ohms_law'
  | 'half_life'
  | 'mole_calculation'
  | 'gas_law'
  | 'neutralization'
  | 'redox'
  | 'equilibrium'
  | 'inorganic_stoichiometry'
  | 'organic_ihd'
  | 'polymer'
  | 'generic_math'
  | 'generic_physics'
  | 'generic_chemistry';

export interface TemplateBlueprint {
  title: string;
  unit: string;
  subject: Subject;
  format: ProblemFormat;
  variables: Record<string, { min: number; max: number; step: number }>;
  templateText: string;
  calcLogicJS: string;
  hints: [string, string, string];
  keyFormula: string;
  commonMistakes: string;
}

/** ★1=基礎 / ★2-3=標準・応用 / ★4-5=発展・最難関。数値レンジは ★1→0.6倍 〜 ★5→1.6倍 */
export function difficultySpan(
  difficulty: number,
  baseMin: number,
  baseMax: number
): { min: number; max: number } {
  const factor = 0.6 + (clampDifficulty(difficulty) - 1) * (1.0 / 4);
  const center = (baseMin + baseMax) / 2;
  const halfSpan = ((baseMax - baseMin) / 2) * factor;
  return { min: Math.round(center - halfSpan), max: Math.round(center + halfSpan) };
}

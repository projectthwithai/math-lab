// ==========================================
// Apex Suite: Math Lab - Physics / Chemistry visual resolver
// ==========================================
// 斜面・回路・熱化学エネルギー図・P-V・電池を、APIなしで
// 問題変数から組み立てる（ゼロコスト SVG 用）。

import type { GeneratedProblem } from '@/types/mathLab';

export type PhysicsSceneKind = 'incline' | 'circuit' | 'pv';
export type ChemistrySceneKind = 'energy' | 'pv' | 'battery';

export interface InclineScene {
  kind: 'incline';
  thetaDeg: number;
  massKg: number;
  mu: number | null;
}

export interface CircuitScene {
  kind: 'circuit';
  r1: number;
  r2: number;
  voltage: number;
}

export interface PhysicsPvScene {
  kind: 'pv';
  p1: number;
  v1: number;
  p2: number;
  v2: number;
}

export type PhysicsScene = InclineScene | CircuitScene | PhysicsPvScene;

export interface EnergyScene {
  kind: 'energy';
  mode: 'exothermic' | 'endothermic';
  reactants: number;
  products: number;
  activation: number;
}

export interface ChemistryPvScene {
  kind: 'pv';
  p1: number;
  v1: number;
  p2: number;
  v2: number;
}

export interface BatteryScene {
  kind: 'battery';
  anode: string;
  cathode: string;
}

export type ChemistryScene = EnergyScene | ChemistryPvScene | BatteryScene;

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickNumber(bag: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = asNumber(bag[key]);
    if (value !== null) return value;
  }
  return null;
}

function pickString(bag: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function contextText(problem: GeneratedProblem): string {
  return `${problem.unit} ${problem.title} ${problem.questionText}`;
}

function bagFromProblem(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Record<string, unknown> {
  return {
    ...(problem.visualConfig?.params ?? {}),
    ...(vars ?? {}),
  };
}

function looksCircuit(text: string): boolean {
  return /電磁|回路|オーム|抵抗|電流|電圧|直列|並列|Ω|アンペア/.test(text);
}

function looksPhysicsPv(text: string): boolean {
  return /熱力|気体|ボイル|シャルル|状態方程|圧力|体積|atm|等温/.test(text);
}

function looksBattery(text: string): boolean {
  return /電池|電極|電気分解|ダニエル|負極|正極|イオン化傾向|酸化還元/.test(text);
}

function looksChemistryPv(text: string): boolean {
  return /ボイル|シャルル|気体|圧力|体積|P-V|PV|等温|状態方程/.test(text);
}

function looksEndothermic(text: string): boolean {
  return /吸熱/.test(text) && !/発熱/.test(text);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function inferPhysicsScene(problem: GeneratedProblem, bag: Record<string, unknown>): PhysicsScene {
  const text = contextText(problem);
  const explicit = (problem.visualConfig?.type ?? '').toLowerCase();

  if (explicit === 'circuit' || (explicit !== 'incline' && explicit !== 'pv' && looksCircuit(text))) {
    return {
      kind: 'circuit',
      r1: pickNumber(bag, ['r1', 'R1', 'r']) ?? 4,
      r2: pickNumber(bag, ['r2', 'R2']) ?? 6,
      voltage: pickNumber(bag, ['v', 'V', 'voltage', 'emf', 'E']) ?? 12,
    };
  }

  if (explicit === 'pv' || (explicit !== 'incline' && looksPhysicsPv(text))) {
    const p1 = pickNumber(bag, ['p1', 'P1', 'p']) ?? 2;
    const v1 = pickNumber(bag, ['v1', 'V1', 'v']) ?? 4;
    const p2 = pickNumber(bag, ['p2', 'P2']) ?? Math.max(1, Math.round(p1 * 1.5 * 100) / 100);
    const v2 = pickNumber(bag, ['v2', 'V2']) ?? Math.round((p1 * v1 / p2) * 100) / 100;
    return { kind: 'pv', p1, v1, p2, v2: v2 > 0 ? v2 : v1 };
  }

  const thetaRaw = pickNumber(bag, ['theta', 'thetaDeg', 'angle', 'deg']);
  return {
    kind: 'incline',
    thetaDeg: clamp(thetaRaw ?? 30, 12, 55),
    massKg: pickNumber(bag, ['m', 'mass', 'massKg']) ?? 2,
    mu: pickNumber(bag, ['mu', 'mu_k', 'mu_s', 'friction']) ?? 0.3,
  };
}

function inferChemistryScene(problem: GeneratedProblem, bag: Record<string, unknown>): ChemistryScene {
  const text = contextText(problem);
  const explicit = (problem.visualConfig?.type ?? '').toLowerCase();

  if (explicit === 'battery' || (explicit !== 'energy' && explicit !== 'pv' && looksBattery(text))) {
    return {
      kind: 'battery',
      anode: pickString(bag, ['anode', 'negative', 'zn']) ?? 'Zn',
      cathode: pickString(bag, ['cathode', 'positive', 'cu']) ?? 'Cu',
    };
  }

  if (explicit === 'pv' || (explicit !== 'energy' && looksChemistryPv(text))) {
    const p1 = pickNumber(bag, ['p1', 'P1', 'p']) ?? 1;
    const v1 = pickNumber(bag, ['v1', 'V1']) ?? 6;
    const p2 = pickNumber(bag, ['p2', 'P2']) ?? 3;
    const v2 =
      pickNumber(bag, ['v2', 'V2']) ?? Math.round((p1 * v1 / Math.max(p2, 0.1)) * 100) / 100;
    return { kind: 'pv', p1, v1, p2, v2: v2 > 0 ? v2 : 2 };
  }

  const reactants = pickNumber(bag, ['reactants', 'H_r', 'Hr']) ?? 80;
  const products = pickNumber(bag, ['products', 'H_p', 'Hp']) ?? (looksEndothermic(text) ? 110 : 40);
  const mode: EnergyScene['mode'] =
    explicit === 'endothermic' || looksEndothermic(text) || products > reactants
      ? 'endothermic'
      : 'exothermic';
  const peakBase = Math.max(reactants, products);
  const activation = pickNumber(bag, ['Ea', 'activation', 'ea']) ?? peakBase + 35;

  return {
    kind: 'energy',
    mode,
    reactants,
    products: mode === 'exothermic' ? Math.min(products, reactants - 10) : Math.max(products, reactants + 10),
    activation,
  };
}

export function resolvePhysicsScene(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): PhysicsScene | null {
  if (problem.subject !== 'physics') return null;
  return inferPhysicsScene(problem, bagFromProblem(problem, vars));
}

export function resolveChemistryScene(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): ChemistryScene | null {
  if (problem.subject !== 'chemistry') return null;
  return inferChemistryScene(problem, bagFromProblem(problem, vars));
}

export function attachPhysicsVisual(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Pick<GeneratedProblem, 'visualType' | 'visualConfig'> {
  const scene = resolvePhysicsScene(problem, vars);
  if (!scene) {
    return {
      visualType: problem.visualType === 'physics_simulation' ? 'none' : problem.visualType,
      visualConfig:
        problem.visualType === 'physics_simulation' ? { type: 'none', params: {} } : problem.visualConfig,
    };
  }

  return {
    visualType: 'physics_simulation',
    visualConfig: {
      type: scene.kind,
      params: { ...scene },
    },
  };
}

export function attachChemistryVisual(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Pick<GeneratedProblem, 'visualType' | 'visualConfig'> {
  const scene = resolveChemistryScene(problem, vars);
  if (!scene) {
    return {
      visualType: problem.visualType === 'chemistry_animation' ? 'none' : problem.visualType,
      visualConfig:
        problem.visualType === 'chemistry_animation' ? { type: 'none', params: {} } : problem.visualConfig,
    };
  }

  return {
    visualType: 'chemistry_animation',
    visualConfig: {
      type: scene.kind,
      params: { ...scene },
    },
  };
}

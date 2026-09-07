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
  massKg: number | null;
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
  qualitative: boolean;
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

function looksIncline(text: string): boolean {
  return /斜面|傾斜角|垂直抗力|摩擦力/.test(text);
}

function looksCircuit(text: string): boolean {
  return /回路|オーム|直列|並列/.test(text) && /抵抗|Ω|電圧|電流/.test(text);
}

function looksPvProcess(text: string): boolean {
  return /ボイル|シャルル|P-V|PVグラフ|等温変化/.test(text);
}

function looksBattery(text: string): boolean {
  return /電池|電極|ダニエル|電気分解/.test(text);
}

function looksThermoChem(text: string): boolean {
  return /発熱|吸熱|反応熱|熱化学|エネルギー図|活性化エネルギー/.test(text);
}

function looksEndothermic(text: string): boolean {
  return /吸熱/.test(text) && !/発熱/.test(text);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function twoStatePv(bag: Record<string, unknown>): PhysicsPvScene | ChemistryPvScene | null {
  const p1 = pickNumber(bag, ['p1', 'P1']);
  const v1 = pickNumber(bag, ['v1', 'V1']);
  const p2 = pickNumber(bag, ['p2', 'P2']);
  const v2 = pickNumber(bag, ['v2', 'V2']);
  if (p1 === null || v1 === null || p2 === null || v2 === null) return null;
  if (p1 <= 0 || v1 <= 0 || p2 <= 0 || v2 <= 0) return null;
  return { kind: 'pv', p1, v1, p2, v2 };
}

function inferPhysicsScene(problem: GeneratedProblem, bag: Record<string, unknown>): PhysicsScene | null {
  const text = contextText(problem);
  const explicit = (problem.visualConfig?.type ?? '').toLowerCase();

  if (explicit === 'circuit' || looksCircuit(text)) {
    const r1 = pickNumber(bag, ['r1', 'R1', 'r']);
    const voltage = pickNumber(bag, ['v', 'V', 'voltage', 'emf', 'E']);
    if (r1 === null || voltage === null) return null;
    const r2 = pickNumber(bag, ['r2', 'R2']);
    return { kind: 'circuit', r1, r2: r2 ?? 0, voltage };
  }

  if (explicit === 'pv' || looksPvProcess(text)) {
    return twoStatePv(bag);
  }

  if (explicit === 'incline' || looksIncline(text)) {
    const thetaRaw = pickNumber(bag, ['theta', 'thetaDeg', 'angle', 'deg']);
    if (thetaRaw === null) return null;
    return {
      kind: 'incline',
      thetaDeg: clamp(thetaRaw, 8, 70),
      massKg: pickNumber(bag, ['m', 'mass', 'massKg']),
      mu: pickNumber(bag, ['mu', 'mu_k', 'mu_s', 'friction']),
    };
  }

  return null;
}

function inferChemistryScene(problem: GeneratedProblem, bag: Record<string, unknown>): ChemistryScene | null {
  const text = contextText(problem);
  const explicit = (problem.visualConfig?.type ?? '').toLowerCase();

  if (explicit === 'battery' || looksBattery(text)) {
    const daniel = /ダニエル|亜鉛|Zn|銅|Cu/.test(text);
    return {
      kind: 'battery',
      anode: pickString(bag, ['anode', 'negative', 'zn']) ?? (daniel ? 'Zn' : '負極'),
      cathode: pickString(bag, ['cathode', 'positive', 'cu']) ?? (daniel ? 'Cu' : '正極'),
    };
  }

  if (explicit === 'pv' || looksPvProcess(text)) {
    return twoStatePv(bag);
  }

  if (explicit === 'energy' || looksThermoChem(text)) {
    const reactants = pickNumber(bag, ['reactants', 'H_r', 'Hr']);
    const products = pickNumber(bag, ['products', 'H_p', 'Hp']);
    const qualitative = reactants === null || products === null;
    const mode: EnergyScene['mode'] =
      explicit === 'endothermic' ||
      looksEndothermic(text) ||
      (products !== null && reactants !== null && products > reactants)
        ? 'endothermic'
        : 'exothermic';
    const r = reactants ?? 80;
    const p = products ?? (mode === 'exothermic' ? 40 : 110);
    const peakBase = Math.max(r, p);
    const activation = pickNumber(bag, ['Ea', 'activation', 'ea']) ?? peakBase + 35;
    return {
      kind: 'energy',
      mode,
      reactants: r,
      products: p,
      activation,
      qualitative,
    };
  }

  return null;
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
    return { visualType: 'none', visualConfig: { type: 'none', params: {} } };
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
    return { visualType: 'none', visualConfig: { type: 'none', params: {} } };
  }

  return {
    visualType: 'chemistry_animation',
    visualConfig: {
      type: scene.kind,
      params: { ...scene },
    },
  };
}

// ==========================================
// Apex Suite: Math Lab - Math graph visual resolver
// ==========================================
// visualConfig / 問題変数から、SVG描画用の関数グラフ定義を組み立てる。
// API・画像生成は使わない（ゼロコスト）。

import type { GeneratedProblem } from '@/types/mathLab';

export type MathGraphKind = 'quadratic' | 'linear' | 'sine';

export interface MathGraphModel {
  kind: MathGraphKind;
  params: Record<string, number>;
  evaluate: (x: number) => number;
  markers: Array<{ x: number; y: number; label: string }>;
  formula: string;
}

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

function fmt(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function marker(x: number, y: number, name?: string): { x: number; y: number; label: string } {
  const coord = `(${fmt(x)}, ${fmt(y)})`;
  return { x, y, label: name ? `${name} ${coord}` : coord };
}

function contextText(problem: GeneratedProblem): string {
  return `${problem.unit} ${problem.title} ${problem.questionText}`;
}

function looksQuadraticGraph(text: string): boolean {
  if (/解の公式|因数分解/.test(text) && !/グラフ|図示|頂点|放物線/.test(text)) return false;
  if (/判別式/.test(text) && !/グラフ|図示|頂点|放物線|領域/.test(text)) return false;
  if (/2次方程式/.test(text) && !/グラフ|図示|頂点|放物線/.test(text)) return false;
  if (/グラフ|図示|概形|放物線|頂点|平方完成|領域/.test(text)) return true;
  return /2次関数|二次関数/.test(text) && /最大|最小|軸|定義域/.test(text);
}

function looksLinearGraph(text: string): boolean {
  return /グラフ|図示|概形/.test(text);
}

function looksSineGraph(text: string): boolean {
  if (/三角比/.test(text) && !/グラフ|図示|波形/.test(text)) return false;
  return /グラフ|図示|概形|波形/.test(text);
}

function quadraticFormula(a: number, b: number, c: number): string {
  const parts: string[] = [];
  const push = (coeff: number, symbol: string) => {
    if (Math.abs(coeff) < 1e-9) return;
    const abs = Math.abs(coeff);
    const mag = symbol && Math.abs(abs - 1) < 1e-9 ? '' : fmt(abs);
    const piece = `${mag}${symbol}`;
    if (parts.length === 0) {
      parts.push(coeff < 0 ? `-${piece}` : piece);
      return;
    }
    parts.push(coeff < 0 ? `- ${piece}` : `+ ${piece}`);
  };
  push(a, 'x²');
  push(b, 'x');
  push(c, '');
  return `y = ${parts.join(' ') || '0'}`;
}

function quadraticFromAbc(a: number, b: number, c: number): MathGraphModel | null {
  if (a === 0) return linearFromMb(b, c);
  const vx = -b / (2 * a);
  const vy = a * vx * vx + b * vx + c;
  return {
    kind: 'quadratic',
    params: { a, b, c },
    evaluate: (x) => a * x * x + b * x + c,
    markers: [marker(vx, vy, '頂点'), marker(0, c, 'y切片')],
    formula: quadraticFormula(a, b, c),
  };
}

function quadraticFromVertex(a: number, p: number, q: number): MathGraphModel | null {
  const b = -2 * a * p;
  const c = a * p * p + q;
  return quadraticFromAbc(a, b, c);
}

function linearFromMb(m: number, b: number): MathGraphModel {
  const markers = [marker(0, b, 'y切片')];
  if (m !== 0) markers.push(marker(-b / m, 0, 'x切片'));
  return {
    kind: 'linear',
    params: { m, b },
    evaluate: (x) => m * x + b,
    markers,
    formula: quadraticFormula(0, m, b),
  };
}

function sineFromParams(amplitude: number, frequency: number, phase = 0, shift = 0): MathGraphModel {
  const evaluate = (x: number) => amplitude * Math.sin(frequency * x + phase) + shift;
  const y0 = evaluate(0);
  const peakX = frequency === 0 ? 0 : (Math.PI / 2 - phase) / frequency;
  const freqLabel = Math.abs(frequency - 1) < 1e-9 ? '' : fmt(frequency);
  const phasePart = Math.abs(phase) < 1e-9 ? '' : phase < 0 ? ` - ${fmt(Math.abs(phase))}` : ` + ${fmt(phase)}`;
  const shiftPart = Math.abs(shift) < 1e-9 ? '' : shift < 0 ? ` - ${fmt(Math.abs(shift))}` : ` + ${fmt(shift)}`;
  return {
    kind: 'sine',
    params: { amplitude, frequency, phase, shift },
    evaluate,
    markers: [marker(0, y0, 'y切片'), marker(peakX, evaluate(peakX), '振幅')],
    formula: `y = ${fmt(amplitude)} sin(${freqLabel}x${phasePart})${shiftPart}`,
  };
}

function bagFromProblem(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Record<string, unknown> {
  if (vars && Object.keys(vars).length > 0) {
    return { ...vars };
  }
  return { ...(problem.visualConfig?.params ?? {}) };
}

function parseExplicitType(
  type: string,
  bag: Record<string, unknown>
): MathGraphModel | null {
  const normalized = type.toLowerCase();
  if (normalized === 'quadratic' || normalized === 'parabola' || normalized === 'quadratic_function') {
    const p = pickNumber(bag, ['p', 'h', 'vertexX']);
    const q = pickNumber(bag, ['q', 'k', 'vertexY']);
    const a = pickNumber(bag, ['a']);
    if (a !== null && p !== null && q !== null) return quadraticFromVertex(a, p, q);
    const b = pickNumber(bag, ['b']);
    const c = pickNumber(bag, ['c']);
    if (a !== null && b !== null && c !== null) return quadraticFromAbc(a, b, c);
  }
  if (normalized === 'linear' || normalized === 'line') {
    const m = pickNumber(bag, ['m', 'a', 'slope']);
    const b = pickNumber(bag, ['b', 'intercept']);
    if (m !== null && b !== null) return linearFromMb(m, b);
  }
  if (normalized === 'sine' || normalized === 'wave' || normalized === 'trig') {
    const amplitude = pickNumber(bag, ['amplitude', 'A', 'amp']);
    const frequency = pickNumber(bag, ['frequency', 'omega', 'freq']) ?? 1;
    const phase = pickNumber(bag, ['phase']) ?? 0;
    const shift = pickNumber(bag, ['shift', 'verticalShift']) ?? 0;
    if (amplitude !== null) return sineFromParams(amplitude, frequency, phase, shift);
  }
  return null;
}

function inferFromBag(problem: GeneratedProblem, bag: Record<string, unknown>): MathGraphModel | null {
  if (problem.subject !== 'math') return null;
  if (problem.visualType === 'geometry_svg') return null;

  const text = contextText(problem);
  const a = pickNumber(bag, ['a']);
  const b = pickNumber(bag, ['b']);
  const c = pickNumber(bag, ['c']);
  const p = pickNumber(bag, ['p', 'h']);
  const q = pickNumber(bag, ['q']);
  const t = pickNumber(bag, ['t']);
  const k = pickNumber(bag, ['k']);
  const m = pickNumber(bag, ['m', 'slope']);
  const explicitGraph = problem.visualType === 'math_graph';

  if ((explicitGraph || looksQuadraticGraph(text)) && a !== null && p !== null && q !== null) {
    return quadraticFromVertex(a, p, q);
  }
  if ((explicitGraph || looksQuadraticGraph(text)) && a !== null && b !== null && c !== null) {
    return quadraticFromAbc(a, b, c);
  }
  if ((explicitGraph || looksQuadraticGraph(text)) && t !== null && k !== null) {
    return quadraticFromVertex(1, t, k);
  }
  if (a !== null && /2ax/.test(text) && /-x/.test(text) && looksQuadraticGraph(text)) {
    return quadraticFromAbc(-1, 2 * a, 0);
  }
  if ((explicitGraph || looksLinearGraph(text)) && m !== null && b !== null) {
    return linearFromMb(m, b);
  }
  if (looksSineGraph(text) && a !== null && b !== null) {
    const amplitude = Math.sqrt(a * a + b * b);
    return sineFromParams(amplitude, 1, 0, 0);
  }
  const amplitude = pickNumber(bag, ['amplitude', 'A', 'amp']);
  if (amplitude !== null && (explicitGraph || looksSineGraph(text))) {
    return sineFromParams(amplitude, pickNumber(bag, ['frequency', 'omega', 'freq']) ?? 1);
  }
  return null;
}

export function resolveMathGraphModel(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): MathGraphModel | null {
  const bag = bagFromProblem(problem, vars);
  const explicitType = problem.visualConfig?.type ?? '';
  if (explicitType && explicitType !== 'none' && explicitType !== 'math_graph') {
    const parsed = parseExplicitType(explicitType, bag);
    if (parsed) return parsed;
  }
  return inferFromBag(problem, bag);
}

export function attachMathGraphVisual(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Pick<GeneratedProblem, 'visualType' | 'visualConfig'> {
  const scratch: GeneratedProblem = {
    ...problem,
    visualType: 'none',
    visualConfig: { type: 'none', params: {} },
  };
  const model = resolveMathGraphModel(scratch, vars);
  if (!model) {
    return { visualType: 'none', visualConfig: { type: 'none', params: {} } };
  }
  return {
    visualType: 'math_graph',
    visualConfig: {
      type: model.kind,
      params: model.params,
    },
  };
}

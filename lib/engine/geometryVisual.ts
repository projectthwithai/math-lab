// ==========================================
// Apex Suite: Math Lab - Geometry SVG visual resolver
// ==========================================
// 点座標・円・線分・角度ラベルからクライアントSVG用シーンを組み立てる。
// 画像生成APIは使わない（ゼロコスト）。

import type {
  GeneratedProblem,
  GeometryAngle,
  GeometryCircle,
  GeometryPoint,
  GeometryScene,
  GeometrySegment,
  GeometryVector,
} from '@/types/mathLab';

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

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parsePoint(raw: unknown): GeometryPoint | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  if (!id || x === null || y === null) return null;
  return { id, x, y, label: asString(raw.label) ?? id };
}

function parseSegment(raw: unknown): GeometrySegment | null {
  if (!isRecord(raw)) return null;
  const from = asString(raw.from);
  const to = asString(raw.to);
  if (!from || !to) return null;
  return {
    from,
    to,
    dashed: raw.dashed === true,
    label: asString(raw.label),
  };
}

function parseCircle(raw: unknown): GeometryCircle | null {
  if (!isRecord(raw)) return null;
  const cx = asNumber(raw.cx);
  const cy = asNumber(raw.cy);
  const r = asNumber(raw.r);
  if (cx === null || cy === null || r === null || r <= 0) return null;
  return {
    id: asString(raw.id),
    cx,
    cy,
    r,
    dashed: raw.dashed === true,
    label: asString(raw.label),
  };
}

function parseAngle(raw: unknown): GeometryAngle | null {
  if (!isRecord(raw)) return null;
  const vertex = asString(raw.vertex);
  const from = asString(raw.from);
  const to = asString(raw.to);
  const label = asString(raw.label);
  if (!vertex || !from || !to || !label) return null;
  return { vertex, from, to, label };
}

function parseVector(raw: unknown): GeometryVector | null {
  if (!isRecord(raw)) return null;
  const from = asString(raw.from);
  const to = asString(raw.to);
  if (!from || !to) return null;
  return { from, to, label: asString(raw.label) };
}

function parseList<T>(raw: unknown, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parse).filter((item): item is T => item !== null);
}

export function parseGeometryScene(raw: unknown): GeometryScene | null {
  if (!isRecord(raw)) return null;
  const nested = isRecord(raw.scene) ? raw.scene : raw;
  const points = parseList(nested.points, parsePoint);
  if (points.length < 2) return null;

  const scene: GeometryScene = {
    points,
    circles: parseList(nested.circles, parseCircle),
    segments: parseList(nested.segments, parseSegment),
    polygons: Array.isArray(nested.polygons)
      ? nested.polygons
          .map((item) => {
            if (!isRecord(item) || !Array.isArray(item.pointIds)) return null;
            const pointIds = item.pointIds.filter((id): id is string => typeof id === 'string');
            return pointIds.length >= 3 ? { pointIds } : null;
          })
          .filter((item): item is { pointIds: string[] } => item !== null)
      : [],
    angles: parseList(nested.angles, parseAngle),
    vectors: parseList(nested.vectors, parseVector),
    tangents: parseList(nested.tangents, parseSegment),
    caption: asString(nested.caption),
  };

  return scene;
}

function contextText(problem: GeneratedProblem): string {
  return `${problem.unit} ${problem.title} ${problem.questionText}`;
}

function looksTriangle(text: string): boolean {
  return /三角形|二等辺|直角三角形|正弦定理|余弦定理/.test(text);
}

function looksCircle(text: string): boolean {
  return /円|接線|半径|弦/.test(text);
}

function looksVector(text: string): boolean {
  return /ベクトル|内積|なす角|内分/.test(text);
}

function looksPointLine(text: string): boolean {
  return /点と直線|距離|直線/.test(text) && /図形と方程式|座標/.test(text);
}

function triangleFromSides(a: number, b: number, c: number, withBisector = false): GeometryScene | null {
  const sideA = Math.max(0.5, Math.abs(a));
  const sideB = Math.max(0.5, Math.abs(b));
  const sideC = Math.max(0.5, Math.abs(c));
  if (sideA + sideB <= sideC || sideB + sideC <= sideA || sideC + sideA <= sideB) return null;

  const bx = 0;
  const by = 0;
  const cx = sideA;
  const cy = 0;
  const ax = (sideC * sideC + sideA * sideA - sideB * sideB) / (2 * sideA);
  const ay2 = sideC * sideC - ax * ax;
  const ay = Math.sqrt(Math.max(0, ay2));

  const points: GeometryPoint[] = [
    { id: 'A', x: ax, y: ay, label: 'A' },
    { id: 'B', x: bx, y: by, label: 'B' },
    { id: 'C', x: cx, y: cy, label: 'C' },
  ];

  const segments: GeometrySegment[] = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
  ];

  const angles: GeometryAngle[] = [{ vertex: 'A', from: 'B', to: 'C', label: 'A' }];

  if (withBisector) {
    const bd = sideA * (sideC / (sideB + sideC));
    points.push({ id: 'D', x: bd, y: 0, label: 'D' });
    segments.push({ from: 'A', to: 'D', dashed: true, label: '二等分線' });
  }

  return {
    points,
    segments,
    polygons: [{ pointIds: ['A', 'B', 'C'] }],
    angles,
    caption: withBisector ? '三角形 ABC と ∠A の二等分線' : '三角形 ABC',
  };
}

function circleAndVerticalLine(radius: number, k: number): GeometryScene {
  const r = Math.max(1, Math.abs(radius));
  return {
    points: [
      { id: 'O', x: 0, y: 0, label: 'O' },
      { id: 'L1', x: k, y: -r - 1, label: '' },
      { id: 'L2', x: k, y: r + 1, label: '' },
    ],
    circles: [{ cx: 0, cy: 0, r, label: '円O' }],
    segments: [{ from: 'L1', to: 'L2', label: `x=${k}` }],
    caption: '円と直線の位置関係',
  };
}

function circleWithTangent(radius: number, px: number, py: number): GeometryScene {
  const r = Math.max(1, Math.abs(radius));
  const dist = Math.hypot(px, py) || r + 2;
  const scale = dist < r + 0.4 ? (r + 2) / dist : 1;
  const qx = px * scale;
  const qy = py * scale;
  const d = Math.hypot(qx, qy);
  const touchX = (r * r * qx) / (d * d);
  const touchY = (r * r * qy) / (d * d);

  return {
    points: [
      { id: 'O', x: 0, y: 0, label: 'O' },
      { id: 'T', x: touchX, y: touchY, label: 'T' },
      { id: 'P', x: qx, y: qy, label: 'P' },
    ],
    circles: [{ cx: 0, cy: 0, r, label: '円O' }],
    segments: [
      { from: 'O', to: 'T', dashed: true },
      { from: 'O', to: 'P', dashed: true },
    ],
    tangents: [{ from: 'P', to: 'T', label: '接線' }],
    angles: [{ vertex: 'T', from: 'O', to: 'P', label: '90°' }],
    caption: '円と接線',
  };
}

function vectorScene(x1: number, y1: number, x2: number, y2: number): GeometryScene {
  return {
    points: [
      { id: 'O', x: 0, y: 0, label: 'O' },
      { id: 'A', x: x1, y: y1, label: 'A' },
      { id: 'B', x: x2, y: y2, label: 'B' },
    ],
    segments: [],
    vectors: [
      { from: 'O', to: 'A', label: 'a' },
      { from: 'O', to: 'B', label: 'b' },
    ],
    caption: 'ベクトル a, b',
  };
}

function pointLineScene(a: number, b: number, c: number, x0: number, y0: number): GeometryScene {
  const aa = a === 0 && b === 0 ? 1 : a;
  const bb = b;
  const cc = c;
  const span = 6;
  let p1: GeometryPoint;
  let p2: GeometryPoint;
  if (Math.abs(bb) > 1e-9) {
    p1 = { id: 'L1', x: -span, y: -(aa * -span + cc) / bb, label: '' };
    p2 = { id: 'L2', x: span, y: -(aa * span + cc) / bb, label: '' };
  } else {
    const x = -cc / aa;
    p1 = { id: 'L1', x, y: -span, label: '' };
    p2 = { id: 'L2', x, y: span, label: '' };
  }

  const denom = aa * aa + bb * bb || 1;
  const hx = x0 - (aa * (aa * x0 + bb * y0 + cc)) / denom;
  const hy = y0 - (bb * (aa * x0 + bb * y0 + cc)) / denom;

  return {
    points: [
      p1,
      p2,
      { id: 'P', x: x0, y: y0, label: 'P' },
      { id: 'H', x: hx, y: hy, label: 'H' },
    ],
    segments: [
      { from: 'L1', to: 'L2' },
      { from: 'P', to: 'H', dashed: true, label: '垂線' },
    ],
    caption: '点と直線の距離',
  };
}

function inferFromBag(problem: GeneratedProblem, bag: Record<string, unknown>): GeometryScene | null {
  const text = contextText(problem);
  const a = pickNumber(bag, ['a']);
  const b = pickNumber(bag, ['b']);
  const c = pickNumber(bag, ['c']);
  const x1 = pickNumber(bag, ['x1']);
  const y1 = pickNumber(bag, ['y1']);
  const x2 = pickNumber(bag, ['x2']);
  const y2 = pickNumber(bag, ['y2']);
  const x0 = pickNumber(bag, ['x0']);
  const y0 = pickNumber(bag, ['y0']);
  const s = pickNumber(bag, ['s']);
  const t = pickNumber(bag, ['t']);
  const k = pickNumber(bag, ['k']);
  const r2 = pickNumber(bag, ['r2']);
  const r = pickNumber(bag, ['r', 'radius']) ?? (r2 !== null && r2 > 0 ? Math.sqrt(r2) : null);

  if (looksVector(text) && x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
    return vectorScene(x1 || 1, y1, x2 || 1, y2 || 1);
  }
  if (looksVector(text) && s !== null && t !== null) {
    return vectorScene(s, 0, 0, t);
  }
  if (looksPointLine(text) && a !== null && b !== null && c !== null && x0 !== null && y0 !== null) {
    return pointLineScene(a, b, c, x0, y0);
  }
  if (looksCircle(text) && r !== null && k !== null && /直線/.test(text)) {
    return circleAndVerticalLine(r, k);
  }
  if ((looksCircle(text) || /接線/.test(text)) && r !== null) {
    return circleWithTangent(r, pickNumber(bag, ['px', 'x0']) ?? r + 3, pickNumber(bag, ['py', 'y0']) ?? 2);
  }
  if (looksTriangle(text) && a !== null && b !== null && c !== null) {
    return triangleFromSides(a, b, c, /二等分/.test(text));
  }
  return null;
}

export function resolveGeometryScene(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): GeometryScene | null {
  const bag: Record<string, unknown> = {
    ...(problem.visualConfig?.params ?? {}),
    ...(vars ?? {}),
  };

  const explicitType = (problem.visualConfig?.type ?? '').toLowerCase();
  const isGeometryType =
    problem.visualType === 'geometry_svg' ||
    explicitType === 'geometry' ||
    explicitType === 'geometry_svg' ||
    explicitType === 'triangle' ||
    explicitType === 'circle' ||
    explicitType === 'tangent' ||
    explicitType === 'vector' ||
    explicitType === 'vector_diagram';

  const parsed =
    parseGeometryScene(problem.visualConfig?.params) ??
    parseGeometryScene(problem.visualConfig?.params?.scene);

  if (isGeometryType && parsed) {
    const rebuilt = inferFromBag(problem, bag);
    return rebuilt ?? parsed;
  }

  if (problem.subject !== 'math') return null;
  if (problem.visualType === 'math_graph') return null;

  return inferFromBag(problem, bag) ?? (isGeometryType ? parsed : null);
}

export function attachGeometryVisual(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): Pick<GeneratedProblem, 'visualType' | 'visualConfig'> {
  const scene = resolveGeometryScene(
    {
      ...problem,
      visualType: problem.visualType === 'math_graph' ? 'none' : problem.visualType,
    },
    vars
  );

  if (!scene) {
    return {
      visualType: problem.visualType === 'geometry_svg' ? 'none' : problem.visualType,
      visualConfig:
        problem.visualType === 'geometry_svg' ? { type: 'none', params: {} } : problem.visualConfig,
    };
  }

  return {
    visualType: 'geometry_svg',
    visualConfig: {
      type: 'geometry',
      params: { ...scene, scene },
    },
  };
}

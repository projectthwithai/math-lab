'use client';

// ==========================================
// Apex Suite: Math Lab - Math Graph Plotter
// ==========================================
// visualConfig から関数グラフを SVG で描画する（画像生成APIゼロ・クライアント完結）。
// 既定は X/Y 1:1 正方縮尺。ホイール・ドラッグ・ピンチでズーム／パン可能。

import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Crosshair, Minus, Plus } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import { resolveMathGraphModel, type MathGraphModel } from '@/lib/engine/mathGraphVisual';

interface MathGraphPlotterProps {
  visualConfig?: GeneratedProblem['visualConfig'];
  problem?: GeneratedProblem;
  className?: string;
  /** false の間は座標・頂点を隠す概形モード。解答後に true で全公開 */
  isSolved?: boolean;
}

interface GraphDomain {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

interface PanOffset {
  x: number;
  y: number;
}

const SVG_W = 720;
const SVG_H = 440;
const PAD = { top: 28, right: 24, bottom: 40, left: 52 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 14;
const ZOOM_FACTOR = 1.18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function niceTicks(min: number, max: number, maxTicks = 8): number[] {
  const span = Math.max(1e-6, max - min);
  const raw = span / maxTicks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / mag;
  const step = residual >= 5 ? 5 * mag : residual >= 2 ? 2 * mag : mag;
  const start = Math.ceil((min - 1e-9) / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + 1e-9; value += step) {
    ticks.push(Math.round(value * 1e6) / 1e6);
  }
  return ticks;
}

function formatTick(value: number): string {
  if (Math.abs(value) < 1e-9) return '0';
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function domainFor(model: MathGraphModel): GraphDomain {
  let xmin = model.kind === 'sine' ? -Math.PI * 2 : -6;
  let xmax = model.kind === 'sine' ? Math.PI * 2 : 6;
  for (const marker of model.markers) {
    xmin = Math.min(xmin, marker.x - 1.5);
    xmax = Math.max(xmax, marker.x + 1.5);
  }
  if (xmax - xmin < 8) {
    const mid = (xmin + xmax) / 2;
    xmin = mid - 4;
    xmax = mid + 4;
  }

  let ymin = Number.POSITIVE_INFINITY;
  let ymax = Number.NEGATIVE_INFINITY;
  const samples = 80;
  for (let i = 0; i <= samples; i += 1) {
    const x = xmin + ((xmax - xmin) * i) / samples;
    const y = model.evaluate(x);
    if (!Number.isFinite(y)) continue;
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
  }
  for (const marker of model.markers) {
    ymin = Math.min(ymin, marker.y);
    ymax = Math.max(ymax, marker.y);
  }
  if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymin === ymax) {
    ymin = -6;
    ymax = 6;
  }
  const padY = Math.max(1.2, (ymax - ymin) * 0.18);
  ymin -= padY;
  ymax += padY;
  return { xmin, xmax, ymin, ymax };
}

/** X/Y 1単位のピクセル長を一致させるよう、足りない軸方向へ余白を足して領域を正方縮尺にする。 */
function equalizeAspect(domain: GraphDomain, plotW: number, plotH: number): GraphDomain {
  const spanX = Math.max(1e-6, domain.xmax - domain.xmin);
  const spanY = Math.max(1e-6, domain.ymax - domain.ymin);
  const unit = Math.max(spanX / plotW, spanY / plotH);
  const nextSpanX = unit * plotW;
  const nextSpanY = unit * plotH;
  const cx = (domain.xmin + domain.xmax) / 2;
  const cy = (domain.ymin + domain.ymax) / 2;
  return {
    xmin: cx - nextSpanX / 2,
    xmax: cx + nextSpanX / 2,
    ymin: cy - nextSpanY / 2,
    ymax: cy + nextSpanY / 2,
  };
}

function computeView(base: GraphDomain, zoomLevel: number, panOffset: PanOffset): GraphDomain {
  const zoom = clamp(zoomLevel, ZOOM_MIN, ZOOM_MAX);
  const spanX = (base.xmax - base.xmin) / zoom;
  const spanY = (base.ymax - base.ymin) / zoom;
  const cx = (base.xmin + base.xmax) / 2 + panOffset.x;
  const cy = (base.ymin + base.ymax) / 2 + panOffset.y;
  return {
    xmin: cx - spanX / 2,
    xmax: cx + spanX / 2,
    ymin: cy - spanY / 2,
    ymax: cy + spanY / 2,
  };
}

function buildPath(
  model: MathGraphModel,
  mapX: (x: number) => number,
  mapY: (y: number) => number,
  xmin: number,
  xmax: number
): string {
  const steps = 420;
  const parts: string[] = [];
  let started = false;
  for (let i = 0; i <= steps; i += 1) {
    const x = xmin + ((xmax - xmin) * i) / steps;
    const y = model.evaluate(x);
    if (!Number.isFinite(y)) {
      started = false;
      continue;
    }
    const sx = mapX(x);
    const sy = mapY(y);
    parts.push(`${started ? 'L' : 'M'} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
    started = true;
  }
  return parts.join(' ');
}

function curveClass(kind: MathGraphModel['kind']): string {
  if (kind === 'sine') return 'stroke-violet-500 dark:stroke-violet-400';
  return 'stroke-cyan-500 dark:stroke-cyan-400';
}

function clientToSvg(clientX: number, clientY: number, rect: DOMRect): { x: number; y: number } {
  const scale = Math.min(rect.width / SVG_W, rect.height / SVG_H) || 1;
  const offsetX = rect.left + (rect.width - SVG_W * scale) / 2;
  const offsetY = rect.top + (rect.height - SVG_H * scale) / 2;
  return {
    x: (clientX - offsetX) / scale,
    y: (clientY - offsetY) / scale,
  };
}

function svgToMath(svgX: number, svgY: number, view: GraphDomain): { x: number; y: number } {
  const spanX = view.xmax - view.xmin;
  const spanY = view.ymax - view.ymin;
  return {
    x: view.xmin + ((svgX - PAD.left) / PLOT_W) * spanX,
    y: view.ymax - ((svgY - PAD.top) / PLOT_H) * spanY,
  };
}

function zoomAroundPoint(
  base: GraphDomain,
  currentZoom: number,
  currentPan: PanOffset,
  nextZoom: number,
  anchor: { x: number; y: number }
): { zoom: number; pan: PanOffset } {
  const zoom = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
  const current = computeView(base, currentZoom, currentPan);
  const spanX = current.xmax - current.xmin;
  const spanY = current.ymax - current.ymin;
  const fx = spanX <= 0 ? 0.5 : (anchor.x - current.xmin) / spanX;
  const fy = spanY <= 0 ? 0.5 : (anchor.y - current.ymin) / spanY;
  const next = computeView(base, zoom, { x: 0, y: 0 });
  const nextSpanX = next.xmax - next.xmin;
  const nextSpanY = next.ymax - next.ymin;
  const nextCx = anchor.x - (fx - 0.5) * nextSpanX;
  const nextCy = anchor.y - (fy - 0.5) * nextSpanY;
  const baseCx = (base.xmin + base.xmax) / 2;
  const baseCy = (base.ymin + base.ymax) / 2;
  return {
    zoom,
    pan: { x: nextCx - baseCx, y: nextCy - baseCy },
  };
}

function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function toolbarButtonClass(active = false): string {
  return `flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tracking-tight transition-colors ${
    active
      ? 'bg-cyan-400/15 text-cyan-600 ring-1 ring-inset ring-cyan-400/50 dark:text-cyan-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`;
}

export default function MathGraphPlotter({ visualConfig, problem, className, isSolved = false }: MathGraphPlotterProps) {
  const reactId = useId().replace(/:/g, '');
  const glowId = `graph-glow-${reactId}`;
  const clipId = `graph-clip-${reactId}`;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panLastRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ distance: number; mid: { x: number; y: number } } | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<PanOffset>({ x: 0, y: 0 });
  const viewRef = useRef<GraphDomain | null>(null);
  const baseRef = useRef<GraphDomain | null>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [isEqualAspect, setIsEqualAspect] = useState(true);
  const [isPanning, setIsPanning] = useState(false);

  zoomRef.current = zoomLevel;
  panRef.current = panOffset;

  const model = useMemo(() => {
    if (problem) return resolveMathGraphModel(problem);
    if (!visualConfig) return null;
    return resolveMathGraphModel({
      id: 'preview',
      subject: 'math',
      unit: '',
      title: '',
      difficulty: 1,
      format: 'input',
      questionText: '',
      visualType: 'math_graph',
      visualConfig,
      correctAnswer: '',
      hints: ['', '', ''],
      explanation: { stepByStep: [], keyFormula: '', commonMistakes: '' },
    });
  }, [problem, visualConfig]);

  const modelKey = model ? `${model.kind}:${model.formula}` : '';

  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [modelKey]);

  const baseDomain = useMemo(() => {
    if (!model) return null;
    const raw = domainFor(model);
    return isEqualAspect ? equalizeAspect(raw, PLOT_W, PLOT_H) : raw;
  }, [model, isEqualAspect]);

  const view = useMemo(() => {
    if (!baseDomain) return null;
    return computeView(baseDomain, zoomLevel, panOffset);
  }, [baseDomain, zoomLevel, panOffset]);

  baseRef.current = baseDomain;
  viewRef.current = view;

  const geometry = useMemo(() => {
    if (!model || !view) return null;
    const mapX = (x: number) => PAD.left + ((x - view.xmin) / (view.xmax - view.xmin)) * PLOT_W;
    const mapY = (y: number) => PAD.top + ((view.ymax - y) / (view.ymax - view.ymin)) * PLOT_H;
    return {
      mapX,
      mapY,
      xTicks: niceTicks(view.xmin, view.xmax),
      yTicks: niceTicks(view.ymin, view.ymax),
      path: buildPath(model, mapX, mapY, view.xmin, view.xmax),
      axisX: mapY(0),
      axisY: mapX(0),
    };
  }, [model, view]);

  const applyView = useCallback((nextZoom: number, nextPan: PanOffset) => {
    const zoom = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
    setZoomLevel(zoom);
    setPanOffset(nextPan);
    zoomRef.current = zoom;
    panRef.current = nextPan;
  }, []);

  const zoomAtClient = useCallback(
    (clientX: number, clientY: number, nextZoom: number) => {
      const base = baseRef.current;
      const svg = svgRef.current;
      if (!base || !svg) return;
      const svgPt = clientToSvg(clientX, clientY, svg.getBoundingClientRect());
      const currentView = computeView(base, zoomRef.current, panRef.current);
      const anchor = svgToMath(svgPt.x, svgPt.y, currentView);
      const next = zoomAroundPoint(base, zoomRef.current, panRef.current, nextZoom, anchor);
      applyView(next.zoom, next.pan);
    },
    [applyView]
  );

  const zoomByButton = useCallback(
    (direction: 1 | -1) => {
      const base = baseRef.current;
      const currentView = viewRef.current;
      if (!base || !currentView) return;
      const anchor = {
        x: (currentView.xmin + currentView.xmax) / 2,
        y: (currentView.ymin + currentView.ymax) / 2,
      };
      const nextZoom = zoomRef.current * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
      const next = zoomAroundPoint(base, zoomRef.current, panRef.current, nextZoom, anchor);
      applyView(next.zoom, next.pan);
    },
    [applyView]
  );

  const panByClientDelta = useCallback((dx: number, dy: number) => {
    const base = baseRef.current;
    const svg = svgRef.current;
    const currentView = viewRef.current;
    if (!base || !svg || !currentView) return;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / SVG_W, rect.height / SVG_H) || 1;
    const svgDx = dx / scale;
    const svgDy = dy / scale;
    const spanX = currentView.xmax - currentView.xmin;
    const spanY = currentView.ymax - currentView.ymin;
    applyView(zoomRef.current, {
      x: panRef.current.x - (svgDx * spanX) / PLOT_W,
      y: panRef.current.y + (svgDy * spanY) / PLOT_H,
    });
  }, [applyView]);

  const resetView = useCallback(() => {
    applyView(1, { x: 0, y: 0 });
    setIsEqualAspect(true);
  }, [applyView]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      zoomAtClient(event.clientX, event.clientY, zoomRef.current * factor);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAtClient]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: pointerDistance(pts[0], pts[1]),
        mid: pointerMidpoint(pts[0], pts[1]),
      };
      panLastRef.current = null;
      setIsPanning(true);
      return;
    }
    pinchRef.current = null;
    panLastRef.current = { x: event.clientX, y: event.clientY };
    setIsPanning(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      const distance = pointerDistance(pts[0], pts[1]);
      const mid = pointerMidpoint(pts[0], pts[1]);
      const prev = pinchRef.current;
      if (prev) {
        panByClientDelta(mid.x - prev.mid.x, mid.y - prev.mid.y);
        if (prev.distance > 4 && distance > 4) {
          zoomAtClient(mid.x, mid.y, zoomRef.current * (distance / prev.distance));
        }
      }
      pinchRef.current = { distance, mid };
      panLastRef.current = null;
      return;
    }

    const last = panLastRef.current;
    if (!last) return;
    panByClientDelta(event.clientX - last.x, event.clientY - last.y);
    panLastRef.current = { x: event.clientX, y: event.clientY };
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size === 0) {
      panLastRef.current = null;
      pinchRef.current = null;
      setIsPanning(false);
      return;
    }
    if (pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.values()][0];
      pinchRef.current = null;
      panLastRef.current = remaining;
    }
  };

  if (!model || !geometry || !view) return null;

  const originOnX = geometry.axisY >= PAD.left && geometry.axisY <= SVG_W - PAD.right;
  const originOnY = geometry.axisX >= PAD.top && geometry.axisX <= SVG_H - PAD.bottom;
  const zoomInDisabled = zoomLevel >= ZOOM_MAX - 1e-6;
  const zoomOutDisabled = zoomLevel <= ZOOM_MIN + 1e-6;

  return (
    <figure
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/60 ${className ?? ''}`}
    >
      <div
        ref={stageRef}
        className={`relative touch-none overscroll-contain ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute right-2 top-2 z-10 flex cursor-default items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white/90 p-0.5 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/90"
          onPointerDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={toolbarButtonClass()}
            aria-label="ズームイン"
            title="ズームイン"
            disabled={zoomInDisabled}
            onClick={() => zoomByButton(1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass()}
            aria-label="ズームアウト"
            title="ズームアウト"
            disabled={zoomOutDisabled}
            onClick={() => zoomByButton(-1)}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass(isEqualAspect)}
            aria-label={isEqualAspect ? '1:1 縮尺を解除してフィット表示' : '1:1 縮尺に固定'}
            aria-pressed={isEqualAspect}
            title={isEqualAspect ? 'フィット表示に切替' : '1:1 縮尺に固定'}
            onClick={() => setIsEqualAspect((current) => !current)}
          >
            1:1
          </button>
          <button
            type="button"
            className={toolbarButtonClass()}
            aria-label="原点と倍率をリセット"
            title="原点・倍率をリセット"
            onClick={resetView}
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`関数グラフ ${model.formula}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
            </clipPath>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={SVG_W} height={SVG_H} className="fill-slate-50 dark:fill-slate-950" />

          <g clipPath={`url(#${clipId})`}>
            {geometry.xTicks.map((tick) => {
              const x = geometry.mapX(tick);
              return (
                <line
                  key={`xg-${tick}`}
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={SVG_H - PAD.bottom}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="1"
                />
              );
            })}
            {geometry.yTicks.map((tick) => {
              const y = geometry.mapY(tick);
              return (
                <line
                  key={`yg-${tick}`}
                  x1={PAD.left}
                  y1={y}
                  x2={SVG_W - PAD.right}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="1"
                />
              );
            })}

            {originOnY && (
              <line
                x1={PAD.left}
                y1={geometry.axisX}
                x2={SVG_W - PAD.right}
                y2={geometry.axisX}
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth="1.5"
              />
            )}
            {originOnX && (
              <line
                x1={geometry.axisY}
                y1={PAD.top}
                x2={geometry.axisY}
                y2={SVG_H - PAD.bottom}
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth="1.5"
              />
            )}

            <path
              d={geometry.path}
              fill="none"
              className={curveClass(model.kind)}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#${glowId})`}
            />
          </g>

          {isSolved && (
            <g className="graph-neon-reveal">
              {geometry.xTicks.map((tick) => {
                const x = geometry.mapX(tick);
                if (x < PAD.left - 2 || x > SVG_W - PAD.right + 2) return null;
                return (
                  <text
                    key={`xl-${tick}`}
                    x={x}
                    y={SVG_H - 16}
                    textAnchor="middle"
                    className="fill-cyan-600 text-[11px] dark:fill-cyan-300"
                  >
                    {formatTick(tick)}
                  </text>
                );
              })}

              {geometry.yTicks.map((tick) => {
                const y = geometry.mapY(tick);
                if (y < PAD.top - 2 || y > SVG_H - PAD.bottom + 2) return null;
                return (
                  <text
                    key={`yl-${tick}`}
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-cyan-600 text-[11px] dark:fill-cyan-300"
                  >
                    {formatTick(tick)}
                  </text>
                );
              })}

              {model.markers.map((item) => {
                const cx = geometry.mapX(item.x);
                const cy = geometry.mapY(item.y);
                if (cx < PAD.left - 8 || cx > SVG_W - PAD.right + 8 || cy < PAD.top - 8 || cy > SVG_H - PAD.bottom + 8) {
                  return null;
                }
                const labelWidth = Math.min(156, 14 + item.label.length * 6.4);
                const placeLeft = cx + 12 + labelWidth > SVG_W - 8;
                const flip = cy < 56;
                const labelX = placeLeft ? cx - 12 - labelWidth : cx + 8;
                const textX = labelX + 6;
                return (
                  <g key={`${item.label}-${item.x}-${item.y}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      className={
                        model.kind === 'sine'
                          ? 'fill-white stroke-violet-400 dark:fill-slate-950'
                          : 'fill-white stroke-cyan-400 dark:fill-slate-950'
                      }
                      strokeWidth="2"
                    />
                    <rect
                      x={labelX}
                      y={flip ? cy + 6 : cy - 22}
                      width={labelWidth}
                      height="18"
                      rx="4"
                      className="fill-white/90 stroke-cyan-300/60 dark:fill-slate-900/90 dark:stroke-cyan-400/50"
                    />
                    <text
                      x={textX}
                      y={flip ? cy + 19 : cy - 9}
                      className="fill-slate-700 text-[11px] font-medium dark:fill-slate-200"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {originOnY && (
            <polygon
              points={`${SVG_W - PAD.right},${geometry.axisX} ${SVG_W - PAD.right - 8},${geometry.axisX - 4} ${SVG_W - PAD.right - 8},${geometry.axisX + 4}`}
              className="fill-slate-500 dark:fill-slate-400"
            />
          )}
          {originOnX && (
            <polygon
              points={`${geometry.axisY},${PAD.top} ${geometry.axisY - 4},${PAD.top + 8} ${geometry.axisY + 4},${PAD.top + 8}`}
              className="fill-slate-500 dark:fill-slate-400"
            />
          )}
          <text x={SVG_W - PAD.right - 2} y={(originOnY ? geometry.axisX : SVG_H / 2) + 16} className="fill-slate-500 text-[11px] dark:fill-slate-400">
            x
          </text>
          <text x={(originOnX ? geometry.axisY : PAD.left) + 8} y={PAD.top + 12} className="fill-slate-500 text-[11px] dark:fill-slate-400">
            y
          </text>
        </svg>
      </div>
      <figcaption className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>{isSolved ? model.formula : '概形モード（解答後に座標・頂点を公開）'}</span>
        <span className="shrink-0 text-[10px] tracking-tight">
          {isEqualAspect ? '1:1' : 'Fit'} · ×{zoomLevel.toFixed(2)}
        </span>
      </figcaption>
    </figure>
  );
}

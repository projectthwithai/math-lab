'use client';

// ==========================================
// Apex Suite: Math Lab - Geometry SVG Plotter
// ==========================================
// AI / モックから渡された点座標・円・線分・角度ラベルを
// クライアントSVGだけで高精細に描画する（画像生成APIゼロ）。

import { useId, useMemo } from 'react';

import type { GeneratedProblem, GeometryPoint, GeometryScene } from '@/types/mathLab';
import { resolveGeometryScene } from '@/lib/engine/geometryVisual';

interface GeometrySvgPlotterProps {
  problem?: GeneratedProblem;
  scene?: GeometryScene | null;
  className?: string;
}

const SVG_W = 720;
const SVG_H = 460;
const PAD = 48;

function pointMap(scene: GeometryScene): Map<string, GeometryPoint> {
  return new Map(scene.points.map((point) => [point.id, point]));
}

function boundsOf(scene: GeometryScene): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const point of scene.points) {
    xs.push(point.x);
    ys.push(point.y);
  }
  for (const circle of scene.circles ?? []) {
    xs.push(circle.cx - circle.r, circle.cx + circle.r);
    ys.push(circle.cy - circle.r, circle.cy + circle.r);
  }
  if (xs.length === 0) return { minX: -4, maxX: 4, minY: -4, maxY: 4 };
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (maxX - minX < 2) {
    const mid = (minX + maxX) / 2;
    minX = mid - 1;
    maxX = mid + 1;
  }
  if (maxY - minY < 2) {
    const mid = (minY + maxY) / 2;
    minY = mid - 1;
    maxY = mid + 1;
  }
  const padX = (maxX - minX) * 0.18;
  const padY = (maxY - minY) * 0.18;
  return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
}

function angleOf(from: GeometryPoint, to: GeometryPoint): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number
): string {
  let delta = end - start;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  const endAngle = start + delta;
  const x1 = cx + radius * Math.cos(start);
  const y1 = cy - radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy - radius * Math.sin(endAngle);
  const large = Math.abs(delta) > Math.PI ? 1 : 0;
  const sweep = delta < 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function GeometrySvgPlotter({ problem, scene, className }: GeometrySvgPlotterProps) {
  const reactId = useId().replace(/:/g, '');
  const resolved = useMemo(() => {
    if (scene) return scene;
    if (problem) return resolveGeometryScene(problem);
    return null;
  }, [problem, scene]);

  const layout = useMemo(() => {
    if (!resolved) return null;
    const box = boundsOf(resolved);
    const spanX = box.maxX - box.minX;
    const spanY = box.maxY - box.minY;
    const plotW = SVG_W - PAD * 2;
    const plotH = SVG_H - PAD * 2;
    const unit = Math.min(plotW / spanX, plotH / spanY);
    const ox = PAD + (plotW - spanX * unit) / 2;
    const oy = PAD + (plotH - spanY * unit) / 2;
    const mapX = (x: number) => ox + (x - box.minX) * unit;
    const mapY = (y: number) => SVG_H - oy - (y - box.minY) * unit;
    return { mapX, mapY, unit, box };
  }, [resolved]);

  if (!resolved || !layout) return null;

  const { mapX, mapY, unit } = layout;
  const lookup = pointMap(resolved);
  const markerId = `geo-arrow-${reactId}`;
  const glowId = `geo-glow-${reactId}`;

  return (
    <figure
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/60 ${className ?? ''}`}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={resolved.caption ?? '図形'}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto"
          >
            <path d="M 0 0 L 12 6 L 0 12 z" className="fill-cyan-400" />
          </marker>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={SVG_W} height={SVG_H} className="fill-slate-50 dark:fill-slate-950" />

        {(resolved.polygons ?? []).map((polygon, index) => {
          const d = polygon.pointIds
            .map((id, i) => {
              const point = lookup.get(id);
              if (!point) return '';
              return `${i === 0 ? 'M' : 'L'} ${mapX(point.x).toFixed(2)} ${mapY(point.y).toFixed(2)}`;
            })
            .join(' ');
          return (
            <path
              key={`poly-${index}`}
              d={`${d} Z`}
              className="fill-cyan-400/10 stroke-cyan-400/70 dark:fill-cyan-400/15"
              strokeWidth="2.2"
            />
          );
        })}

        {(resolved.circles ?? []).map((circle, index) => (
          <g key={`circle-${index}`}>
            <circle
              cx={mapX(circle.cx)}
              cy={mapY(circle.cy)}
              r={circle.r * unit}
              fill="none"
              className="stroke-emerald-400"
              strokeWidth="2.4"
              strokeDasharray={circle.dashed ? '8 6' : undefined}
              filter={`url(#${glowId})`}
            />
            {circle.label && (
              <text
                x={mapX(circle.cx) + 8}
                y={mapY(circle.cy + circle.r) - 6}
                className="fill-emerald-300 text-[12px]"
              >
                {circle.label}
              </text>
            )}
          </g>
        ))}

        {(resolved.segments ?? []).map((segment, index) => {
          const from = lookup.get(segment.from);
          const to = lookup.get(segment.to);
          if (!from || !to) return null;
          return (
            <g key={`seg-${index}`}>
              <line
                x1={mapX(from.x)}
                y1={mapY(from.y)}
                x2={mapX(to.x)}
                y2={mapY(to.y)}
                className="stroke-slate-500 dark:stroke-slate-300"
                strokeWidth="2"
                strokeDasharray={segment.dashed ? '7 6' : undefined}
              />
              {segment.label && (
                <text
                  x={(mapX(from.x) + mapX(to.x)) / 2 + 6}
                  y={(mapY(from.y) + mapY(to.y)) / 2 - 6}
                  className="fill-slate-400 text-[11px]"
                >
                  {segment.label}
                </text>
              )}
            </g>
          );
        })}

        {(resolved.tangents ?? []).map((tangent, index) => {
          const from = lookup.get(tangent.from);
          const to = lookup.get(tangent.to);
          if (!from || !to) return null;
          return (
            <line
              key={`tan-${index}`}
              x1={mapX(from.x)}
              y1={mapY(from.y)}
              x2={mapX(to.x)}
              y2={mapY(to.y)}
              className="stroke-amber-400"
              strokeWidth="2.4"
              filter={`url(#${glowId})`}
            />
          );
        })}

        {(resolved.vectors ?? []).map((vector, index) => {
          const from = lookup.get(vector.from);
          const to = lookup.get(vector.to);
          if (!from || !to) return null;
          return (
            <g key={`vec-${index}`}>
              <line
                x1={mapX(from.x)}
                y1={mapY(from.y)}
                x2={mapX(to.x)}
                y2={mapY(to.y)}
                className="stroke-violet-400"
                strokeWidth="2.6"
                markerEnd={`url(#${markerId})`}
                filter={`url(#${glowId})`}
              />
              {vector.label && (
                <text
                  x={(mapX(from.x) + mapX(to.x)) / 2 + 10}
                  y={(mapY(from.y) + mapY(to.y)) / 2 - 8}
                  className="fill-violet-300 text-[12px] font-semibold"
                >
                  {vector.label}
                </text>
              )}
            </g>
          );
        })}

        {(resolved.angles ?? []).map((angle, index) => {
          const vertex = lookup.get(angle.vertex);
          const from = lookup.get(angle.from);
          const to = lookup.get(angle.to);
          if (!vertex || !from || !to) return null;
          const start = angleOf(vertex, from);
          const end = angleOf(vertex, to);
          const radius = Math.min(28, unit * 0.55);
          let delta = end - start;
          while (delta <= -Math.PI) delta += Math.PI * 2;
          while (delta > Math.PI) delta -= Math.PI * 2;
          const labelAngle = start + delta / 2;
          const lx = mapX(vertex.x) + (radius + 14) * Math.cos(labelAngle);
          const ly = mapY(vertex.y) - (radius + 14) * Math.sin(labelAngle);
          return (
            <g key={`ang-${index}`}>
              <path
                d={describeArc(mapX(vertex.x), mapY(vertex.y), radius, start, end)}
                fill="none"
                className="stroke-fuchsia-400"
                strokeWidth="2"
              />
              <text x={lx} y={ly} className="fill-fuchsia-300 text-[11px] font-semibold">
                {angle.label}
              </text>
            </g>
          );
        })}

        {resolved.points
          .filter((point) => point.label)
          .map((point) => (
            <g key={point.id}>
              <circle
                cx={mapX(point.x)}
                cy={mapY(point.y)}
                r="5.5"
                className="fill-white stroke-cyan-400 dark:fill-slate-950"
                strokeWidth="2"
              />
              <text
                x={mapX(point.x) + 10}
                y={mapY(point.y) - 10}
                className="fill-slate-800 text-[13px] font-semibold dark:fill-slate-100"
              >
                {point.label}
              </text>
            </g>
          ))}
      </svg>
      <figcaption className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {resolved.caption ?? '図形（SVG・0円描画）'}
      </figcaption>
    </figure>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - Weakness Radar Chart
// ==========================================
// 外部チャートライブラリを使わず、自作SVGで描画するレーダーチャート
// （.cursorrules の Zero-Cost Visuals 方針に準拠）。
// 各教科カテゴリの攻略達成率 = (制覇数 / 実パターン総数) * 100 をそのまま描画する。

import type { WeaknessRadarAxis } from '@/data/patternsData';

interface WeaknessRadarChartProps {
  axes: WeaknessRadarAxis[];
  size?: number;
}

const GRID_RINGS = [25, 50, 75, 100];

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(
  centerX: number,
  centerY: number,
  radius: number,
  axisCount: number,
  valueRatioAt: (index: number) => number
): string {
  return Array.from({ length: axisCount }, (_, i) => {
    const angleDeg = (360 / axisCount) * i;
    const { x, y } = polarToCartesian(centerX, centerY, radius * valueRatioAt(i), angleDeg);
    return `${x},${y}`;
  }).join(' ');
}

export default function WeaknessRadarChart({ axes, size = 260 }: WeaknessRadarChartProps) {
  const center = size / 2;
  const radius = size * 0.34;
  const axisCount = axes.length;

  if (axisCount < 3) {
    return (
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        レーダーチャートを表示するには3つ以上のカテゴリが必要です。
      </p>
    );
  }

  const valuePolygon = buildPolygonPoints(center, center, radius, axisCount, (i) =>
    Math.max(0, Math.min(100, axes[i].value)) / 100
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="弱点分析レーダーチャート">
        {GRID_RINGS.map((ring) => (
          <polygon
            key={ring}
            points={buildPolygonPoints(center, center, radius, axisCount, () => ring / 100)}
            fill="none"
            stroke="rgba(63, 63, 70, 0.7)"
            strokeWidth={1}
          />
        ))}

        {axes.map((axis, i) => {
          const angleDeg = (360 / axisCount) * i;
          const { x, y } = polarToCartesian(center, center, radius, angleDeg);
          return (
            <line
              key={axis.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(63, 63, 70, 0.7)"
              strokeWidth={1}
            />
          );
        })}

        <polygon
          points={valuePolygon}
          fill="rgba(34, 211, 238, 0.22)"
          stroke="rgb(34 211 238)"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.55))' }}
        />

        {axes.map((axis, i) => {
          const angleDeg = (360 / axisCount) * i;
          const { x, y } = polarToCartesian(
            center,
            center,
            radius * (Math.max(0, Math.min(100, axis.value)) / 100),
            angleDeg
          );
          return (
            <circle
              key={axis.label}
              cx={x}
              cy={y}
              r={3}
              fill="rgb(34 211 238)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.9))' }}
            />
          );
        })}

        {axes.map((axis, i) => {
          const angleDeg = (360 / axisCount) * i;
          const { x, y } = polarToCartesian(center, center, radius + 22, angleDeg);
          return (
            <text
              key={axis.label}
              x={x}
              y={y}
              fontSize={11}
              fill="rgb(212 212 216)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {axes.map((axis) => (
          <div
            key={axis.label}
            className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1.5 text-center dark:border-zinc-800/60 dark:bg-[#0a0a0a]/80"
          >
            <p className="truncate text-[10px] text-slate-500 dark:text-zinc-400">{axis.label}</p>
            <p className="text-sm font-bold text-cyan-600 dark:text-cyan-300">{axis.value}%</p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              {axis.clearedCount}/{axis.totalCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

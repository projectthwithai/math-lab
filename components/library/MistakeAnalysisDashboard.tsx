'use client';

// ==========================================
// Apex Suite: Math Lab - Mistake Analysis Dashboard
// ==========================================
// マイライブラリ最上部。失点原因 TOP3 と週次ミス率の推移をゼロAPIコストで描画する。

import { TrendingDown, TrendingUp, Minus, PieChart } from 'lucide-react';

import type { SolvedProblemRecord } from '@/types/mathLab';
import {
  buildWeeklyMistakeTrend,
  rankMistakeCauses,
  weeklyMistakeDelta,
} from '@/lib/engine/mistakeAnalytics';

interface MistakeAnalysisDashboardProps {
  records: SolvedProblemRecord[];
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function DonutChart({
  items,
}: {
  items: Array<{ share: number; fill: string; label: string }>;
}) {
  const size = 132;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const slices = items.map((item, index) => ({
    ...item,
    length: circumference * item.share,
    dashOffset:
      circumference * 0.25 +
      items.slice(0, index).reduce((sum, row) => sum + circumference * row.share, 0),
  }));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-200 dark:text-slate-800"
      />
      {slices.map((item) => (
        <circle
          key={item.label}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={item.fill}
          strokeWidth={stroke}
          strokeDasharray={`${item.length} ${circumference - item.length}`}
          strokeDashoffset={-item.dashOffset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

function WeeklySparkline({
  points,
}: {
  points: Array<{ label: string; rate: number; total: number }>;
}) {
  const width = 320;
  const height = 92;
  const padX = 12;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = padX + index * step;
    const y = padY + innerH * (1 - point.rate);
    return { x, y, ...point };
  });
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" role="img" aria-label="週次ミス率の推移">
      <line
        x1={padX}
        y1={padY + innerH}
        x2={width - padX}
        y2={padY + innerH}
        className="stroke-slate-200 dark:stroke-slate-800"
        strokeWidth="1"
      />
      {coords.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {coords.map((point) => (
        <g key={point.label}>
          <circle
            cx={point.x}
            cy={point.y}
            r={point.total > 0 ? 3.5 : 2.5}
            fill={point.total > 0 ? '#22d3ee' : '#64748b'}
          />
          <text
            x={point.x}
            y={height - 1}
            textAnchor="middle"
            className="fill-slate-500 text-[9px]"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function MistakeAnalysisDashboard({ records }: MistakeAnalysisDashboardProps) {
  const ranking = rankMistakeCauses(records, 3);
  const rankingTotal = ranking.reduce((sum, item) => sum + item.count, 0);
  const trend = buildWeeklyMistakeTrend(records, 8);
  const delta = weeklyMistakeDelta(trend);
  const incorrectCount = records.filter((record) => !record.isCorrect).length;
  const taggedCount = records.filter((record) => record.mistakeTag).length;

  const trendLabel =
    delta.improved === true
      ? 'ミス率が下がっています'
      : delta.improved === false
        ? '今週はミス率が上がっています'
        : '比較できる週次データがまだありません';

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          <PieChart className="h-4 w-4 text-cyan-400" />
          📊 ミス分析ダッシュボード
        </h2>
        <p className="text-[11px] text-slate-500">
          不正解 {incorrectCount}問 / 原因タグ {taggedCount}件
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold text-slate-500">失点原因ランキング TOP3</p>
          {ranking.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-700">
              不正解時に「なぜ間違えたか」タグを付けると、ここに原因ランキングが表示されます。
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <DonutChart
                items={ranking.map((item) => ({
                  share: rankingTotal > 0 ? item.count / rankingTotal : 0,
                  fill: item.meta.fill,
                  label: item.meta.shortLabel,
                }))}
              />
              <ol className="flex min-w-0 flex-1 flex-col gap-3">
                {ranking.map((item, index) => (
                  <li key={item.tag}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className={`font-semibold ${item.meta.textClass}`}>
                        {index + 1}. {item.meta.label}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {item.count}件 · {formatPercent(item.share)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${item.meta.barClass}`}
                        style={{ width: `${Math.max(8, Math.round(item.share * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">週次ミス率の推移</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                delta.improved === true
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : delta.improved === false
                    ? 'border-red-400/40 bg-red-400/10 text-red-300'
                    : 'border-slate-300 text-slate-400 dark:border-slate-700'
              }`}
            >
              {delta.improved === true ? (
                <TrendingDown className="h-3 w-3" />
              ) : delta.improved === false ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {trendLabel}
            </span>
          </div>
          <WeeklySparkline points={trend} />
          <p className="mt-1 text-[11px] text-slate-500">
            今週 {formatPercent(delta.currentRate)}
            {trend[trend.length - 2] ? ` ／ 先週 ${formatPercent(delta.previousRate)}` : ''}
            。ミス率が下がると弱点克服の成長です。
          </p>
        </div>
      </div>
    </section>
  );
}

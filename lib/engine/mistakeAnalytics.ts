// ==========================================
// Apex Suite: Math Lab - Mistake analytics
// ==========================================
// ライブラリダッシュボード用。失点原因ランキングと週次ミス率を集計する。

import type { MistakeTag, SolvedProblemRecord } from '@/types/mathLab';
import { MISTAKE_TAGS, type MistakeTagMeta } from '@/lib/engine/mistakeTags';

export interface MistakeRankItem {
  tag: MistakeTag;
  meta: MistakeTagMeta;
  count: number;
  share: number;
}

export interface WeeklyMistakePoint {
  weekStartISO: string;
  label: string;
  total: number;
  incorrect: number;
  rate: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 月曜始まりの週の初日 */
export function startOfWeekMonday(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function rankMistakeCauses(records: SolvedProblemRecord[], topN = 3): MistakeRankItem[] {
  const counts: Record<MistakeTag, number> = {
    calc_error: 0,
    condition_overlook: 0,
    formula_unknown: 0,
    approach_unknown: 0,
  };

  for (const record of records) {
    if (record.mistakeTag) counts[record.mistakeTag] += 1;
  }

  const taggedTotal = MISTAKE_TAGS.reduce((sum, tag) => sum + counts[tag.id], 0);
  return MISTAKE_TAGS.map((meta) => ({
    tag: meta.id,
    meta,
    count: counts[meta.id],
    share: taggedTotal > 0 ? counts[meta.id] / taggedTotal : 0,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.meta.shortLabel.localeCompare(b.meta.shortLabel, 'ja'))
    .slice(0, topN);
}

export function buildWeeklyMistakeTrend(
  records: SolvedProblemRecord[],
  weekCount = 8
): WeeklyMistakePoint[] {
  const today = new Date();
  const thisWeek = startOfWeekMonday(today);
  const points: WeeklyMistakePoint[] = [];

  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const start = new Date(thisWeek);
    start.setDate(thisWeek.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const startMs = start.getTime();
    const endMs = end.getTime();

    let total = 0;
    let incorrect = 0;
    for (const record of records) {
      const solved = new Date(record.solvedAt).getTime();
      if (Number.isNaN(solved) || solved < startMs || solved >= endMs) continue;
      total += 1;
      if (!record.isCorrect) incorrect += 1;
    }

    points.push({
      weekStartISO: toISODate(start),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      total,
      incorrect,
      rate: total > 0 ? incorrect / total : 0,
    });
  }

  return points;
}

export function weeklyMistakeDelta(points: WeeklyMistakePoint[]): {
  currentRate: number;
  previousRate: number;
  improved: boolean | null;
} {
  const current = points[points.length - 1];
  const previous = points[points.length - 2];
  if (!current || !previous || current.total === 0 && previous.total === 0) {
    return { currentRate: current?.rate ?? 0, previousRate: previous?.rate ?? 0, improved: null };
  }
  if (current.total === 0 || previous.total === 0) {
    return { currentRate: current.rate, previousRate: previous.rate, improved: null };
  }
  const diff = current.rate - previous.rate;
  if (Math.abs(diff) < 0.005) return { currentRate: current.rate, previousRate: previous.rate, improved: null };
  return { currentRate: current.rate, previousRate: previous.rate, improved: diff < 0 };
}

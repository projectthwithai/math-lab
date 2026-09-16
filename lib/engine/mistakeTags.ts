// ==========================================
// Apex Suite: Math Lab - Mistake tags (失点原因)
// ==========================================

import type { MistakeTag } from '@/types/mathLab';

export interface MistakeTagMeta {
  id: MistakeTag;
  emoji: string;
  label: string;
  shortLabel: string;
  fill: string;
  barClass: string;
  textClass: string;
}

export const MISTAKE_TAGS: MistakeTagMeta[] = [
  {
    id: 'calc_error',
    emoji: '🔢',
    label: '🔢 計算ミス',
    shortLabel: '計算ミス',
    fill: '#22d3ee',
    barClass: 'bg-cyan-400',
    textClass: 'text-cyan-300',
  },
  {
    id: 'condition_overlook',
    emoji: '👁️',
    label: '👁️ 条件見落とし',
    shortLabel: '条件見落とし',
    fill: '#fbbf24',
    barClass: 'bg-amber-400',
    textClass: 'text-amber-300',
  },
  {
    id: 'formula_unknown',
    emoji: '📖',
    label: '📖 公式・定義忘れ',
    shortLabel: '公式忘れ',
    fill: '#a78bfa',
    barClass: 'bg-violet-400',
    textClass: 'text-violet-300',
  },
  {
    id: 'approach_unknown',
    emoji: '💡',
    label: '💡 解法が思いつかなかった',
    shortLabel: '解法未修得',
    fill: '#34d399',
    barClass: 'bg-emerald-400',
    textClass: 'text-emerald-300',
  },
];

export const MISTAKE_TAG_BY_ID: Record<MistakeTag, MistakeTagMeta> = Object.fromEntries(
  MISTAKE_TAGS.map((tag) => [tag.id, tag])
) as Record<MistakeTag, MistakeTagMeta>;

export function isMistakeTag(value: unknown): value is MistakeTag {
  return (
    value === 'calc_error' ||
    value === 'condition_overlook' ||
    value === 'formula_unknown' ||
    value === 'approach_unknown'
  );
}

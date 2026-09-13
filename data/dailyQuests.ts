// ==========================================
// Apex Suite: Math Lab - Daily Quest Definitions
// ==========================================
// 演習特化のカスタムデイリークエスト。武器庫閲覧・ライブラリ復習タスクは持たない。

import type { CustomDailyQuest, Subject } from '@/types/mathLab';
import { UNITS_DATA, getUnitsBySubject, getUnitById } from '@/data/unitsData';
import { clampDifficulty } from '@/lib/engine/difficultyScale';

export const MIN_DAILY_QUEST_COUNT = 3;
export const MAX_DAILY_QUEST_COUNT = 10;
export const DEFAULT_DAILY_QUEST_COUNT = 3;
export const MAX_DAILY_QUEST_REWARDS_PER_DAY = 3;
export const STREAK_QUEST_GOAL = 3;

export const SUBJECT_LABEL: Record<Subject, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const DEFAULT_SEEDS: Array<Pick<CustomDailyQuest, 'subjects' | 'unitIds' | 'difficulty'>> = [
  {
    subjects: ['math'],
    unitIds: ['math-1a-quadratic-functions'],
    difficulty: 2,
  },
  {
    subjects: ['math'],
    unitIds: ['math-1a-numbers-and-expressions'],
    difficulty: 1,
  },
  {
    subjects: ['physics'],
    unitIds: ['physics-mechanics'],
    difficulty: 2,
  },
];

export function clampQuestCount(count: number): number {
  if (!Number.isFinite(count)) return DEFAULT_DAILY_QUEST_COUNT;
  return Math.min(MAX_DAILY_QUEST_COUNT, Math.max(MIN_DAILY_QUEST_COUNT, Math.round(count)));
}

export function buildQuestTitle(quest: Pick<CustomDailyQuest, 'questNumber' | 'subjects' | 'difficulty' | 'unitIds'>): string {
  const subjects =
    quest.subjects.length > 0 ? quest.subjects.map((subject) => SUBJECT_LABEL[subject]).join('・') : '理数';
  const unitTitle = quest.unitIds?.[0] ? getUnitById(quest.unitIds[0])?.title : undefined;
  const unitPart = unitTitle ?? subjects;
  return `クエスト${quest.questNumber}: ${unitPart}の問題を解く ★${clampDifficulty(quest.difficulty)}`;
}

export function createQuestSlot(questNumber: number, seed?: Partial<CustomDailyQuest>): CustomDailyQuest {
  const preset = DEFAULT_SEEDS[(questNumber - 1) % DEFAULT_SEEDS.length];
  const subjects = seed?.subjects?.length ? seed.subjects : preset.subjects;
  const unitIds = seed?.unitIds?.length ? seed.unitIds : preset.unitIds;
  const difficulty = clampDifficulty(seed?.difficulty ?? preset.difficulty);
  const quest: CustomDailyQuest = {
    id: seed?.id ?? `daily-quest-${questNumber}`,
    questNumber,
    title: '',
    subjects,
    unitIds,
    difficulty,
    isCompleted: seed?.isCompleted ?? false,
    isRewardClaimed: seed?.isRewardClaimed ?? false,
  };
  quest.title = buildQuestTitle(quest);
  return quest;
}

export function createDefaultDailyQuests(count = DEFAULT_DAILY_QUEST_COUNT): CustomDailyQuest[] {
  const questCount = clampQuestCount(count);
  return Array.from({ length: questCount }, (_, index) => createQuestSlot(index + 1));
}

export function normalizeDailyQuests(
  quests: CustomDailyQuest[] | undefined,
  count: number
): CustomDailyQuest[] {
  const questCount = clampQuestCount(count);
  const byNumber = new Map(
    (Array.isArray(quests) ? quests : []).map((quest) => [quest.questNumber, quest] as const)
  );
  return Array.from({ length: questCount }, (_, index) => {
    const questNumber = index + 1;
    return createQuestSlot(questNumber, byNumber.get(questNumber));
  });
}

export function unitsForSubjects(subjects: Subject[]): typeof UNITS_DATA {
  if (subjects.length === 0) return UNITS_DATA;
  return subjects.flatMap((subject) => getUnitsBySubject(subject));
}

export function pickQuestUnitId(quest: CustomDailyQuest): string {
  const pool =
    quest.unitIds.length > 0
      ? quest.unitIds
      : unitsForSubjects(quest.subjects).map((unit) => unit.id);
  const fallback = UNITS_DATA[0]?.id ?? 'math-1a-numbers-and-expressions';
  if (pool.length === 0) return fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildQuestWorkspaceHref(quest: CustomDailyQuest): string {
  const unitId = pickQuestUnitId(quest);
  const params = new URLSearchParams({
    unitId,
    difficulty: String(clampDifficulty(quest.difficulty)),
    source: 'daily-quest',
    questId: quest.id,
  });
  return `/workspace?${params.toString()}`;
}

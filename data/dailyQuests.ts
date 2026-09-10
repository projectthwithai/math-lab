// ==========================================
// Apex Suite: Math Lab - Daily Quest Definitions
// ==========================================
// トップ画面「🎯 本日のデイリークエスト」の固定3件。
// 達成後に XP または Energy 回復を受け取れる。

export type DailyQuestId = 'solve-quadratic' | 'check-weapon' | 'review-library';

export type DailyQuestReward =
  | { type: 'xp'; amount: number; label: string }
  | { type: 'energy'; amount: number; label: string };

export interface DailyQuestDefinition {
  id: DailyQuestId;
  index: 1 | 2 | 3;
  title: string;
  description: string;
  href: string;
  cta: string;
  reward: DailyQuestReward;
}

export const QUADRATIC_UNIT_ID = 'math-1a-quadratic-functions';

export const DAILY_QUESTS: DailyQuestDefinition[] = [
  {
    id: 'solve-quadratic',
    index: 1,
    title: '二次関数の基本問題を1問解く',
    description: 'ワークスペースで2次関数の基礎問題（Lv.2）に挑戦する。生成・解答は 0 Energy。',
    href: `/workspace?unitId=${QUADRATIC_UNIT_ID}&difficulty=2&source=daily-quest`,
    cta: '問題を解く（0 Energy）',
    reward: { type: 'xp', amount: 50, label: '+50 XP / Energy +30' },
  },
  {
    id: 'check-weapon',
    index: 2,
    title: '武器庫で公式を1つ確認する',
    description: '武器庫を開き、定理・公式カードを1つ閲覧する。閲覧は 0 Energy。',
    href: '/patterns?view=armory',
    cta: '武器庫を開く',
    reward: { type: 'energy', amount: 30, label: 'Energy回復 +30' },
  },
  {
    id: 'review-library',
    index: 3,
    title: '復習ライブラリから1問解く',
    description: 'マイライブラリで過去問を1問復習する。復習は 0 Energy。',
    href: '/library',
    cta: 'ライブラリへ',
    reward: { type: 'xp', amount: 50, label: '+50 XP / Energy +30' },
  },
];

export function isQuadraticDailyQuestUnit(unitId?: string | null, unitTitle?: string | null): boolean {
  if (unitId === QUADRATIC_UNIT_ID) return true;
  const title = unitTitle ?? '';
  return title.includes('2次関数') || title.includes('二次関数');
}

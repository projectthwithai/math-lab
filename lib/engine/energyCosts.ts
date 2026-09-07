// ==========================================
// Apex Suite: Math Lab - Energy Costs
// ==========================================
// 1日の標準Energyと、有料アクションの消費量を固定する。
// 「数字を変えて再生成」「武器庫/図鑑閲覧」「過去問復習」「デイリークエスト経由の生成」は 0 Energy。
// 図鑑の「新パターン解析」は問題生成と同じ 10 Energy。

/** 1日の標準Energy（日次リフィル上限） */
export const DEFAULT_MAX_ENERGY = 100;

/** 問題生成（/api/generate-problem） */
export const ENERGY_COST_GENERATE_PROBLEM = 10;

/** 新パターン解析（/api/generate-patterns） */
export const ENERGY_COST_DISCOVER_PATTERNS = 10;

/** 画像解析（/api/analyze-image） */
export const ENERGY_COST_ANALYZE_IMAGE = 15;

/** 解法ロジック検証（/api/verify-custom-solution） */
export const ENERGY_COST_VERIFY_LOGIC = 5;

/** 手書き途中式のAI赤ペン添削（/api/correct-scratchpad） */
export const ENERGY_COST_CORRECT_SCRATCHPAD = 5;

/** デイリークエスト経由の問題生成・解答。常に 0 Energy */
export const ENERGY_COST_DAILY_QUEST = 0;

/** デイリークエスト達成時の Energy 回復量 */
export const DAILY_QUEST_ENERGY_REWARD = 30;

export function isDailyQuestSource(source?: string | null): boolean {
  return source === 'daily-quest';
}

/** ワークスペースの問題生成コスト。デイリークエスト経由は常に 0 */
export function getGenerateEnergyCost(source?: string | null): number {
  return isDailyQuestSource(source) ? ENERGY_COST_DAILY_QUEST : ENERGY_COST_GENERATE_PROBLEM;
}

export function formatEnergyShortage(cost: number, remaining: number): string {
  return (
    `Energyが不足しています（必要 ${cost} / 残り ${remaining}）。` +
    `数字を変えて再生成・武器庫・図鑑閲覧・過去問復習は無料です。` +
    `デイリークエスト達成で +${DAILY_QUEST_ENERGY_REWARD} Energy 回復できます。`
  );
}

/** デイリークエスト等の報酬。maxEnergy を超えるオーバーキャップを許可する */
export function applyEnergyReward(energy: number, amount: number): number {
  return Math.max(0, energy + Math.max(0, amount));
}

/**
 * 日次リセット。
 * Energy が通常上限未満なら上限まで回復し、上限以上（限界突破）は維持する。
 */
export function applyDailyEnergyRefill(energy: number, maxEnergy = DEFAULT_MAX_ENERGY): number {
  const current = Number.isFinite(energy) ? energy : 0;
  return current < maxEnergy ? maxEnergy : current;
}

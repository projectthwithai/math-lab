// ==========================================
// Apex Suite: Math Lab - Energy Costs
// ==========================================
// 1日の標準Energyと、有料アクションの消費量を固定する。
// 「数字を変えて再生成」「武器庫/図鑑閲覧」「過去問復習」「デイリークエスト経由の生成」は 0 Energy。
// 図鑑の「新パターン解析」「新バリエーション解析」は問題生成と同じ 10 Energy。

/** 1日の標準Energy（日次リフィル上限） */
export const DEFAULT_MAX_ENERGY = 300;

/** 旧バージョンの日次上限。persist 移行で満タンユーザーを現行上限へ引き上げる */
export const LEGACY_MAX_ENERGY = 100;

/** デイリークエスト等の報酬による限界突破（オーバーキャップ）の絶対上限 */
export const ENERGY_OVERCAP_MAX = 400;

/** 問題生成（/api/generate-problem） */
export const ENERGY_COST_GENERATE_PROBLEM = 10;

/** 新パターン解析（/api/generate-patterns） */
export const ENERGY_COST_DISCOVER_PATTERNS = 10;

/** 新バリエーション解析（/api/generate-variant）。同一解法の変装問題を1問発掘 */
export const ENERGY_COST_GENERATE_VARIANT = 10;

/** 画像解析（/api/analyze-image） */
export const ENERGY_COST_ANALYZE_IMAGE = 15;

/** 解法ロジック検証（/api/verify-custom-solution） */
export const ENERGY_COST_VERIFY_LOGIC = 5;

/** 解法メモのAI清書（/api/refine-solution-note） */
export const ENERGY_COST_REFINE_NOTE = 5;

/** 反例トラップ問題の生成（/api/generate-counter-problems） */
export const ENERGY_COST_COUNTER_CHALLENGE = 10;

/** 手書き途中式のAI赤ペン添削（/api/correct-scratchpad） */
export const ENERGY_COST_CORRECT_SCRATCHPAD = 5;

/** 紙ノート写真の読み取り・論理デバッグ（/api/analyze-handwritten-note） */
export const ENERGY_COST_ANALYZE_HANDWRITTEN_NOTE = 5;

/** 不正解時の失点原因診断（/api/diagnose-mistake） */
export const ENERGY_COST_DIAGNOSE_MISTAKE = 5;

/** デイリークエスト経由の問題生成・解答。常に 0 Energy */
export const ENERGY_COST_DAILY_QUEST = 0;

/** 未ログイン1問お試しの初回生成。常に 0 Energy */
export const ENERGY_COST_GUEST_DEMO = 0;

/** マイライブラリからの過去問復習。常に 0 Energy */
export const ENERGY_COST_LIBRARY_REVIEW = 0;

/** 蓄積済みバリエーションの演習。解析時に課金済みなので常に 0 Energy */
export const ENERGY_COST_PATTERN_VARIANT = 0;

/** マイファイルの既習（復習）問題。過去に解いたスナップショットは 0 Energy */
export const ENERGY_COST_CUSTOM_FILE_REVIEW = 0;

/** マイファイルの未挑戦（初見）問題。通常の問題生成と同じ 10 Energy */
export const ENERGY_COST_CUSTOM_FILE_NEW = ENERGY_COST_GENERATE_PROBLEM;

/** デイリークエスト達成時の Energy 回復量 */
export const DAILY_QUEST_ENERGY_REWARD = 30;

export function isDailyQuestSource(source?: string | null): boolean {
  return source === 'daily-quest';
}

export function isGuestDemoSource(source?: string | null): boolean {
  return source === 'guest-demo';
}

export function isLibraryReviewSource(source?: string | null): boolean {
  return source === 'review';
}

export function isPatternVariantSource(source?: string | null): boolean {
  return source === 'variant';
}

export function isCustomFileSource(source?: string | null): boolean {
  return source === 'custom-file';
}

/** ワークスペースの問題生成コスト。デイリークエスト / ゲスト体験 / 過去問復習 / 蓄積バリエーションは 0。マイファイルは既習判定で別計算 */
export function getGenerateEnergyCost(source?: string | null): number {
  if (isDailyQuestSource(source)) return ENERGY_COST_DAILY_QUEST;
  if (isGuestDemoSource(source)) return ENERGY_COST_GUEST_DEMO;
  if (isLibraryReviewSource(source)) return ENERGY_COST_LIBRARY_REVIEW;
  if (isPatternVariantSource(source)) return ENERGY_COST_PATTERN_VARIANT;
  return ENERGY_COST_GENERATE_PROBLEM;
}

/** マイファイル1問の消費。既習・開発者は 0、未挑戦は 10 */
export function getCustomFilePracticeEnergyCost(options: {
  practiced: boolean;
  isDeveloper?: boolean;
}): number {
  if (options.isDeveloper) return ENERGY_COST_CUSTOM_FILE_REVIEW;
  return options.practiced ? ENERGY_COST_CUSTOM_FILE_REVIEW : ENERGY_COST_CUSTOM_FILE_NEW;
}

export function formatEnergyShortage(cost: number, remaining: number): string {
  return (
    `Energyが不足しています（必要 ${cost} / 残り ${remaining}）。` +
    `数字を変えて再生成・武器庫・図鑑閲覧・過去問復習は無料です。` +
    `デイリークエスト達成で +${DAILY_QUEST_ENERGY_REWARD} Energy 回復できます。`
  );
}

/** デイリークエスト等の報酬。maxEnergy を超えるオーバーキャップを ENERGY_OVERCAP_MAX まで許可する */
export function applyEnergyReward(energy: number, amount: number): number {
  const next = Math.max(0, energy + Math.max(0, amount));
  return Math.min(ENERGY_OVERCAP_MAX, next);
}

/**
 * 日次リセット。
 * Energy が通常上限未満なら上限まで回復し、上限以上（限界突破）は値を維持する。
 */
export function applyDailyEnergyRefill(energy: number, maxEnergy = DEFAULT_MAX_ENERGY): number {
  const current = Number.isFinite(energy) ? energy : 0;
  return current < maxEnergy ? maxEnergy : current;
}

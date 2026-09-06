// ==========================================
// Apex Suite: Math Lab - Forgetting Curve Engine（エビングハウスの忘却曲線）
// ==========================================
// マイライブラリの「今日復習すべき過去問」を決定するための間隔反復ロジック。
// reviewStage が進むほど、次回復習までの間隔（日数）が指数的に伸びていく。
// - Stage 0（解いた直後）    → 1日後に復習
// - Stage 1                  → 3日後
// - Stage 2                  → 7日後
// - Stage 3                  → 16日後
// - Stage 4以降（最大）      → 35日後
// 復習に「正解」できればステージが1つ進み、次回間隔が伸びる。
// 「不正解」の場合はステージを1つ戻し、より短い間隔で復習させる。

export const REVIEW_INTERVAL_DAYS: number[] = [1, 3, 7, 16, 35];
export const MAX_REVIEW_STAGE = REVIEW_INTERVAL_DAYS.length - 1;

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** 指定したreviewStageに対応する「次回復習までの間隔（日数）」を取得する */
export function getIntervalDaysForStage(reviewStage: number): number {
  const clamped = Math.min(Math.max(0, reviewStage), MAX_REVIEW_STAGE);
  return REVIEW_INTERVAL_DAYS[clamped];
}

/** 解答日時（ISO文字列）とreviewStageから、次回の復習日時（ISO文字列）を計算する */
export function computeNextReviewAt(solvedAtISO: string, reviewStage: number): string {
  return addDays(solvedAtISO, getIntervalDaysForStage(reviewStage));
}

/** 次回復習日時が「今日以前（＝復習期限が来ている）」かどうかを判定する */
export function isDueForReview(nextReviewAtISO: string, nowISO: string = new Date().toISOString()): boolean {
  return new Date(nextReviewAtISO).getTime() <= new Date(nowISO).getTime();
}

/** 復習期限からの経過日数（正の値ほど「復習が遅れている」）を計算する */
export function getOverdueDays(nextReviewAtISO: string, nowISO: string = new Date().toISOString()): number {
  const diffMs = new Date(nowISO).getTime() - new Date(nextReviewAtISO).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export interface ReviewAdvanceResult {
  reviewStage: number;
  nextReviewAt: string;
}

/**
 * 復習問題に再挑戦した結果を反映し、新しいreviewStageと次回復習日時を計算する。
 * 正解 → ステージを1つ進める（間隔が伸びる） / 不正解 → ステージを1つ戻す（間隔が縮む）。
 */
export function advanceReviewStage(
  currentStage: number,
  isCorrect: boolean,
  solvedAtISO: string = new Date().toISOString()
): ReviewAdvanceResult {
  const nextStage = isCorrect
    ? Math.min(MAX_REVIEW_STAGE, currentStage + 1)
    : Math.max(0, currentStage - 1);

  return {
    reviewStage: nextStage,
    nextReviewAt: computeNextReviewAt(solvedAtISO, nextStage),
  };
}

/** 図鑑UI表示用: 復習ステージを短いラベルにする（例: "初回復習" "定着中" "習得済み"） */
export function getReviewStageLabel(reviewStage: number): string {
  if (reviewStage <= 0) return '初回復習';
  if (reviewStage === 1) return '復習2回目';
  if (reviewStage === 2) return '定着中';
  if (reviewStage === 3) return '定着済み';
  return '習得済み';
}

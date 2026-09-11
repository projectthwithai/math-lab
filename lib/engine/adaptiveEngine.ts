// ==========================================
// Apex Suite: Math Lab - Adaptive Engine（適応型問題出題エンジン）
// ==========================================
// 100%クライアントサイドで動作する、純粋関数のみで構成されたエンジン。
// APIコストは一切発生しない。
//
// 責務:
// 1. 難易度の適応計算: 連続正解でレベルアップ、連続不正解でレベルダウン。
// 2. XP・レベル計算: 正誤判定に応じたXP付与と、ユーザーレベルの算出。
// 3. デイリーミッション選出: パターン図鑑の中から「未攻略」のパターンを
//    優先的に、日替わりで安定した3問を選ぶ。

import type { SolutionPattern } from '@/types/mathLab';
import {
  clampDifficulty,
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
} from '@/lib/engine/difficultyScale';

export { clampDifficulty, DEFAULT_DIFFICULTY, MAX_DIFFICULTY, MIN_DIFFICULTY };

/** 何連続の正解/不正解でレベルアップ/ダウンするかの閾値 */
export const DEFAULT_STREAK_THRESHOLD = 2;

export interface AdaptiveDifficultyState {
  difficulty: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface AdaptiveDifficultyResult extends AdaptiveDifficultyState {
  leveledUp: boolean;
  leveledDown: boolean;
}

export function createInitialAdaptiveState(
  startDifficulty: number = DEFAULT_DIFFICULTY
): AdaptiveDifficultyState {
  return {
    difficulty: clampDifficulty(startDifficulty),
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
  };
}

/**
 * 1問分の正誤判定結果を受け取り、次回の難易度を適応計算する（純粋関数）。
 */
export function advanceAdaptiveDifficulty(
  state: AdaptiveDifficultyState,
  isCorrect: boolean,
  streakThreshold: number = DEFAULT_STREAK_THRESHOLD
): AdaptiveDifficultyResult {
  const threshold = Math.max(1, Math.round(streakThreshold));

  if (isCorrect) {
    const consecutiveCorrect = state.consecutiveCorrect + 1;
    if (consecutiveCorrect >= threshold) {
      return {
        difficulty: clampDifficulty(state.difficulty + 1),
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        leveledUp: state.difficulty < MAX_DIFFICULTY,
        leveledDown: false,
      };
    }
    return {
      difficulty: state.difficulty,
      consecutiveCorrect,
      consecutiveIncorrect: 0,
      leveledUp: false,
      leveledDown: false,
    };
  }

  const consecutiveIncorrect = state.consecutiveIncorrect + 1;
  if (consecutiveIncorrect >= threshold) {
    return {
      difficulty: clampDifficulty(state.difficulty - 1),
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      leveledUp: false,
      leveledDown: state.difficulty > MIN_DIFFICULTY,
    };
  }
  return {
    difficulty: state.difficulty,
    consecutiveCorrect: 0,
    consecutiveIncorrect,
    leveledUp: false,
    leveledDown: false,
  };
}

// ------------------------------------------
// 2. XP・レベル計算（Gamification）
// ------------------------------------------

function xpRequiredForLevel(level: number): number {
  return 80 + Math.max(0, level - 1) * 20;
}

export interface LevelInfo {
  level: number;
  xpIntoCurrentLevel: number;
  xpRequiredForNextLevel: number;
}

export function calculateLevelFromTotalXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  for (let guard = 0; guard < 1000; guard++) {
    const required = xpRequiredForLevel(level);
    if (remaining < required) {
      return { level, xpIntoCurrentLevel: remaining, xpRequiredForNextLevel: required };
    }
    remaining -= required;
    level += 1;
  }

  return { level, xpIntoCurrentLevel: remaining, xpRequiredForNextLevel: xpRequiredForLevel(level) };
}

export interface ComputeXpRewardParams {
  difficulty: number;
  isCorrect: boolean;
  hintsUsed?: number;
}

/**
 * 1問分の正誤判定結果からXP付与量を計算する。
 * - 正解: 難易度が高いほどXPが多い。ヒントを使うと減点（最大60%減）。
 * - 不正解: 学習した分の少量のXPのみ付与する（挑戦したことへの報酬）。
 */
export function computeXpReward({
  difficulty,
  isCorrect,
  hintsUsed = 0,
}: ComputeXpRewardParams): number {
  if (!isCorrect) return 3;
  const base = 10 + Math.max(1, Math.min(MAX_DIFFICULTY, difficulty)) * 8;
  const hintPenaltyRate = Math.min(0.6, Math.max(0, hintsUsed) * 0.2);
  return Math.max(5, Math.round(base * (1 - hintPenaltyRate)));
}

export interface XpGainResult {
  xpEarned: number;
  previousTotalXp: number;
  totalXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  xpIntoCurrentLevel: number;
  xpRequiredForNextLevel: number;
}

/** 既存の累計XPに獲得XPを加算し、レベルアップ判定を含む結果を返す（純粋関数）。 */
export function applyXpGain(previousTotalXp: number, xpEarned: number): XpGainResult {
  const previousLevel = calculateLevelFromTotalXp(previousTotalXp).level;
  const totalXp = Math.max(0, previousTotalXp) + Math.max(0, xpEarned);
  const newLevelInfo = calculateLevelFromTotalXp(totalXp);

  return {
    xpEarned,
    previousTotalXp,
    totalXp,
    previousLevel,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > previousLevel,
    xpIntoCurrentLevel: newLevelInfo.xpIntoCurrentLevel,
    xpRequiredForNextLevel: newLevelInfo.xpRequiredForNextLevel,
  };
}

// ------------------------------------------
// 3. デイリーミッション選出（未攻略パターンの優先抽出）
// ------------------------------------------

/** 文字列から決定的な32bit風の疑似ハッシュ値を生成する（Math.randomは使わない） */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 難易度レベルそのものに対する優先度の重み（基本 > 標準 > 応用の順で先に出す） */
const LEVEL_PRIORITY_WEIGHT: Record<SolutionPattern['level'], number> = {
  basic: 30,
  standard: 20,
  advanced: 10,
};

/**
 * 未攻略パターンの中から、日替わり（今日の日付をシードにした決定的な順序）で
 * 安定した`count`件のデイリーミッションを選出する。
 * - 攻略済み（clearedPatternIds）は優先度が最も低くなり、他に候補がない場合のみ
 *   復習として混ざる余地を残す。
 */
export function selectDailyMissionPatterns(
  patterns: SolutionPattern[],
  clearedPatternIds: string[],
  count: number,
  seedDateISO: string
): SolutionPattern[] {
  const clearedSet = new Set(clearedPatternIds);
  const seed = hashString(seedDateISO);

  const scored = patterns.map((pattern) => {
    const isCleared = clearedSet.has(pattern.id);
    const levelScore = LEVEL_PRIORITY_WEIGHT[pattern.level];
    const clearedPenalty = isCleared ? -1000 : 0;
    // 日替わりで少しシャッフルされるよう、シード+パターンIDのハッシュを
    // スコアに小さく加味する（決定的なので同日中は結果が変わらない）。
    const dailyJitter = (hashString(pattern.id + seed) % 17) - 8;
    return { pattern, score: levelScore + clearedPenalty + dailyJitter, isCleared };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.pattern.id.localeCompare(b.pattern.id);
  });

  return scored.slice(0, Math.max(0, count)).map((entry) => entry.pattern);
}

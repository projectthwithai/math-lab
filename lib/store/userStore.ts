// ==========================================
// Apex Suite: Math Lab - Global User Store (Zustand)
// ==========================================
// アプリ全体で共有する「ユーザー状態」の単一の情報源（Single Source of Truth）。
// - 獲得XP・プレイヤーレベル
// - 連続学習ストリーク（日数）
// - Energy（スタミナ。1日1回リフィルされ、問題に挑戦するたびに消費される）
// - クリアした解法パターンIDリスト（パターン図鑑・デイリーミッションが参照する）
// - アダプティブ出題エンジンの難易度状態
//
// `zustand/middleware` の `persist` でlocalStorageに自動保存される。
// Next.js App RouterでのSSR/クライアント間のハイドレーションミスマッチを防ぐため
// `skipHydration: true` にし、`components/layout/UserStoreHydrator.tsx` が
// マウント後（クライアントのみ）に明示的に`rehydrate()`を呼び出す設計。

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  advanceAdaptiveDifficulty,
  applyXpGain,
  computeXpReward,
  type XpGainResult,
} from '@/lib/engine/adaptiveEngine';

export const DEFAULT_MAX_ENERGY = 5;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getTodayISODate(): string {
  return toISODate(new Date());
}

function getYesterdayISODate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}

export interface RecordAnswerParams {
  isCorrect: boolean;
  /** 解いた問題の難易度（1〜10） */
  difficulty: number;
  hintsUsed?: number;
  /** 正解時、この解法パターンを「攻略済み」として記録する */
  patternId?: string | null;
}

interface UserStoreState {
  // --- XP・レベル ---
  totalXp: number;
  level: number;
  xpIntoCurrentLevel: number;
  xpRequiredForNextLevel: number;

  // --- 連続学習ストリーク ---
  streakDays: number;
  lastActiveDateISO: string | null;

  // --- Energy（スタミナ） ---
  energy: number;
  maxEnergy: number;
  lastEnergyRefillDateISO: string | null;

  // --- パターン図鑑の攻略状況 ---
  clearedPatternIds: string[];

  // --- アダプティブ出題エンジン（難易度） ---
  currentDifficulty: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;

  // --- ハイドレーション状態（SSRとの不一致防止用） ---
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // --- アクション ---
  /** アプリ起動時（クライアントマウント後）に1度呼び出し、ストリーク更新とEnergy日次リフィルを行う */
  touchDailyStreakAndEnergy: () => void;
  /** 1問解答した結果を反映する（XP付与・難易度適応・Energy消費・パターン攻略記録を1回で行う） */
  recordAnswer: (params: RecordAnswerParams) => XpGainResult;
  /** 明示的にパターンを攻略済みにする（recordAnswerを経由しないケース用） */
  markPatternCleared: (patternId: string) => void;
  /** パターン図鑑からの手動トグル（攻略済み⇔未攻略を切り替える） */
  toggleClearedPattern: (patternId: string) => void;
  /** Energyが足りるか確認しつつ消費する。消費できた場合はtrueを返す */
  consumeEnergy: (amount?: number) => boolean;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      level: 1,
      xpIntoCurrentLevel: 0,
      xpRequiredForNextLevel: 80,

      streakDays: 0,
      lastActiveDateISO: null,

      energy: DEFAULT_MAX_ENERGY,
      maxEnergy: DEFAULT_MAX_ENERGY,
      lastEnergyRefillDateISO: null,

      clearedPatternIds: [],

      currentDifficulty: 5,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,

      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      touchDailyStreakAndEnergy: () => {
        const today = getTodayISODate();
        const yesterday = getYesterdayISODate();

        set((state) => {
          let streakDays = state.streakDays;
          if (state.lastActiveDateISO === today) {
            // 本日すでに記録済み: 何もしない
          } else if (state.lastActiveDateISO === yesterday) {
            streakDays = state.streakDays + 1;
          } else {
            streakDays = 1;
          }

          let energy = state.energy;
          let lastEnergyRefillDateISO = state.lastEnergyRefillDateISO;
          if (lastEnergyRefillDateISO !== today) {
            energy = state.maxEnergy;
            lastEnergyRefillDateISO = today;
          }

          return { streakDays, lastActiveDateISO: today, energy, lastEnergyRefillDateISO };
        });
      },

      recordAnswer: ({ isCorrect, difficulty, hintsUsed = 0, patternId }) => {
        const state = get();

        const xpEarned = computeXpReward({ difficulty, isCorrect, hintsUsed });
        const xpResult = applyXpGain(state.totalXp, xpEarned);

        const nextAdaptive = advanceAdaptiveDifficulty(
          {
            difficulty: state.currentDifficulty,
            consecutiveCorrect: state.consecutiveCorrect,
            consecutiveIncorrect: state.consecutiveIncorrect,
          },
          isCorrect
        );

        const shouldClearPattern = Boolean(
          isCorrect && patternId && !state.clearedPatternIds.includes(patternId)
        );

        set({
          totalXp: xpResult.totalXp,
          level: xpResult.newLevel,
          xpIntoCurrentLevel: xpResult.xpIntoCurrentLevel,
          xpRequiredForNextLevel: xpResult.xpRequiredForNextLevel,
          currentDifficulty: nextAdaptive.difficulty,
          consecutiveCorrect: nextAdaptive.consecutiveCorrect,
          consecutiveIncorrect: nextAdaptive.consecutiveIncorrect,
          energy: Math.max(0, state.energy - 1),
          clearedPatternIds: shouldClearPattern
            ? [...state.clearedPatternIds, patternId as string]
            : state.clearedPatternIds,
        });

        return xpResult;
      },

      markPatternCleared: (patternId) => {
        set((state) =>
          state.clearedPatternIds.includes(patternId)
            ? state
            : { clearedPatternIds: [...state.clearedPatternIds, patternId] }
        );
      },

      toggleClearedPattern: (patternId) => {
        set((state) =>
          state.clearedPatternIds.includes(patternId)
            ? { clearedPatternIds: state.clearedPatternIds.filter((id) => id !== patternId) }
            : { clearedPatternIds: [...state.clearedPatternIds, patternId] }
        );
      },

      consumeEnergy: (amount = 1) => {
        const state = get();
        if (state.energy < amount) return false;
        set({ energy: state.energy - amount });
        return true;
      },
    }),
    {
      name: 'math-lab:user-store',
      storage: createJSONStorage(() => localStorage),
      // SSR時にlocalStorageへアクセスしないよう、自動ハイドレーションを無効化。
      // `UserStoreHydrator`がマウント後に明示的に`rehydrate()`する。
      skipHydration: true,
    }
  )
);

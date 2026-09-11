// ==========================================
// Apex Suite: Math Lab - Global User Store (Zustand)
// ==========================================
// アプリ全体で共有する「ユーザー状態」の単一の情報源（Single Source of Truth）。
// - 獲得XP・プレイヤーレベル
// - 連続学習ストリーク（日数）
// - Energy（スタミナ。1日1回リフィル。生成/解析/検証で消費）
// - クリアした解法パターンIDリスト（パターン図鑑・デイリーミッションが参照する）
// - 発掘パターン（discoveredPatterns。図鑑保存 → 単元演習の出題プール）
// - アダプティブ出題エンジンの難易度状態
//
// `zustand/middleware` の `persist` でlocalStorageに自動保存される。
// Next.js App RouterでのSSR/クライアント間のハイドレーションミスマッチを防ぐため
// `skipHydration: true` にし、`components/layout/UserStoreHydrator.tsx` が
// マウント後（クライアントのみ）に明示的に`rehydrate()`を呼び出す設計。

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SolutionPattern } from '@/types/mathLab';
import {
  advanceAdaptiveDifficulty,
  applyXpGain,
  computeXpReward,
  type XpGainResult,
} from '@/lib/engine/adaptiveEngine';
import {
  DEFAULT_MAX_ENERGY,
  DAILY_QUEST_ENERGY_REWARD,
  applyDailyEnergyRefill,
  applyEnergyReward,
} from '@/lib/engine/energyCosts';
import { hasDeveloperPrivileges } from '@/lib/auth/developerAccess';

export { DEFAULT_MAX_ENERGY, DAILY_QUEST_ENERGY_REWARD };

function stampProgress(): string {
  return new Date().toISOString();
}

export const LEGACY_DISCOVERED_PATTERNS_KEY = 'math-lab:discovered-patterns';

function isSolutionPatternLike(value: unknown): value is SolutionPattern {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.patternName === 'string' &&
    typeof candidate.strategyText === 'string' &&
    (candidate.subject === 'math' || candidate.subject === 'physics' || candidate.subject === 'chemistry')
  );
}

function readLegacyDiscoveredPatterns(): SolutionPattern[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_DISCOVERED_PATTERNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter(isSolutionPatternLike);
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, unknown>)
        .flat()
        .filter(isSolutionPatternLike);
    }
  } catch (error) {
    console.error('[userStore] 旧発掘パターンの読み込みに失敗しました', error);
  }
  return [];
}

function mergeDiscoveredPatterns(
  current: SolutionPattern[],
  incoming: SolutionPattern[]
): { next: SolutionPattern[]; added: SolutionPattern[] } {
  const existingIds = new Set(current.map((pattern) => pattern.id));
  const existingKeys = new Set(current.map((pattern) => `${pattern.unitId ?? ''}::${pattern.patternName}`));
  const added = incoming
    .filter(isSolutionPatternLike)
    .map((pattern) => ({ ...pattern, discovered: true as const }))
    .filter((pattern) => {
      const key = `${pattern.unitId ?? ''}::${pattern.patternName}`;
      if (existingIds.has(pattern.id) || existingKeys.has(key)) return false;
      existingIds.add(pattern.id);
      existingKeys.add(key);
      return true;
    });
  return { next: [...added, ...current], added };
}


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

  /** 管理者メールでログイン中のみ true。localStorage には保存せず、Auth から再計算する */
  isDeveloper: boolean;

  /** 未ログインの1問お試し体験中。ホームをダッシュボードに切り替える */
  isGuestDemo: boolean;

  /** ローカル進捗の最終更新時刻（Energy の last-write 同期に使う） */
  progressUpdatedAt: string | null;

  // --- パターン図鑑の攻略状況 ---
  clearedPatternIds: string[];

  // --- 発掘パターン（図鑑 → 単元演習の出題プール） ---
  discoveredPatterns: SolutionPattern[];

  // --- 解放した武器（閲覧で収集。空でも図鑑は全公開） ---
  unlockedWeaponIds: string[];

  // --- アダプティブ出題エンジン（難易度） ---
  currentDifficulty: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;

  // --- ハイドレーション状態（SSRとの不一致防止用） ---
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // --- アクション ---
  /** ウェルカム画面から「1問だけ体験」を開始する */
  startGuestDemo: () => void;
  /** アプリ起動時（クライアントマウント後）に1度呼び出し、ストリーク更新とEnergy日次リフィルを行う */
  touchDailyStreakAndEnergy: () => void;
  /** 1問解答した結果を反映する（XP付与・難易度適応・パターン攻略記録。Energyは消費しない） */
  recordAnswer: (params: RecordAnswerParams) => XpGainResult;
  /** 明示的にパターンを攻略済みにする（recordAnswerを経由しないケース用） */
  markPatternCleared: (patternId: string) => void;
  /** パターン図鑑からの手動トグル（攻略済み⇔未攻略を切り替える） */
  toggleClearedPattern: (patternId: string) => void;
  /** Energyが足りるか確認しつつ消費する。消費できた場合はtrueを返す */
  consumeEnergy: (amount?: number) => boolean;
  /** consumeEnergy のエイリアス（新パターン解析など） */
  useEnergy: (amount?: number) => boolean;
  /** 開発者モードまたはコスト0なら常に true */
  canAffordEnergy: (amount?: number) => boolean;
  /** 消費に失敗したアクションの払い戻し。Dev Mode / 0消費では何もしない */
  refundEnergy: (amount?: number) => void;
  /** デイリークエスト等から XP を直接付与する */
  grantXp: (amount: number) => XpGainResult;
  /** デイリークエスト等から Energy を回復する（maxEnergy を超える限界突破を許可） */
  restoreEnergy: (amount?: number) => void;
  /** デイリークエスト達成時の標準 Energy 回復（+30） */
  restoreDailyQuestEnergy: () => void;
  /** 武器を解放済みとして記録する（閲覧時） */
  unlockWeapon: (weaponId: string) => void;
  /** 図鑑で発掘した新パターンを出題プールへ追加（重複はスキップ） */
  appendDiscoveredPatterns: (incoming: SolutionPattern[]) => SolutionPattern[];
  /** 発掘パターンの方針文を更新する */
  updateDiscoveredPatternStrategy: (patternId: string, strategyText: string) => void;
  /** 旧 LocalStorage キーから発掘パターンを取り込み、Zustand へ統合する */
  importLegacyDiscoveredPatterns: () => void;
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
      isDeveloper: false,
      isGuestDemo: false,
      progressUpdatedAt: null,

      clearedPatternIds: [],
      discoveredPatterns: [],
      unlockedWeaponIds: [],

      currentDifficulty: 5,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,

      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      startGuestDemo: () => set({ isGuestDemo: true }),

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

          const maxEnergy = DEFAULT_MAX_ENERGY;
          let energy = state.energy;
          let lastEnergyRefillDateISO = state.lastEnergyRefillDateISO;
          if (lastEnergyRefillDateISO !== today) {
            energy = applyDailyEnergyRefill(state.energy, maxEnergy);
            lastEnergyRefillDateISO = today;
          }

          return {
            streakDays,
            lastActiveDateISO: today,
            energy,
            maxEnergy,
            lastEnergyRefillDateISO,
            progressUpdatedAt: stampProgress(),
          };
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
          clearedPatternIds: shouldClearPattern
            ? [...state.clearedPatternIds, patternId as string]
            : state.clearedPatternIds,
          progressUpdatedAt: stampProgress(),
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
        if (hasDeveloperPrivileges() || amount <= 0) return true;
        if (state.energy < amount) return false;
        set({ energy: state.energy - amount, progressUpdatedAt: stampProgress() });
        return true;
      },

      useEnergy: (amount = 1) => get().consumeEnergy(amount),

      canAffordEnergy: (amount = 1) => {
        if (hasDeveloperPrivileges() || amount <= 0) return true;
        return get().energy >= amount;
      },

      refundEnergy: (amount = 1) => {
        if (hasDeveloperPrivileges() || amount <= 0) return;
        get().restoreEnergy(amount);
      },

      grantXp: (amount) => {
        const xpResult = applyXpGain(get().totalXp, amount);
        set({
          totalXp: xpResult.totalXp,
          level: xpResult.newLevel,
          xpIntoCurrentLevel: xpResult.xpIntoCurrentLevel,
          xpRequiredForNextLevel: xpResult.xpRequiredForNextLevel,
          progressUpdatedAt: stampProgress(),
        });
        return xpResult;
      },

      restoreEnergy: (amount = 1) => {
        set((state) => ({
          energy: applyEnergyReward(state.energy, amount),
          progressUpdatedAt: stampProgress(),
        }));
      },

      restoreDailyQuestEnergy: () => {
        get().restoreEnergy(DAILY_QUEST_ENERGY_REWARD);
      },

      unlockWeapon: (weaponId) => {
        if (!weaponId) return;
        set((state) =>
          state.unlockedWeaponIds.includes(weaponId)
            ? state
            : { unlockedWeaponIds: [...state.unlockedWeaponIds, weaponId], progressUpdatedAt: stampProgress() }
        );
      },

      appendDiscoveredPatterns: (incoming) => {
        const { next, added } = mergeDiscoveredPatterns(get().discoveredPatterns, incoming);
        if (added.length > 0) {
          set({ discoveredPatterns: next, progressUpdatedAt: stampProgress() });
        }
        return added;
      },

      updateDiscoveredPatternStrategy: (patternId, strategyText) => {
        set((state) => ({
          discoveredPatterns: state.discoveredPatterns.map((pattern) =>
            pattern.id === patternId ? { ...pattern, strategyText } : pattern
          ),
          progressUpdatedAt: stampProgress(),
        }));
      },

      importLegacyDiscoveredPatterns: () => {
        const legacy = readLegacyDiscoveredPatterns();
        if (legacy.length === 0) return;
        const { next, added } = mergeDiscoveredPatterns(get().discoveredPatterns, legacy);
        if (added.length > 0) {
          set({ discoveredPatterns: next, progressUpdatedAt: stampProgress() });
        }
      },
    }),
    {
      name: 'math-lab:user-store',
      storage: createJSONStorage(() => localStorage),
      // SSR時にlocalStorageへアクセスしないよう、自動ハイドレーションを無効化。
      // `UserStoreHydrator`がマウント後に明示的に`rehydrate()`する。
      skipHydration: true,
      partialize: (state) => {
        const { isDeveloper: _isDeveloper, hasHydrated: _hasHydrated, ...persisted } = state;
        return persisted;
      },
      merge: (persisted, current) => {
        const incoming =
          typeof persisted === 'object' && persisted ? (persisted as Partial<UserStoreState>) : {};
        const energy = typeof incoming.energy === 'number' ? incoming.energy : current.energy;
        return {
          ...current,
          ...incoming,
          maxEnergy: DEFAULT_MAX_ENERGY,
          energy,
          // 開発者フラグは Auth メール判定のみ。localStorage 改ざんは無効化する。
          isDeveloper: false,
          isGuestDemo: incoming.isGuestDemo === true,
          unlockedWeaponIds: Array.isArray(incoming.unlockedWeaponIds)
            ? incoming.unlockedWeaponIds
            : current.unlockedWeaponIds,
          hasHydrated: false,
        };
      },
    }
  )
);

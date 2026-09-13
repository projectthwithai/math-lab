// ==========================================
// Apex Suite: Math Lab - Daily Quest Store
// ==========================================
// カスタムデイリークエスト（3〜10問）と、1日最大3回のEnergy報酬受け取りを永続化する。

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { CustomDailyQuest } from '@/types/mathLab';
import {
  MAX_DAILY_QUEST_REWARDS_PER_DAY,
  DEFAULT_DAILY_QUEST_COUNT,
  STREAK_QUEST_GOAL,
  clampQuestCount,
  createDefaultDailyQuests,
  normalizeDailyQuests,
} from '@/data/dailyQuests';
import { getTodayISODate, useUserStore } from '@/lib/store/userStore';
import { DAILY_QUEST_ENERGY_REWARD } from '@/lib/engine/energyCosts';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';

export interface ClaimQuestResult {
  energyAmount: number;
  xpResult: XpGainResult | null;
  rewardsClaimedToday: number;
}

interface DailyQuestState {
  dateISO: string;
  questCount: number;
  quests: CustomDailyQuest[];
  rewardsClaimedToday: number;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  ensureToday: () => void;
  saveQuestSettings: (questCount: number, quests: CustomDailyQuest[]) => void;
  completeQuest: (id: string) => void;
  claimQuest: (id: string) => ClaimQuestResult | null;
}

function resetDailyProgress(quests: CustomDailyQuest[]): CustomDailyQuest[] {
  return quests.map((quest) => ({ ...quest, isCompleted: false, isRewardClaimed: false }));
}

function tryGrantQuestStreak(quests: CustomDailyQuest[]): void {
  const completedCount = quests.filter((quest) => quest.isCompleted).length;
  if (completedCount < STREAK_QUEST_GOAL) return;
  useUserStore.getState().grantQuestStreakIfEligible();
}

export const useDailyQuestStore = create<DailyQuestState>()(
  persist(
    (set, get) => ({
      dateISO: '',
      questCount: DEFAULT_DAILY_QUEST_COUNT,
      quests: createDefaultDailyQuests(),
      rewardsClaimedToday: 0,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      ensureToday: () => {
        const today = getTodayISODate();
        const state = get();
        if (state.dateISO === today) {
          tryGrantQuestStreak(state.quests);
          return;
        }
        set({
          dateISO: today,
          rewardsClaimedToday: 0,
          quests: resetDailyProgress(normalizeDailyQuests(state.quests, state.questCount)),
        });
      },

      saveQuestSettings: (questCount, quests) => {
        get().ensureToday();
        const nextCount = clampQuestCount(questCount);
        const nextQuests = normalizeDailyQuests(quests, nextCount);
        set({ questCount: nextCount, quests: nextQuests });
      },

      completeQuest: (id) => {
        get().ensureToday();
        const alreadyDone = get().quests.find((quest) => quest.id === id)?.isCompleted;
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === id ? { ...quest, isCompleted: true } : quest
          ),
        }));
        if (!alreadyDone) {
          tryGrantQuestStreak(get().quests);
        }
      },

      claimQuest: (id) => {
        get().ensureToday();
        const state = get();
        const quest = state.quests.find((item) => item.id === id);
        if (!quest || !quest.isCompleted || quest.isRewardClaimed) return null;
        if (state.rewardsClaimedToday >= MAX_DAILY_QUEST_REWARDS_PER_DAY) return null;

        const rewardsClaimedToday = state.rewardsClaimedToday + 1;
        set({
          rewardsClaimedToday,
          quests: state.quests.map((item) =>
            item.id === id ? { ...item, isRewardClaimed: true } : item
          ),
        });

        useUserStore.getState().restoreDailyQuestEnergy();
        return {
          energyAmount: DAILY_QUEST_ENERGY_REWARD,
          xpResult: null,
          rewardsClaimedToday,
        };
      },
    }),
    {
      name: 'math-lab:daily-quests',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const incoming =
          typeof persisted === 'object' && persisted ? (persisted as Partial<DailyQuestState>) : {};
        const questCount = clampQuestCount(incoming.questCount ?? current.questCount);
        return {
          ...current,
          ...incoming,
          questCount,
          quests: normalizeDailyQuests(incoming.quests, questCount),
          rewardsClaimedToday:
            typeof incoming.rewardsClaimedToday === 'number' ? incoming.rewardsClaimedToday : 0,
          hasHydrated: false,
        };
      },
    }
  )
);

export function completeDailyQuest(id: string): void {
  useDailyQuestStore.getState().completeQuest(id);
}

export type { CustomDailyQuest };

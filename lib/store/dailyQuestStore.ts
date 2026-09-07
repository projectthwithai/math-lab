// ==========================================
// Apex Suite: Math Lab - Daily Quest Store
// ==========================================
// 本日のデイリークエスト達成・報酬受け取りを日付キーで永続化する。
// 日付が変わると completed / claimed をリセットする。

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { DAILY_QUESTS, type DailyQuestId, type DailyQuestReward } from '@/data/dailyQuests';
import { getTodayISODate, useUserStore } from '@/lib/store/userStore';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';

export interface ClaimQuestResult {
  reward: DailyQuestReward;
  xpResult: XpGainResult | null;
}

interface DailyQuestState {
  dateISO: string;
  completedIds: DailyQuestId[];
  claimedIds: DailyQuestId[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  ensureToday: () => void;
  completeQuest: (id: DailyQuestId) => void;
  claimQuest: (id: DailyQuestId) => ClaimQuestResult | null;
}

export const useDailyQuestStore = create<DailyQuestState>()(
  persist(
    (set, get) => ({
      dateISO: '',
      completedIds: [],
      claimedIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      ensureToday: () => {
        const today = getTodayISODate();
        if (get().dateISO === today) return;
        set({ dateISO: today, completedIds: [], claimedIds: [] });
      },

      completeQuest: (id) => {
        get().ensureToday();
        set((state) =>
          state.completedIds.includes(id) ? state : { completedIds: [...state.completedIds, id] }
        );
      },

      claimQuest: (id) => {
        get().ensureToday();
        const state = get();
        if (!state.completedIds.includes(id) || state.claimedIds.includes(id)) return null;

        const definition = DAILY_QUESTS.find((quest) => quest.id === id);
        if (!definition) return null;

        set({ claimedIds: [...state.claimedIds, id] });

        useUserStore.getState().restoreDailyQuestEnergy();

        if (definition.reward.type === 'xp') {
          const xpResult = useUserStore.getState().grantXp(definition.reward.amount);
          return { reward: definition.reward, xpResult };
        }

        return { reward: definition.reward, xpResult: null };
      },
    }),
    {
      name: 'math-lab:daily-quests',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export function completeDailyQuest(id: DailyQuestId): void {
  useDailyQuestStore.getState().completeQuest(id);
}

'use client';

// ==========================================
// Apex Suite: Math Lab - User Store Hydrator
// ==========================================
// 全ページの layout に常駐し、次を順に行う:
// 1. LocalStorage から Zustand を復元
// 2. ログイン中ならクラウドの学習データを即時上書き復元
// 3. ストア変更を 1 秒デバウンスで user_app_data へ自動保存

import { useEffect } from 'react';

import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import { useUserStore } from '@/lib/store/userStore';
import { startAuthSync } from '@/lib/supabase/authSync';
import { startCloudSyncAutoPush } from '@/lib/supabase/cloudSync';

export default function UserStoreHydrator() {
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      await useUserStore.persist.rehydrate();
      useUserStore.getState().importLegacyDiscoveredPatterns();
      useUserStore.getState().importLegacyPatternNotes();
      useUserStore.getState().touchDailyStreakAndEnergy();
      useUserStore.getState().setHasHydrated(true);

      await useDailyQuestStore.persist.rehydrate();
      useDailyQuestStore.getState().setHasHydrated(true);
      useDailyQuestStore.getState().ensureToday();

      if (cancelled) return;
      startCloudSyncAutoPush();
      startAuthSync();
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

'use client';

// ==========================================
// Apex Suite: Math Lab - User Store Hydrator
// ==========================================
// `lib/store/userStore.ts` は `skipHydration: true` でSSRとの
// ハイドレーションミスマッチを防いでいるため、クライアントマウント後に
// このコンポーネントが明示的に localStorage からの復元(rehydrate)と、
// 日次の Energy リフィルと、未達成日のストリーク失効を行う。
// `app/layout.tsx` に1度だけ配置する（何も描画しない）。

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import { startAuthSync } from '@/lib/supabase/authSync';

export default function UserStoreHydrator() {
  useEffect(() => {
    const hydrate = async () => {
      await useUserStore.persist.rehydrate();
      useUserStore.getState().importLegacyDiscoveredPatterns();
      useUserStore.getState().touchDailyStreakAndEnergy();
      useUserStore.getState().setHasHydrated(true);

      await useDailyQuestStore.persist.rehydrate();
      useDailyQuestStore.getState().setHasHydrated(true);
      useDailyQuestStore.getState().ensureToday();

      startAuthSync();
    };

    void hydrate();
  }, []);

  return null;
}

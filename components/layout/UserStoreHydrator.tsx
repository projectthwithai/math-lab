'use client';

// ==========================================
// Apex Suite: Math Lab - User Store Hydrator
// ==========================================
// `lib/store/userStore.ts` は `skipHydration: true` でSSRとの
// ハイドレーションミスマッチを防いでいるため、クライアントマウント後に
// このコンポーネントが明示的に localStorage からの復元(rehydrate)と、
// 日次のストリーク更新・Energyリフィルを行う。
// `app/layout.tsx` に1度だけ配置する（何も描画しない）。

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';

export default function UserStoreHydrator() {
  useEffect(() => {
    useUserStore.persist.rehydrate();
    useUserStore.getState().setHasHydrated(true);
    useUserStore.getState().touchDailyStreakAndEnergy();
  }, []);

  return null;
}

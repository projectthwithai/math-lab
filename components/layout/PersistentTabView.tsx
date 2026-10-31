'use client';

// ==========================================
// Apex Suite: Math Lab - 常駐型タブビュー
// ==========================================
// 5タブは初回表示でまとめてマウントし、以降は display の切り替えだけにする。
// hidden でもアンマウントしないので、スクロール位置と開いていたカードが残る。

import { useLayoutEffect, type ReactNode } from 'react';

import { useMainTab } from '@/components/layout/MainTabProvider';
import ArmoryView from '@/components/views/ArmoryView';
import DashboardView from '@/components/views/DashboardView';
import LibraryView from '@/components/views/LibraryView';
import MockExamView from '@/components/views/MockExamView';
import PatternsView from '@/components/views/PatternsView';
import type { MainTabKey } from '@/lib/navigation/mainTabs';
import { useCatalogStore } from '@/lib/store/catalogStore';
import { useUserStore } from '@/lib/store/userStore';

function TabPanel({
  tab,
  activeTab,
  children,
}: {
  tab: MainTabKey;
  activeTab: MainTabKey;
  children: ReactNode;
}) {
  const active = activeTab === tab;
  return (
    <div className={active ? 'block' : 'hidden'} inert={active ? undefined : true} aria-hidden={active ? undefined : true}>
      {children}
    </div>
  );
}

export default function PersistentTabView() {
  const { activeTab, onShell } = useMainTab();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const ready = useCatalogStore((state) => state.ready);

  useLayoutEffect(() => {
    if (!hasHydrated) return;
    // シェルへ戻ったときだけ解答履歴を読み直す。タブ切り替え（onShell は true のまま）では走らない。
    useCatalogStore.getState().preload();
  }, [hasHydrated, onShell]);

  if (!ready) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <>
      <TabPanel tab="home" activeTab={activeTab}>
        <DashboardView />
      </TabPanel>
      <TabPanel tab="patterns" activeTab={activeTab}>
        <PatternsView />
      </TabPanel>
      <TabPanel tab="mock" activeTab={activeTab}>
        <MockExamView />
      </TabPanel>
      <TabPanel tab="armory" activeTab={activeTab}>
        <ArmoryView />
      </TabPanel>
      <TabPanel tab="library" activeTab={activeTab}>
        <LibraryView />
      </TabPanel>
    </>
  );
}

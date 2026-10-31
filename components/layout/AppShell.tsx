'use client';

// ==========================================
// Apex Suite: Math Lab - アプリシェル
// ==========================================
// 5大タブはレイアウトに常駐させる。検索パラメータの更新や
// ワークスペースへの往復で page が差し替わっても、タブ本体は破棄しない。

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import WelcomeAuthView from '@/components/auth/WelcomeAuthView';
import { useMainTab } from '@/components/layout/MainTabProvider';
import PersistentTabView from '@/components/layout/PersistentTabView';
import { useAuthSession } from '@/lib/auth/useAuthSession';
import { useUserStore } from '@/lib/store/userStore';

const GUEST_DEMO_WORKSPACE_HREF =
  '/workspace?unitId=math-1a-numbers-and-expressions&subtopicId=st-num-expand&patternId=sp-num-expand-t3&difficulty=3&source=guest-demo';

export default function AppShell() {
  const router = useRouter();
  const { onShell, activeTab } = useMainTab();
  const { user, ready } = useAuthSession();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isGuestDemo = useUserStore((state) => state.isGuestDemo);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const startGuestDemo = useUserStore((state) => state.startGuestDemo);

  const gateReady = ready && hasHydrated;
  const canEnterApp = Boolean(user) || isGuestDemo || isDeveloper;
  const showWelcome = gateReady && !canEnterApp && onShell && activeTab === 'home';
  const shouldKeepTabs = gateReady && !showWelcome;
  const [keepTabs, setKeepTabs] = useState(false);
  if (shouldKeepTabs && !keepTabs) {
    setKeepTabs(true);
  }

  if (!gateReady) {
    if (!onShell) return null;
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">読み込み中...</p>
      </main>
    );
  }

  const shellVisible = onShell && !showWelcome;

  return (
    <>
      {showWelcome && (
        <WelcomeAuthView
          onStartGuestDemo={() => {
            startGuestDemo();
            router.push(GUEST_DEMO_WORKSPACE_HREF);
          }}
        />
      )}
      {keepTabs && (
        <div className={shellVisible ? 'block' : 'hidden'} inert={shellVisible ? undefined : true} aria-hidden={shellVisible ? undefined : true}>
          <PersistentTabView />
        </div>
      )}
    </>
  );
}

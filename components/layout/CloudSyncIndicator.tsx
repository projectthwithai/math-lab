'use client';

// ==========================================
// Apex Suite: Math Lab - Cloud sync indicator
// ==========================================
// ログイン中のみ、アカウント横に控えめな同期状態を出す。

import { CloudCheck, Loader2 } from 'lucide-react';

import { useAuthSession } from '@/lib/auth/useAuthSession';
import { useCloudSyncStore } from '@/lib/store/cloudSyncStore';

export default function CloudSyncIndicator() {
  const { isAuthenticated: sessionAuth } = useAuthSession();
  const storeAuth = useCloudSyncStore((state) => state.isAuthenticated);
  const status = useCloudSyncStore((state) => state.status);
  const lastSyncedAt = useCloudSyncStore((state) => state.lastSyncedAt);

  const isAuthenticated = sessionAuth || storeAuth;
  if (!isAuthenticated) return null;

  const isSyncing = status !== 'synced';

  const syncedLabel = lastSyncedAt
    ? `同期完了 ${new Date(lastSyncedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
    : '同期完了';

  if (isSyncing) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-700 dark:text-cyan-200"
        title="クラウドへ保存中"
        aria-label="クラウドへ保存中"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/45 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
      title={syncedLabel}
      aria-label="同期完了"
    >
      <CloudCheck className="h-3.5 w-3.5" />
    </span>
  );
}

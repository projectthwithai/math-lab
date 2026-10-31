'use client';

// ==========================================
// Apex Suite: Math Lab - Cloud sync indicator
// ==========================================
// ログイン中のみ、アカウント横に控えめな同期状態を出す。

import { CloudCheck, CloudOff, Loader2 } from 'lucide-react';

import { useAuthSession } from '@/lib/auth/useAuthSession';
import { useCloudSyncStore } from '@/lib/store/cloudSyncStore';

export default function CloudSyncIndicator() {
  const { isAuthenticated: sessionAuth } = useAuthSession();
  const storeAuth = useCloudSyncStore((state) => state.isAuthenticated);
  const status = useCloudSyncStore((state) => state.status);
  const lastSyncedAt = useCloudSyncStore((state) => state.lastSyncedAt);
  const errorMessage = useCloudSyncStore((state) => state.errorMessage);

  const isAuthenticated = sessionAuth || storeAuth;
  if (!isAuthenticated) return null;

  const effectiveStatus = status === 'local' ? 'syncing' : status;

  const syncedLabel = lastSyncedAt
    ? `クラウドに保存済み ${new Date(lastSyncedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
    : 'クラウドに保存済み';

  if (effectiveStatus === 'syncing') {
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

  if (effectiveStatus === 'error') {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-200"
        title={errorMessage ? `クラウド同期エラー: ${errorMessage}` : 'クラウド同期エラー'}
        aria-label="クラウド同期エラー"
      >
        <CloudOff className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200"
      title={syncedLabel}
      aria-label="クラウドに保存済み"
    >
      <CloudCheck className="h-3.5 w-3.5" />
    </span>
  );
}

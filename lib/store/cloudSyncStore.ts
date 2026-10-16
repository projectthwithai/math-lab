// ==========================================
// Apex Suite: Math Lab - Cloud sync status
// ==========================================
// ヘッダーの接続インジケーター用。学習データ自体は持たない。

import { create } from 'zustand';

export type CloudSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

interface CloudSyncState {
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  setLocal: () => void;
  setSyncing: () => void;
  setSynced: () => void;
  setError: (message: string) => void;
}

export const useCloudSyncStore = create<CloudSyncState>((set) => ({
  status: 'local',
  lastSyncedAt: null,
  errorMessage: null,
  isAuthenticated: false,
  setAuthenticated: (value) =>
    set((state) => ({
      isAuthenticated: value,
      status: value ? state.status : 'local',
      errorMessage: value ? state.errorMessage : null,
    })),
  setLocal: () => set({ status: 'local', isAuthenticated: false, errorMessage: null }),
  setSyncing: () => set({ status: 'syncing', errorMessage: null }),
  setSynced: () =>
    set({
      status: 'synced',
      lastSyncedAt: new Date().toISOString(),
      errorMessage: null,
    }),
  setError: (message) => set({ status: 'error', errorMessage: message }),
}));

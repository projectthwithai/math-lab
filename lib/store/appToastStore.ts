// ==========================================
// Apex Suite: Math Lab - App Toast
// ==========================================
// ファイル追加などの短い完了通知。永続化しない。

import { create } from 'zustand';

interface AppToastState {
  message: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppToastStore = create<AppToastState>((set) => ({
  message: null,
  showToast: (message) => set({ message: message.trim() || null }),
  clearToast: () => set({ message: null }),
}));

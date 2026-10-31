// ==========================================
// Apex Suite: Math Lab - App Toast
// ==========================================
// ファイル追加などの短い完了通知。永続化しない。

import { create } from 'zustand';

export type AppToastTone = 'success' | 'error';

interface AppToastState {
  message: string | null;
  tone: AppToastTone;
  showToast: (message: string, tone?: AppToastTone) => void;
  clearToast: () => void;
}

export const useAppToastStore = create<AppToastState>((set) => ({
  message: null,
  tone: 'success',
  showToast: (message, tone = 'success') => set({ message: message.trim() || null, tone }),
  clearToast: () => set({ message: null, tone: 'success' }),
}));

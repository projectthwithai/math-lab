// ==========================================
// Apex Suite: Math Lab - Progress dirty signal
// ==========================================
// Zustand 外（解法ノート等）の変更を authSync に伝える。
// authSync を直接 import しないことで循環参照を避ける。

type Listener = () => void;

const listeners = new Set<Listener>();

export function onProgressDirty(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markProgressDirty(): void {
  listeners.forEach((listener) => listener());
}

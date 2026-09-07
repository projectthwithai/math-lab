// ==========================================
// Apex Suite: Math Lab - Pending Workspace Problem
// ==========================================
// ホームの即時バー / 画像解析モーダルから Workspace へ
// 完成済み問題JSONを渡すための sessionStorage。

import type { GeneratedProblem } from '@/types/mathLab';

const STORAGE_KEY = 'math-lab:pending-workspace-problem';

export function setPendingWorkspaceProblem(problem: GeneratedProblem): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(problem));
}

export function consumePendingWorkspaceProblem(): GeneratedProblem | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeneratedProblem;
    if (!parsed || typeof parsed.questionText !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

// ==========================================
// Apex Suite: Math Lab - Pattern Strategy Store
// ==========================================
// パターン図鑑の「✍️ 自分流のコツ・解き方に書き換える」機能のための
// LocalStorage永続化。ユーザーが上書きした`strategyText`のみを保存し、
// 元の公式解説（`data/patternsData.ts`）とは分離して管理する。

import { markProgressDirty } from '@/lib/supabase/progressDirty';

const STORAGE_KEY = 'math-lab:pattern-strategy-overrides';

export interface PatternOverride {
  patternId: string;
  customStrategyText: string;
  updatedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readAllOverrides(): Record<string, PatternOverride> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PatternOverride>;
  } catch (error) {
    console.error('[patternStrategyStore] 読み込みに失敗しました', error);
    return {};
  }
}

function writeAllOverrides(overrides: Record<string, PatternOverride>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('[patternStrategyStore] 保存に失敗しました', error);
  }
}

export function getAllPatternOverrides(): Record<string, PatternOverride> {
  return readAllOverrides();
}

export function replaceAllPatternOverrides(overrides: Record<string, PatternOverride>): void {
  writeAllOverrides(overrides ?? {});
}

export function getPatternOverride(patternId: string): PatternOverride | null {
  return readAllOverrides()[patternId] ?? null;
}

export function saveCustomStrategyText(patternId: string, text: string): PatternOverride {
  const overrides = readAllOverrides();
  const override: PatternOverride = {
    patternId,
    customStrategyText: text,
    updatedAt: new Date().toISOString(),
  };
  overrides[patternId] = override;
  writeAllOverrides(overrides);
  markProgressDirty();
  return override;
}

export function resetCustomStrategyText(patternId: string): void {
  const overrides = readAllOverrides();
  delete overrides[patternId];
  writeAllOverrides(overrides);
  markProgressDirty();
}

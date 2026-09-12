// ==========================================
// Apex Suite: Math Lab - Anti-Abuse Device Lock
// ==========================================
// 同一端末・同一ブラウザ（LocalStorage / Cookie）での
// 無料初期 Energy (100) の日次二重付与を防ぐ。
// アカウントを切り替えても、本日すでに付与済みなら新しい 100 は出さない。
// 開発者アカウント（isDeveloper）はこの制限を完全バイパスする。

import { applyDailyEnergyRefill, DEFAULT_MAX_ENERGY } from '@/lib/engine/energyCosts';

export const DEVICE_ENERGY_GRANT_DATE_KEY = 'device_energy_grant_date';
export const DEVICE_ENERGY_REMAINING_KEY = 'device_energy_remaining';
export const DEVICE_ENERGY_GRANT_SUBJECT_KEY = 'device_energy_grant_subject';

const ANONYMOUS_SUBJECT = 'anonymous';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 48;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getDeviceTodayISODate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export interface DeviceEnergyGrantRecord {
  grantDate: string | null;
  remaining: number | null;
  subject: string | null;
}

export interface ResolveDeviceEnergyInput {
  energy: number;
  lastEnergyRefillDateISO: string | null;
  maxEnergy?: number;
  isDeveloper?: boolean;
  userId?: string | null;
  today?: string;
}

export interface ResolveDeviceEnergyResult {
  energy: number;
  lastEnergyRefillDateISO: string | null;
  didGrantFreeEnergy: boolean;
}

function canUseDom(): boolean {
  return typeof window !== 'undefined';
}

function readCookie(name: string): string | null {
  if (!canUseDom()) return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (!canUseDom()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function readStorage(key: string): string | null {
  if (!canUseDom()) return null;
  try {
    const fromLocal = window.localStorage.getItem(key);
    if (fromLocal != null && fromLocal.length > 0) return fromLocal;
  } catch {
    // localStorage が使えない環境では Cookie のみ
  }
  return readCookie(key);
}

function writeStorage(key: string, value: string): void {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
  writeCookie(key, value);
}

function parseRemaining(raw: string | null): number | null {
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, value);
}

function normalizeSubject(userId?: string | null): string {
  const trimmed = typeof userId === 'string' ? userId.trim() : '';
  return trimmed.length > 0 ? trimmed : ANONYMOUS_SUBJECT;
}

export function readDeviceEnergyGrant(): DeviceEnergyGrantRecord {
  return {
    grantDate: readStorage(DEVICE_ENERGY_GRANT_DATE_KEY),
    remaining: parseRemaining(readStorage(DEVICE_ENERGY_REMAINING_KEY)),
    subject: readStorage(DEVICE_ENERGY_GRANT_SUBJECT_KEY),
  };
}

export function writeDeviceEnergyGrant(grantDate: string, remaining: number, subject?: string | null): void {
  const safeRemaining = Math.max(0, Number.isFinite(remaining) ? remaining : 0);
  writeStorage(DEVICE_ENERGY_GRANT_DATE_KEY, grantDate);
  writeStorage(DEVICE_ENERGY_REMAINING_KEY, String(safeRemaining));
  writeStorage(DEVICE_ENERGY_GRANT_SUBJECT_KEY, normalizeSubject(subject));
}

/** 消費・回復後に、本日分の端末残り Energy を同期する */
export function syncDeviceEnergyRemaining(remaining: number, userId?: string | null): void {
  const today = getDeviceTodayISODate();
  const lock = readDeviceEnergyGrant();
  if (lock.grantDate !== today) return;
  writeDeviceEnergyGrant(today, remaining, userId ?? lock.subject);
}

/**
 * 日次の無料 Energy 付与を端末ロック付きで解決する。
 * - 開発者: 制限なし（記録も更新しない）
 * - この端末で本日未付与: 通常リフィルし、日付と残りを記録
 * - この端末で本日付与済み + 別アカウント: 二重の 100 は出さず、残り Energy を引き継ぐ
 */
export function resolveDeviceLockedDailyEnergy(
  input: ResolveDeviceEnergyInput
): ResolveDeviceEnergyResult {
  const today = input.today ?? getDeviceTodayISODate();
  const maxEnergy = input.maxEnergy ?? DEFAULT_MAX_ENERGY;
  const currentEnergy = Number.isFinite(input.energy) ? input.energy : 0;
  const lastRefill = input.lastEnergyRefillDateISO;
  const subject = normalizeSubject(input.userId);

  if (input.isDeveloper) {
    return {
      energy: currentEnergy,
      lastEnergyRefillDateISO: lastRefill,
      didGrantFreeEnergy: false,
    };
  }

  const lock = readDeviceEnergyGrant();
  const deviceGrantedToday = lock.grantDate === today;
  const sameSubject = deviceGrantedToday && normalizeSubject(lock.subject) === subject;

  if (lastRefill === today) {
    if (!deviceGrantedToday) {
      writeDeviceEnergyGrant(today, currentEnergy, subject);
    } else if (sameSubject) {
      writeDeviceEnergyGrant(today, currentEnergy, subject);
    }
    return {
      energy: currentEnergy,
      lastEnergyRefillDateISO: today,
      didGrantFreeEnergy: false,
    };
  }

  if (deviceGrantedToday) {
    const inherited = Math.max(0, lock.remaining ?? 0);
    writeDeviceEnergyGrant(today, inherited, subject);
    return {
      energy: inherited,
      lastEnergyRefillDateISO: today,
      didGrantFreeEnergy: false,
    };
  }

  const granted = applyDailyEnergyRefill(currentEnergy, maxEnergy);
  writeDeviceEnergyGrant(today, granted, subject);
  return {
    energy: granted,
    lastEnergyRefillDateISO: today,
    didGrantFreeEnergy: granted !== currentEnergy || lastRefill !== today,
  };
}

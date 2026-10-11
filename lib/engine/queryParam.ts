// ==========================================
// Apex Suite: Math Lab - Query param helpers
// ==========================================
// Next.js の searchParams は string | string[] になり得る。先頭の非空値を使う。

export function firstQueryValue(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) return item.trim();
    }
  }
  return undefined;
}

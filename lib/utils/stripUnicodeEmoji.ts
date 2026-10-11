// ==========================================
// Apex Suite: Math Lab - Unicode emoji sanitizer
// ==========================================
// ユーザー向け文言から絵文字を除去する。難易度の ★ と階層の ➔ は残す。

const KEEP_SYMBOLS = new Set(['★', '☆', '➔']);

const EMOJI_SEQUENCE_RE =
  /\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*/gu;

export function stripUnicodeEmoji(text: string): string {
  if (!text) return text;
  return text
    .replace(EMOJI_SEQUENCE_RE, (match) => (KEEP_SYMBOLS.has(match) ? match : ''))
    .replace(/[\uFE0F\u200D\u20E3]/g, '')
    .replace(/^[ \t]+/, '')
    .replace(/[ \t]{2,}/g, ' ');
}

export function stripUnicodeEmojiDeep<T>(value: T): T {
  if (typeof value === 'string') return stripUnicodeEmoji(value) as T;
  if (Array.isArray(value)) return value.map((item) => stripUnicodeEmojiDeep(item)) as T;
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      next[key] = stripUnicodeEmojiDeep(child);
    }
    return next as T;
  }
  return value;
}

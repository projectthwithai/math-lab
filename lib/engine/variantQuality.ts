// ==========================================
// Apex Suite: Math Lab - Exam variant quality gate
// ==========================================
// 会話の着せ替え・作問メタ文が問題文に混入した生成を破棄する。

const BANNED_META_PHRASES = [
  '見た目は日常の記録だが',
  '使う式は同じである',
  '同じ手順で',
  '解法は変えずに',
  '授業でやったあの手順',
  '太郎「',
  '花子「',
  '太郎：「',
  '花子：「',
  '太郎さんと花子',
  '解法パターン「',
  '（解法パターン',
  'カモフラージュ',
  '変装・',
  '変装:',
  'この設定、授業で',
  '数字だけ丁寧に追おう',
];

export function containsBannedVariantMeta(text: string): boolean {
  if (!text.trim()) return true;
  if (/太郎/.test(text) && /花子/.test(text)) return true;
  return BANNED_META_PHRASES.some((phrase) => text.includes(phrase));
}

export function isExamQualityVariantText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;
  if (containsBannedVariantMeta(trimmed)) return false;
  return true;
}

/** 過去に保存された着せ替え文を表示前に除去する。新規生成は API 側で棄却する。 */
export function stripBannedVariantMeta(text: string): string {
  const cleaned = text
    .replace(/次の会話を読んで、空欄に当てはまる値を求めよ。/g, '')
    .replace(/太郎さんと花子さん[^\n]*\n?/g, '')
    .replace(/太郎[：:]「[^」]*」/g, '')
    .replace(/花子[：:]「[^」]*」/g, '')
    .replace(/太郎「[^」]*」/g, '')
    .replace(/花子「[^」]*」/g, '')
    .replace(/実験ノートに次の記録が残っている。見た目は日常の記録だが、使う式は同じである。値を求めよ。/g, '')
    .replace(/座標平面上を点 P が動く。次の関係が成り立つとき、同じ手順で値を求めよ。/g, '')
    .replace(/（解法パターン「[^」]*」）/g, '')
    .replace(/次の問題を、解法パターン「[^」]*」と同じ手順で解け。/g, '')
    .replace(/見た目は日常の記録だが[^\n。]*[。\n]?/g, '')
    .replace(/使う式は同じである[^\n。]*[。\n]?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || text.trim();
}

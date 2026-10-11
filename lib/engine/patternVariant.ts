// ==========================================
// Apex Suite: Math Lab - Pattern variant labels
// ==========================================
// 図鑑カードのタブ表示と、新バリエーション解析の保存ラベルを揃える。

export const BASE_VARIANT_STYLE_LABEL = '基本数式';

export const EXAM_THEME_LABELS = [
  '不等式証明',
  '整数の倍数',
  '漸化式融合',
  '離散・分割',
  '別テーマ入試',
] as const;

export function buildVariantTabLabel(index: number, styleLabel: string): string {
  return `バリエーション ${index} (${styleLabel})`;
}

export function pickExamThemeLabel(existingCount = 0): string {
  return EXAM_THEME_LABELS[existingCount % EXAM_THEME_LABELS.length];
}

export function normalizeThemeLabel(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().replace(/^変装[・:]/, '').trim();
  if (!trimmed) return fallback;
  if (/日常会話|共通テスト風|図形文章|動点幾何|カモフラージュ/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

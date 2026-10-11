// ==========================================
// Apex Suite: Math Lab - Pattern variant labels
// ==========================================
// 図鑑カードのタブ表示と、新バリエーション解析の保存ラベルを揃える。

export const BASE_VARIANT_STYLE_LABEL = '基本数式';

export const CAMOUFLAGE_STYLE_LABELS = [
  '図形文章',
  '共通テスト風',
  '日常会話',
  '動点幾何',
  '純粋数式の別表現',
] as const;

export type CamouflageStyleLabel = (typeof CAMOUFLAGE_STYLE_LABELS)[number] | string;

export function buildVariantTabLabel(index: number, styleLabel: string): string {
  return `バリエーション ${index} (${styleLabel})`;
}

export function pickCamouflageStyleLabel(existingCount = 0): string {
  return CAMOUFLAGE_STYLE_LABELS[existingCount % CAMOUFLAGE_STYLE_LABELS.length];
}

export function normalizeCamouflageStyleLabel(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

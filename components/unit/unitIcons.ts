// ==========================================
// Apex Suite: Math Lab - Unit Icon Map
// ==========================================
// `data/unitsData.ts` の `iconName` 文字列を、実際の lucide-react
// アイコンコンポーネントに解決するためのマップ。
// 文字列キー経由でアイコンを動的に切り替える箇所（UnitSelectionGrid等）で使う。

import {
  Radical,
  FunctionSquare,
  Triangle,
  BarChart3,
  Dice5,
  Waves,
  TrendingUp,
  LineChart,
  Layers,
  Binary,
  Move3d,
  Infinity as InfinityIcon,
  Orbit,
  Thermometer,
  Zap,
  CircleDot,
  FlaskConical,
  TestTube,
  Sparkles,
  Shapes,
  type LucideIcon,
} from 'lucide-react';

export const UNIT_ICON_MAP: Record<string, LucideIcon> = {
  Radical,
  FunctionSquare,
  Triangle,
  BarChart3,
  Dice5,
  Waves,
  TrendingUp,
  LineChart,
  Layers,
  Binary,
  Move3d,
  Infinity: InfinityIcon,
  Orbit,
  Thermometer,
  Zap,
  CircleDot,
  FlaskConical,
  TestTube,
  Sparkles,
};

/** マップに存在しないキーが来た場合はデフォルトアイコン(Shapes)を返す */
export function getUnitIcon(iconName: string): LucideIcon {
  return UNIT_ICON_MAP[iconName] ?? Shapes;
}

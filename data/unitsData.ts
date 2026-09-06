// ==========================================
// Apex Suite: Math Lab - Units Master Data
// ==========================================
// 高校数学（数I / 数A / 数II / 数B / 数III / 数C）・物理・化学の
// 全単元マスターデータ（34単元）。

import type { Subject } from '@/types/mathLab';

export type UnitCategory = '数I' | '数A' | '数II' | '数B' | '数III' | '数C' | '物理' | '化学';

export type RecommendedGrade = '高1' | '高2' | '高3';

export interface UnitInfo {
  id: string;
  subject: Subject;
  category: UnitCategory;
  title: string;
  description: string;
  /** lucide-react のアイコン名（`components/unit/unitIcons.ts` の UNIT_ICON_MAP のキー） */
  iconName: string;
  recommendedGrade: RecommendedGrade;
  patternCount: number;
}

export const UNIT_CATEGORIES: UnitCategory[] = ['数I', '数A', '数II', '数B', '数III', '数C', '物理', '化学'];

export const UNITS_DATA: UnitInfo[] = [
  // ============================================================
  // 数I
  // ============================================================
  {
    id: 'math-1a-numbers-and-expressions',
    subject: 'math',
    category: '数I',
    title: '数と式',
    description: '展開・因数分解、絶対値、1次不等式など数と式の基本操作。',
    iconName: 'Radical',
    recommendedGrade: '高1',
    patternCount: 6,
  },
  {
    id: 'math-1a-quadratic-functions',
    subject: 'math',
    category: '数I',
    title: '2次関数',
    description: '平方完成・グラフの移動・最大最小・判別式の応用。',
    iconName: 'FunctionSquare',
    recommendedGrade: '高1',
    patternCount: 6,
  },
  {
    id: 'math-1a-trigonometric-ratios',
    subject: 'math',
    category: '数I',
    title: '図形と計量（三角比）',
    description: '三角比の定義、正弦定理・余弦定理、図形への応用。',
    iconName: 'Triangle',
    recommendedGrade: '高1',
    patternCount: 4,
  },
  {
    id: 'math-1a-data-analysis',
    subject: 'math',
    category: '数I',
    title: 'データの分析',
    description: '分散・標準偏差・相関係数、四分位数と箱ひげ図。',
    iconName: 'BarChart3',
    recommendedGrade: '高1',
    patternCount: 3,
  },

  // ============================================================
  // 数A
  // ============================================================
  {
    id: 'math-1a-combinatorics-probability',
    subject: 'math',
    category: '数A',
    title: '場合の数と確率',
    description: '順列・組合せ、条件付き確率、期待値。',
    iconName: 'Dice5',
    recommendedGrade: '高1',
    patternCount: 4,
  },
  {
    id: 'mathA-plane-geometry',
    subject: 'math',
    category: '数A',
    title: '図形の性質',
    description: '角の二等分線定理、方べきの定理、円周角の定理などの平面図形の性質。',
    iconName: 'Compass',
    recommendedGrade: '高1',
    patternCount: 3,
  },
  {
    id: 'mathA-integers',
    subject: 'math',
    category: '数A',
    title: '整数の性質',
    description: '約数・倍数、ユークリッドの互除法、不定方程式、n進法。',
    iconName: 'Hash',
    recommendedGrade: '高1',
    patternCount: 3,
  },

  // ============================================================
  // 数II
  // ============================================================
  {
    id: 'math2-expressions-and-proof',
    subject: 'math',
    category: '数II',
    title: 'いろいろな式（式と証明・複素数と方程式）',
    description: '剰余の定理・因数定理、二項定理、複素数と2次方程式の解。',
    iconName: 'GitBranch',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'math2-coordinate-geometry',
    subject: 'math',
    category: '数II',
    title: '図形と方程式',
    description: '点と直線の距離、円の方程式、軌跡と領域。',
    iconName: 'Ruler',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'math-2bc-trigonometric-functions',
    subject: 'math',
    category: '数II',
    title: '三角関数',
    description: '加法定理・三角関数の合成、グラフと方程式・不等式。',
    iconName: 'Waves',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'math-2bc-exponential-logarithmic',
    subject: 'math',
    category: '数II',
    title: '指数関数・対数関数',
    description: '指数・対数の性質、方程式・不等式、常用対数の応用。',
    iconName: 'TrendingUp',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'math-2bc-differentiation',
    subject: 'math',
    category: '数II',
    title: '微分法（数II）',
    description: '導関数・接線・極値、グラフの応用。',
    iconName: 'LineChart',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'math-2bc-integration',
    subject: 'math',
    category: '数II',
    title: '積分法（数II）',
    description: '不定積分・定積分、面積の計算。',
    iconName: 'Layers',
    recommendedGrade: '高2',
    patternCount: 3,
  },

  // ============================================================
  // 数B
  // ============================================================
  {
    id: 'math-2bc-sequences',
    subject: 'math',
    category: '数B',
    title: '数列',
    description: '等差・等比数列、漸化式、数学的帰納法。',
    iconName: 'Binary',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'mathB-statistics',
    subject: 'math',
    category: '数B',
    title: '統計的な推測',
    description: '二項分布、正規分布、期待値と分散、区間推定。',
    iconName: 'PieChart',
    recommendedGrade: '高2',
    patternCount: 3,
  },

  // ============================================================
  // 数III
  // ============================================================
  {
    id: 'math-3-limits',
    subject: 'math',
    category: '数III',
    title: '極限',
    description: '数列・関数の極限、無限級数。',
    iconName: 'Infinity',
    recommendedGrade: '高3',
    patternCount: 2,
  },
  {
    id: 'math-3-differentiation',
    subject: 'math',
    category: '数III',
    title: '微分法（数III）',
    description: '合成関数・逆関数・様々な関数の導関数、応用。',
    iconName: 'FunctionSquare',
    recommendedGrade: '高3',
    patternCount: 3,
  },
  {
    id: 'math-3-integration',
    subject: 'math',
    category: '数III',
    title: '積分法（数III）',
    description: '置換積分・部分積分、面積・体積、微分方程式。',
    iconName: 'Layers',
    recommendedGrade: '高3',
    patternCount: 3,
  },
  {
    id: 'math3-parametric-polar',
    subject: 'math',
    category: '数III',
    title: '曲線の媒介変数表示・極座標',
    description: '媒介変数表示された曲線の微分、極座標と極方程式。',
    iconName: 'Spline',
    recommendedGrade: '高3',
    patternCount: 2,
  },

  // ============================================================
  // 数C
  // ============================================================
  {
    id: 'math-2bc-vectors',
    subject: 'math',
    category: '数C',
    title: 'ベクトル',
    description: '平面・空間ベクトルの演算と図形への応用。',
    iconName: 'Move3d',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'mathC-complex-plane-conics',
    subject: 'math',
    category: '数C',
    title: '複素数平面・2次曲線',
    description: '複素数の極形式・ド・モアブルの定理、楕円・双曲線・放物線。',
    iconName: 'Atom',
    recommendedGrade: '高3',
    patternCount: 3,
  },

  // ============================================================
  // 物理
  // ============================================================
  {
    id: 'physics-mechanics',
    subject: 'physics',
    category: '物理',
    title: '力学',
    description: '運動の法則、仕事とエネルギー、運動量保存。',
    iconName: 'Orbit',
    recommendedGrade: '高2',
    patternCount: 6,
  },
  {
    id: 'physics-thermodynamics',
    subject: 'physics',
    category: '物理',
    title: '熱力学',
    description: '気体の法則、熱力学第一法則、分子運動論。',
    iconName: 'Thermometer',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'physics-waves',
    subject: 'physics',
    category: '物理',
    title: '波動',
    description: '波の性質、音波、光の干渉と回折。',
    iconName: 'Waves',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'physics-electromagnetism',
    subject: 'physics',
    category: '物理',
    title: '電磁気',
    description: '電場・磁場、電磁誘導、交流回路。',
    iconName: 'Zap',
    recommendedGrade: '高3',
    patternCount: 4,
  },
  {
    id: 'physics-atomic',
    subject: 'physics',
    category: '物理',
    title: '原子',
    description: '放射性崩壊、半減期、光電効果、原子核反応。',
    iconName: 'Magnet',
    recommendedGrade: '高3',
    patternCount: 2,
  },

  // ============================================================
  // 化学
  // ============================================================
  {
    id: 'chemistry-composition',
    subject: 'chemistry',
    category: '化学',
    title: '物質の構成',
    description: '原子の構造、化学結合、物質量（モル計算）。',
    iconName: 'CircleDot',
    recommendedGrade: '高1',
    patternCount: 4,
  },
  {
    id: 'chemistry-reactions',
    subject: 'chemistry',
    category: '化学',
    title: '物質の変化（理論化学）',
    description: '化学反応式、気体の法則、化学反応の量的関係。',
    iconName: 'FlaskConical',
    recommendedGrade: '高2',
    patternCount: 4,
  },
  {
    id: 'chemistry-acid-base',
    subject: 'chemistry',
    category: '化学',
    title: '酸と塩基・中和',
    description: '酸・塩基の定義、pH、中和滴定の量的関係。',
    iconName: 'TestTube',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'chemistry-redox',
    subject: 'chemistry',
    category: '化学',
    title: '酸化還元反応',
    description: '酸化数、酸化剤・還元剤、電池と電気分解。',
    iconName: 'Beaker',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'chemistry-equilibrium',
    subject: 'chemistry',
    category: '化学',
    title: '化学平衡',
    description: '可逆反応と平衡定数、ルシャトリエの原理、電離平衡。',
    iconName: 'FlaskConical',
    recommendedGrade: '高3',
    patternCount: 3,
  },
  {
    id: 'chemistry-inorganic',
    subject: 'chemistry',
    category: '化学',
    title: '無機化学',
    description: '金属・非金属元素の性質と反応、工業的製法。',
    iconName: 'TestTube',
    recommendedGrade: '高2',
    patternCount: 3,
  },
  {
    id: 'chemistry-organic',
    subject: 'chemistry',
    category: '化学',
    title: '有機化学',
    description: '炭化水素、官能基、異性体、反応経路の推定。',
    iconName: 'Sparkles',
    recommendedGrade: '高3',
    patternCount: 3,
  },
  {
    id: 'chemistry-polymer',
    subject: 'chemistry',
    category: '化学',
    title: '高分子化合物',
    description: '合成高分子と天然高分子、重合度と分子量の計算。',
    iconName: 'Shapes',
    recommendedGrade: '高3',
    patternCount: 2,
  },
];

// ------------------------------------------
// ヘルパー関数
// ------------------------------------------

export function getUnitsByCategory(category: UnitCategory): UnitInfo[] {
  return UNITS_DATA.filter((unit) => unit.category === category);
}

export function getUnitById(unitId: string): UnitInfo | undefined {
  return UNITS_DATA.find((unit) => unit.id === unitId);
}

export function getSubjectForCategory(category: UnitCategory): Subject {
  switch (category) {
    case '数I':
    case '数A':
    case '数II':
    case '数B':
    case '数III':
    case '数C':
      return 'math';
    case '物理':
      return 'physics';
    case '化学':
      return 'chemistry';
  }
}

// ==========================================
// Apex Suite: Math Lab - Subtopic Catalog
// ==========================================
// 単元 ➔ サブトピック ➔ 入試解法パターン の中間層。
// 高校教科書の章立てに沿って定義する。

import type { SubtopicItem, SolutionPattern } from '@/types/mathLab';

function st(
  unitId: string,
  slug: string,
  title: string,
  description: string,
  difficulty: number,
  order: number,
  hints: string[] = []
): SubtopicItem & { hints: string[] } {
  return {
    id: `st-${slug}`,
    unitId,
    title,
    description,
    difficulty,
    order,
    hints,
  };
}

const RAW_SUBTOPICS: Array<SubtopicItem & { hints: string[] }> = [
  // 数と式
  st('math-1a-numbers-and-expressions', 'num-expand', '多項式の展開', '分配法則と公式で展開する。', 1, 1, ['展開']),
  st('math-1a-numbers-and-expressions', 'num-factor', '因数分解', '共通因数・公式・たすき掛け。', 2, 2, ['因数分解', 'たすき']),
  st('math-1a-numbers-and-expressions', 'num-abs', '絶対値', '場合分けで外す方程式・不等式。', 3, 3, ['絶対値']),
  st('math-1a-numbers-and-expressions', 'num-ineq', '1次不等式', '移項と数直線への図示。', 2, 4, ['不等式']),
  st('math-1a-numbers-and-expressions', 'num-set', '集合と命題', 'かつ・または、対偶、必要条件。', 3, 5, ['集合', '命題']),

  // 2次関数
  st('math-1a-quadratic-functions', 'quad-complete', '平方完成とグラフ', '頂点・軸を求めて移動する。', 2, 1, ['平方完成', '頂点', '決定']),
  st('math-1a-quadratic-functions', 'quad-minmax-axis', '軸が動く最大・最小', '定義域固定・軸が文字。', 4, 2, ['軸が動', '最大', '最小']),
  st('math-1a-quadratic-functions', 'quad-minmax-range', '範囲が動く最大・最小', '軸固定・区間が動く。', 4, 3, ['範囲が動', '定義域']),
  st('math-1a-quadratic-functions', 'quad-disc', '判別式と共有点', 'D で解の個数・接する条件。', 3, 4, ['判別', '共有']),
  st('math-1a-quadratic-functions', 'quad-ineq', '2次不等式', '符号表と放物線の上下。', 3, 5, ['2次不等式', '符号']),

  // 図形と計量
  st('math-1a-trigonometric-ratios', 'trig-def', '三角比の定義', '直角三角形での sin, cos, tan。', 1, 1, ['定義']),
  st('math-1a-trigonometric-ratios', 'trig-famous', '有名角の三角比', '30°, 45°, 60° の値。', 1, 2, ['有名角', '30', '45']),
  st('math-1a-trigonometric-ratios', 'trig-extend', '三角比の拡張', '鈍角まで座標で拡張する。', 3, 3, ['拡張', '鈍角']),
  st('math-1a-trigonometric-ratios', 'trig-ident', '三角比の相互関係', 'sin²+cos²=1 など。', 2, 4, ['相互', 'sin', 'cos']),
  st('math-1a-trigonometric-ratios', 'trig-sine', '正弦定理', 'a/sinA = 2R。', 3, 5, ['正弦']),
  st('math-1a-trigonometric-ratios', 'trig-cosine', '余弦定理', '2辺夾角・3辺から角。', 3, 6, ['余弦']),

  // データの分析
  st('math-1a-data-analysis', 'data-mean', '平均値・中央値', '代表値の使い分け。', 1, 1, ['平均', '中央']),
  st('math-1a-data-analysis', 'data-var', '分散・標準偏差', '散らばりの指標。', 2, 2, ['分散', '標準偏差']),
  st('math-1a-data-analysis', 'data-corr', '相関係数と散布図', '共分散から r を出す。', 3, 3, ['相関', '散布']),
  st('math-1a-data-analysis', 'data-box', '四分位数と箱ひげ図', 'Q1, Q3, IQR。', 2, 4, ['四分', '箱ひげ']),

  // 場合の数と確率
  st('math-1a-combinatorics-probability', 'prob-perm', '順列', 'P の立式。', 2, 1, ['順列']),
  st('math-1a-combinatorics-probability', 'prob-comb', '組合せ', 'C と重複組合せ。', 2, 2, ['組合せ', '組み合わせ']),
  st('math-1a-combinatorics-probability', 'prob-basic', '確率の基本', '同様に確からしい。', 2, 3, ['確率']),
  st('math-1a-combinatorics-probability', 'prob-cond', '条件付き確率', 'ベイズ・乗法定理。', 4, 4, ['条件付き', 'ベイズ']),
  st('math-1a-combinatorics-probability', 'prob-expect', '期待値', '離散分布の平均。', 3, 5, ['期待値']),

  // 図形の性質
  st('mathA-plane-geometry', 'plane-angle', '円周角の定理', '同じ弧に対する円周角。', 2, 1, ['円周角']),
  st('mathA-plane-geometry', 'plane-power', '方べきの定理', '2弦・接弦。', 3, 2, ['方べき']),
  st('mathA-plane-geometry', 'plane-bisector', '角の二等分線定理', '辺の比に落とす。', 3, 3, ['二等分']),
  st('mathA-plane-geometry', 'plane-sim', '相似と面積比', '平行線と相似。', 3, 4, ['相似', '面積']),

  // 整数
  st('mathA-integers', 'int-div', '約数・倍数', '素因数分解。', 1, 1, ['約数', '倍数']),
  st('mathA-integers', 'int-euclid', 'ユークリッドの互除法', '最大公約数。', 2, 2, ['互除', 'gcd', '最大公約']),
  st('mathA-integers', 'int-dio', '不定方程式', 'ax+by=c の整数解。', 4, 3, ['不定', '一次不定']),
  st('mathA-integers', 'int-base', 'n進法', '進法変換。', 3, 4, ['進法', 'n進']),

  // いろいろな式
  st('math2-expressions-and-proof', 'proof-ident', '恒等式と証明', '係数比較・数値代入。', 2, 1, ['恒等', '証明']),
  st('math2-expressions-and-proof', 'proof-remainder', '剰余の定理', 'P(a) が余り。', 2, 2, ['剰余']),
  st('math2-expressions-and-proof', 'proof-factor', '因数定理', '因数分解と解。', 3, 3, ['因数定理']),
  st('math2-expressions-and-proof', 'proof-bin', '二項定理', '展開の一般項。', 3, 4, ['二項']),
  st('math2-expressions-and-proof', 'proof-complex', '複素数と方程式', '解と係数の関係。', 3, 5, ['複素数', '2次方程式']),

  // 図形と方程式
  st('math2-coordinate-geometry', 'coord-line', '直線の方程式', '点と直線の距離。', 2, 1, ['直線', '距離']),
  st('math2-coordinate-geometry', 'coord-circle', '円の方程式', '中心と半径。', 2, 2, ['円']),
  st('math2-coordinate-geometry', 'coord-locus', '軌跡', '条件を方程式に。', 4, 3, ['軌跡']),
  st('math2-coordinate-geometry', 'coord-region', '領域', '不等式の表す範囲。', 3, 4, ['領域']),

  // 三角関数
  st('math-2bc-trigonometric-functions', 'tfn-add', '加法定理', 'sin(A±B) など。', 3, 1, ['加法']),
  st('math-2bc-trigonometric-functions', 'tfn-double', '2倍角・半角', '公式の使い分け。', 3, 2, ['2倍', '半角']),
  st('math-2bc-trigonometric-functions', 'tfn-comp', '三角関数の合成', 'R sin(θ+α)。', 4, 3, ['合成']),
  st('math-2bc-trigonometric-functions', 'tfn-eq', '三角方程式・不等式', '単位円で場合分け。', 4, 4, ['方程式', '不等式']),

  // 指数対数
  st('math-2bc-exponential-logarithmic', 'exp-prop', '指数の性質', 'a^m a^n = a^{m+n}。', 2, 1, ['指数']),
  st('math-2bc-exponential-logarithmic', 'log-prop', '対数の性質', '底の変換。', 2, 2, ['対数']),
  st('math-2bc-exponential-logarithmic', 'explog-eq', '指数・対数方程式', '真数条件に注意。', 3, 3, ['方程式']),
  st('math-2bc-exponential-logarithmic', 'explog-ineq', '指数・対数不等式', '底の大小で向きが変わる。', 4, 4, ['不等式']),

  // 微分（II）
  st('math-2bc-differentiation', 'd2-def', '導関数の定義', '極限で微分する。', 2, 1, ['定義', '導関数']),
  st('math-2bc-differentiation', 'd2-tangent', '接線', '接点での傾き。', 3, 2, ['接線']),
  st('math-2bc-differentiation', 'd2-extrema', '増減と極値', 'f′=0 の符号。', 3, 3, ['極値', '増減']),
  st('math-2bc-differentiation', 'd2-graph', 'グラフの応用', '最大最小。', 4, 4, ['グラフ', '最大']),

  // 積分（II）
  st('math-2bc-integration', 'i2-indef', '不定積分', '原始関数。', 2, 1, ['不定']),
  st('math-2bc-integration', 'i2-def', '定積分', '面積の符号。', 2, 2, ['定積分']),
  st('math-2bc-integration', 'i2-area', '面積', '曲線と軸・2曲線。', 3, 3, ['面積']),
  st('math-2bc-integration', 'i2-even', '偶関数・奇関数', '対称区間の技。', 3, 4, ['偶', '奇']),

  // 数列
  st('math-2bc-sequences', 'seq-arith-term', '等差数列の一般項', 'a+(n-1)d。', 1, 1, ['等差', '一般項']),
  st('math-2bc-sequences', 'seq-arith-sum', '等差数列の和', 'S_n = n(a+l)/2。', 2, 2, ['等差', '和']),
  st('math-2bc-sequences', 'seq-geom', '等比数列', '一般項と和。', 2, 3, ['等比']),
  st('math-2bc-sequences', 'seq-sigma', 'Σの基本計算', '公式の線形性。', 2, 4, ['Σ', 'シグマ']),
  st('math-2bc-sequences', 'seq-sum-term', '数列の和と一般項', 'a_n = S_n - S_{n-1}。', 3, 5, ['和と一般', 'S_n']),
  st('math-2bc-sequences', 'seq-rec', '漸化式', '特性方程式・階差。', 4, 6, ['漸化']),
  st('math-2bc-sequences', 'seq-induct', '数学的帰納法', 'n=1 と n=k→k+1。', 4, 7, ['帰納']),

  // 統計的な推測
  st('mathB-statistics', 'stat-dist', '確率分布', '離散・連続の平均分散。', 3, 1, ['分布']),
  st('mathB-statistics', 'stat-bin', '二項分布', 'nCk p^k。', 3, 2, ['二項']),
  st('mathB-statistics', 'stat-norm', '正規分布', '標準化。', 4, 3, ['正規']),
  st('mathB-statistics', 'stat-ci', '区間推定', '母平均の推定。', 4, 4, ['推定', '区間']),

  // 極限
  st('math-3-limits', 'lim-seq', '数列の極限', '∞ の比較。', 3, 1, ['数列']),
  st('math-3-limits', 'lim-fn', '関数の極限', 'はさみうち。', 3, 2, ['関数', 'はさみ']),
  st('math-3-limits', 'lim-series', '無限級数', '等比級数。', 4, 3, ['級数']),

  // 微分 III
  st('math-3-differentiation', 'd3-chain', '合成関数の微分', '連鎖律。', 3, 1, ['合成']),
  st('math-3-differentiation', 'd3-inv', '逆関数・対数微分', '1/f′。', 4, 2, ['逆関数', '対数微分']),
  st('math-3-differentiation', 'd3-app', '微分の応用', '速度・近似。', 4, 3, ['応用', '速度']),

  // 積分 III
  st('math-3-integration', 'i3-sub', '置換積分', 't=g(x)。', 3, 1, ['置換']),
  st('math-3-integration', 'i3-parts', '部分積分', 'uv の公式。', 3, 2, ['部分']),
  st('math-3-integration', 'i3-vol', '体積・回転体', 'π y² dx。', 4, 3, ['体積', '回転']),
  st('math-3-integration', 'i3-de', '微分方程式', '変数分離。', 5, 4, ['微分方']),

  // 媒介変数・極座標
  st('math3-parametric-polar', 'param-diff', '媒介変数表示の微分', 'dy/dx = (dy/dt)/(dx/dt)。', 4, 1, ['媒介', '微分']),
  st('math3-parametric-polar', 'polar-eq', '極座標と極方程式', 'r, θ。', 4, 2, ['極座標', '極方程']),
  st('math3-parametric-polar', 'polar-area', '極座標の面積', '(1/2)∫ r² dθ。', 5, 3, ['面積']),

  // ベクトル
  st('math-2bc-vectors', 'vec-op', 'ベクトルの演算', '和・実数倍。', 2, 1, ['演算']),
  st('math-2bc-vectors', 'vec-dot', '内積', '垂直条件。', 3, 2, ['内積', '垂直']),
  st('math-2bc-vectors', 'vec-line', '直線のベクトル方程式', '位置ベクトル。', 3, 3, ['直線']),
  st('math-2bc-vectors', 'vec-space', '空間ベクトル', '平面の方程式。', 4, 4, ['空間', '平面']),

  // 複素数平面・2次曲線
  st('mathC-complex-plane-conics', 'cpx-polar', '極形式', 'ド・モアブル。', 3, 1, ['極形式', 'モアブル']),
  st('mathC-complex-plane-conics', 'cpx-geo', '複素数平面の図形', '円・直線。', 4, 2, ['複素数平面', '図形']),
  st('mathC-complex-plane-conics', 'conic-el', '楕円・双曲線・放物線', '標準形。', 4, 3, ['楕円', '双曲線', '放物線', '2次曲線']),

  // 力学
  st('physics-mechanics', 'mech-eq', '運動方程式', 'ΣF=ma。', 2, 1, ['運動方程', 'ma']),
  st('physics-mechanics', 'mech-energy', '仕事とエネルギー', '力学的エネルギー保存。', 3, 2, ['エネルギー', '仕事']),
  st('physics-mechanics', 'mech-mom', '運動量保存', '衝突。', 3, 3, ['運動量', '衝突']),
  st('physics-mechanics', 'mech-slope', '斜面と摩擦', '分解と μN。', 4, 4, ['斜面', '摩擦']),

  // 熱力学
  st('physics-thermodynamics', 'th-gas', '気体の法則', 'PV=nRT。', 2, 1, ['気体', '状態方程']),
  st('physics-thermodynamics', 'th-1st', '熱力学第一法則', 'ΔU=Q-W。', 3, 2, ['第一法則', '内部']),
  st('physics-thermodynamics', 'th-cycle', 'サイクル', 'P-V 図の面積。', 4, 3, ['サイクル', '熱機関']),
  st('physics-thermodynamics', 'th-kin', '分子運動論', '圧力と温度。', 4, 4, ['分子', '運動論']),

  // 波動
  st('physics-waves', 'wv-basic', '波の基本', 'v=fλ。', 2, 1, ['波長', '速さ']),
  st('physics-waves', 'wv-super', '干渉と回折', '経路差。', 3, 2, ['干渉', '回折']),
  st('physics-waves', 'wv-sound', '音波', 'うなり・ドップラー。', 3, 3, ['音', 'ドップラー', 'うなり']),
  st('physics-waves', 'wv-light', '光波', 'ヤングの実験。', 4, 4, ['光', 'ヤング']),

  // 電磁気
  st('physics-electromagnetism', 'em-field', '電場と電位', 'クーロン力。', 3, 1, ['電場', '電位', 'クーロン']),
  st('physics-electromagnetism', 'em-circ', '回路', 'オーム・キルヒホッフ。', 3, 2, ['回路', 'オーム']),
  st('physics-electromagnetism', 'em-mag', '磁場とローレンツ力', 'F=qvB。', 4, 3, ['磁場', 'ローレンツ']),
  st('physics-electromagnetism', 'em-ind', '電磁誘導', 'ファラデー。', 4, 4, ['誘導', 'ファラデー']),

  // 原子
  st('physics-atomic', 'at-decay', '放射性崩壊', '半減期。', 3, 1, ['崩壊', '半減期']),
  st('physics-atomic', 'at-photo', '光電効果', 'アインシュタインの式。', 4, 2, ['光電']),
  st('physics-atomic', 'at-nucleus', '原子核反応', '質量欠損。', 4, 3, ['核', '欠損']),

  // 物質の構成
  st('chemistry-composition', 'chem-atom', '原子の構造', '電子配置。', 1, 1, ['原子']),
  st('chemistry-composition', 'chem-bond', '化学結合', 'イオン・共有。', 2, 2, ['結合']),
  st('chemistry-composition', 'chem-mole', '物質量', 'モル計算。', 2, 3, ['モル', '物質量']),

  // 物質の変化
  st('chemistry-reactions', 'rx-eq', '化学反応式', '係数合わせ。', 2, 1, ['反応式']),
  st('chemistry-reactions', 'rx-gas', '気体の法則', '状態方程式。', 3, 2, ['気体']),
  st('chemistry-reactions', 'rx-stoich', '量的関係', 'モル比。', 3, 3, ['量的', '物質量']),

  // 酸塩基
  st('chemistry-acid-base', 'ab-def', '酸・塩基の定義', 'アレニウス・ブレンステッド。', 2, 1, ['定義', '酸', '塩基']),
  st('chemistry-acid-base', 'ab-ph', 'pH', '水素イオン濃度。', 3, 2, ['pH']),
  st('chemistry-acid-base', 'ab-tit', '中和滴定', '量的関係。', 3, 3, ['中和', '滴定']),

  // 酸化還元
  st('chemistry-redox', 'rd-num', '酸化数', '増減で酸化還元。', 2, 1, ['酸化数']),
  st('chemistry-redox', 'rd-agent', '酸化剤・還元剤', '半反応式。', 3, 2, ['酸化剤', '還元剤']),
  st('chemistry-redox', 'rd-cell', '電池と電気分解', 'ファラデー。', 4, 3, ['電池', '電気分解']),

  // 化学平衡
  st('chemistry-equilibrium', 'eq-k', '平衡定数', 'K の立式。', 3, 1, ['平衡定数']),
  st('chemistry-equilibrium', 'eq-le', 'ルシャトリエの原理', '条件変化。', 3, 2, ['ルシャトリエ']),
  st('chemistry-equilibrium', 'eq-ion', '電離平衡', 'Ka, Kb。', 4, 3, ['電離']),

  // 無機
  st('chemistry-inorganic', 'ino-metal', '金属元素', 'イオン化傾向。', 3, 1, ['金属']),
  st('chemistry-inorganic', 'ino-nonmetal', '非金属元素', 'ハロゲンなど。', 3, 2, ['非金属', 'ハロゲン']),
  st('chemistry-inorganic', 'ino-ind', '工業的製法', '量的関係。', 4, 3, ['工業', '製法', '気体発生']),

  // 有機
  st('chemistry-organic', 'org-hc', '炭化水素', 'アルカン〜アルキン。', 2, 1, ['炭化水素', 'アルカン']),
  st('chemistry-organic', 'org-fn', '官能基', 'アルコール・カルボン酸。', 3, 2, ['官能基', 'アルコール']),
  st('chemistry-organic', 'org-iso', '異性体と反応経路', '構造推定。', 4, 3, ['異性体', '経路']),

  // 高分子
  st('chemistry-polymer', 'poly-syn', '合成高分子', '付加・縮合重合。', 3, 1, ['合成', '重合']),
  st('chemistry-polymer', 'poly-nat', '天然高分子', '糖・タンパク質。', 3, 2, ['天然', '糖']),
  st('chemistry-polymer', 'poly-mw', '重合度と分子量', '脱離水の数。', 4, 3, ['重合度', '分子量']),
];

export const SUBTOPICS: SubtopicItem[] = RAW_SUBTOPICS.map(({ hints: _hints, ...item }) => item);

const HINTS_BY_ID = new Map(RAW_SUBTOPICS.map((item) => [item.id, item.hints] as const));

export function getSubtopicHints(subtopicId: string): string[] {
  return HINTS_BY_ID.get(subtopicId) ?? [];
}

export function getSubtopicsForUnit(unitId: string): SubtopicItem[] {
  return SUBTOPICS.filter((item) => item.unitId === unitId).sort((left, right) => left.order - right.order);
}

export function getSubtopicById(subtopicId: string | undefined): SubtopicItem | undefined {
  if (!subtopicId) return undefined;
  return SUBTOPICS.find((item) => item.id === subtopicId);
}

export function hydrateUnitSubtopics(units: Array<{ id: string; subtopics: SubtopicItem[] }>): void {
  for (const unit of units) {
    unit.subtopics = getSubtopicsForUnit(unit.id);
  }
}

export function resolveSubtopicIdForPattern(pattern: Pick<SolutionPattern, 'id' | 'unitId' | 'patternName' | 'strategyText'>): string | undefined {
  if (!pattern.unitId) return undefined;
  const subtopics = getSubtopicsForUnit(pattern.unitId);
  if (subtopics.length === 0) return undefined;

  const haystack = `${pattern.id} ${pattern.patternName} ${pattern.strategyText ?? ''}`.toLowerCase();
  const scored = subtopics
    .map((subtopic) => {
      const hints = HINTS_BY_ID.get(subtopic.id) ?? [subtopic.title];
      const hits = hints.filter((hint) => haystack.includes(hint.toLowerCase())).length;
      return { id: subtopic.id, hits, order: subtopic.order };
    })
    .sort((left, right) => right.hits - left.hits || left.order - right.order);

  if (scored[0] && scored[0].hits > 0) return scored[0].id;

  const index = Math.abs(hashString(pattern.id)) % subtopics.length;
  return subtopics[index]?.id;
}

export function getPatternsForSubtopic(
  patterns: SolutionPattern[],
  subtopicId: string
): SolutionPattern[] {
  return patterns.filter((pattern) => pattern.subtopicId === subtopicId);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

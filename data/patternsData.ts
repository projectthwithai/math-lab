// ==========================================
// Apex Suite: Math Lab - Solution Patterns Master Data（本物の解法パターン図鑑）
// ==========================================
// 高校数学（数I・A / 数II・B・C / 数III）・物理（力学・熱・波動・電磁気）・
// 化学（理論・無機・有機）の主要入試解法パターンを網羅的に定義する。
// 各パターンは「パターン名」＋「AIが書いた解き方の方針（アプローチのコツ）」を
// セットで持つ。
//
// ユーザーごとの攻略状況（isMastered相当）はこのファイルでは静的に持たず、
// `lib/store/userStore.ts` の `clearedPatternIds` を正とする
// （静的マスターデータとユーザー状態を分離する設計）。

import type { SolutionPattern } from '@/types/mathLab';
import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory } from './unitsData';

export const PATTERN_LEVEL_LABELS: Record<SolutionPattern['level'], string> = {
  basic: '基本',
  standard: '標準',
  advanced: '応用',
};

export const SOLUTION_PATTERNS: SolutionPattern[] = [
  // ============================================================
  // 数と式
  // ============================================================
  {
    id: 'sp-numbers-01',
    subject: 'math',
    unit: '数と式',
    unitId: 'math-1a-numbers-and-expressions',
    level: 'basic',
    patternName: 'パターン1: 因数分解のパターン選定',
    strategyText:
      '因数分解は「共通因数でくくる→公式に当てはめる→たすき掛け」の順番で試すのが鉄則。' +
      'STEP1: まず全項に共通する因数がないか確認する。STEP2: 2乗の差・和の公式（a²-b²、a²±2ab+b²）に当てはまらないか確認する。' +
      'STEP3: ax²+bx+cの形ならたすき掛けで係数の組み合わせを探す。次数が高い式は最低次数の文字について整理し直すと見通しが良くなる。',
  },
  {
    id: 'sp-numbers-02',
    subject: 'math',
    unit: '数と式',
    unitId: 'math-1a-numbers-and-expressions',
    level: 'standard',
    patternName: 'パターン2: 絶対値を含む方程式・不等式',
    strategyText:
      '絶対値記号|x-a|は「場合分け」で外すのが基本方針。' +
      'STEP1: 中身x-aの符号が変わる境界（x=a）でグラフの領域を区切る。STEP2: 各区間で絶対値を外した式に書き換えて解く。' +
      'STEP3: 得られた解が、その区間の条件を満たしているか必ず確認する（区間外の解は不適）。|x-a|=bの形はx-a=±bで直接外せる特別ケースとして覚えておくと速い。',
  },

  // ============================================================
  // 2次関数
  // ============================================================
  {
    id: 'sp-quadratic-01',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'basic',
    patternName: 'パターン1: 2次関数の決定（頂点・軸から式を作る）',
    strategyText:
      '「頂点が(p,q)」「軸がx=p」と言われたら、まず標準形 y=a(x-p)²+q を思い浮かべる。' +
      'STEP1: 与えられた頂点・軸の情報を標準形に代入し、未知数はaだけにする。STEP2: もう1点の座標を代入してaを求める。' +
      'STEP3: 必要なら展開して一般形に戻す。3点を通る条件が与えられた場合は、a,b,cを未知数とした連立方程式を立てる方針に切り替える。',
  },
  {
    id: 'sp-quadratic-02',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'standard',
    patternName: 'パターン2: 軸が動く2次関数の最大・最小',
    strategyText:
      '定義域は固定で、文字係数によって放物線の軸の位置が動くタイプ。' +
      'STEP1: 平方完成して頂点（軸の位置）を文字式で求める。STEP2: 軸の位置と定義域の端点との大小関係で場合分けする（軸が定義域の左外・内・右外の3パターンが基本）。' +
      'STEP3: 各場合について最大値・最小値を与えるxを特定し関数値を計算する。境界（軸が端と一致するとき）の扱いをグラフで確認しながら慎重に決めること。',
  },
  {
    id: 'sp-quadratic-03',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'advanced',
    patternName: 'パターン3: 範囲が動く2次関数の最大・最小',
    strategyText:
      '放物線（軸）は固定で、定義域[t, t+k]（幅一定）の方が文字tによって動くタイプ。' +
      'STEP1: 頂点のx座標を求め、区間の代表点との位置関係で場合分けする。STEP2: 「区間が頂点より完全に左」「頂点が区間内」「区間が頂点より完全に右」の3パターンに分ける。' +
      'STEP3: 最大値は区間の両端のうち頂点から遠い方、最小値は頂点内なら頂点、外なら近い方の端点で決まることを利用する。パターン2（軸が動く）との違いを図で確認しよう。',
  },

  // ============================================================
  // 図形と計量（三角比）
  // ============================================================
  {
    id: 'sp-trig-ratio-01',
    subject: 'math',
    unit: '図形と計量（三角比）',
    unitId: 'math-1a-trigonometric-ratios',
    level: 'basic',
    patternName: 'パターン1: 三角比の相互関係を使った値の計算',
    strategyText:
      'sinθ, cosθ, tanθのうち1つが与えられ、残りを求める定番パターン。' +
      'STEP1: sin²θ+cos²θ=1 と tanθ=sinθ/cosθ の2つの公式だけで大抵解ける。STEP2: 平方根を取るときはθの範囲から符号を必ず確認する。' +
      'STEP3: 「sinθ+cosθ=k」のように和で与えられたら、両辺を2乗して(sinθ+cosθ)²=1+2sinθcosθの関係に持ち込むのが定石。',
  },
  {
    id: 'sp-trig-ratio-02',
    subject: 'math',
    unit: '図形と計量（三角比）',
    unitId: 'math-1a-trigonometric-ratios',
    level: 'standard',
    patternName: 'パターン2: 正弦定理・余弦定理の使い分け',
    strategyText:
      '三角形の辺と角の問題は「何が与えられ、何を求めるか」で使う定理を決める。' +
      '見分け方: 「2角+1辺」または「外接円の半径R」が絡む→正弦定理 a/sinA=2R。「3辺」または「2辺+その間の角」→余弦定理 a²=b²+c²-2bc·cosA。' +
      'STEP1: 図を描いて与えられた辺・角に印をつける。STEP2: 定理を選び計算する。cosA<0なら鈍角であることも見抜けるようにしよう。',
  },

  // ============================================================
  // データの分析
  // ============================================================
  {
    id: 'sp-data-01',
    subject: 'math',
    unit: 'データの分析',
    unitId: 'math-1a-data-analysis',
    level: 'basic',
    patternName: 'パターン1: 分散・標準偏差の計算',
    strategyText:
      '分散は「(2乗の平均)-(平均の2乗)」の公式を使うと計算が早い。' +
      'STEP1: データの平均値を求める。STEP2: 各データの2乗の平均を求める。STEP3: V=（2乗の平均）-（平均）²で分散を計算し、平方根を取って標準偏差を求める。' +
      '偏差（各データ-平均）を先に計算してから2乗する方法と、どちらが速いか問題ごとに判断しよう。',
  },
  {
    id: 'sp-data-02',
    subject: 'math',
    unit: 'データの分析',
    unitId: 'math-1a-data-analysis',
    level: 'standard',
    patternName: 'パターン2: 相関係数と散布図の読み取り',
    strategyText:
      '相関係数r=（共分散）/（xの標準偏差×yの標準偏差）を求める問題は、まず共分散の定義を正しく使えるかがカギ。' +
      'STEP1: xとyそれぞれの平均・標準偏差を求める。STEP2: 共分散（偏差の積の平均）を計算する。STEP3: 公式に代入してrを求める。' +
      '散布図の形状（右上がり・右下がり・無相関）からrの符号・大きさを見積もる感覚も選択式問題で役立つ。',
  },

  // ============================================================
  // 場合の数と確率
  // ============================================================
  {
    id: 'sp-prob-01',
    subject: 'math',
    unit: '場合の数と確率',
    unitId: 'math-1a-combinatorics-probability',
    level: 'basic',
    patternName: 'パターン1: 順列と組合せの使い分け',
    strategyText:
      '「並べる（順序を区別する）」→順列nPr、「選ぶだけ」→組合せnCrという基準でまず判断する。' +
      'STEP1: 「並べる」「順位」等があれば順列、「選ぶ」「組」等であれば組合せを疑う。STEP2: 円順列(n-1)!や同じものを含む順列など特殊な公式は条件を確認してから使う。' +
      'STEP3: 複数の作業を組み合わせる問題は積の法則で各STEPの場合の数を掛け合わせる。',
  },
  {
    id: 'sp-prob-02',
    subject: 'math',
    unit: '場合の数と確率',
    unitId: 'math-1a-combinatorics-probability',
    level: 'standard',
    patternName: 'パターン2: 余事象を使った確率計算',
    strategyText:
      '「少なくとも1つ」「〜でない」という表現を見たら余事象を疑うのが鉄則。' +
      'STEP1: 求めたい事象Aの余事象の確率を先に計算する（多くの場合こちらの方が簡単）。STEP2: P(A) = 1 - P(Aの余事象) の関係で目的の確率を求める。' +
      '直接数えると場合分けが多すぎる問題では、まず余事象の方が単純にならないか検討する習慣をつける。',
  },
  {
    id: 'sp-prob-03',
    subject: 'math',
    unit: '場合の数と確率',
    unitId: 'math-1a-combinatorics-probability',
    level: 'advanced',
    patternName: 'パターン3: 反復試行の確率・条件付き確率',
    strategyText:
      '同じ試行をn回繰り返すタイプと、原因と結果を結びつけるタイプの2大頻出パターン。' +
      'STEP1（反復試行）: 「n回中ちょうどk回」は nCk・p^k・(1-p)^(n-k) に当てはめる。' +
      'STEP2（条件付き確率）: P(A|B) = P(A∩B)/P(B)を使う。まずP(B)を求め、次にP(A∩B)を求める。樹形図を書くと数え漏れを防げる。',
  },

  // ============================================================
  // 三角関数（数II・B・C）
  // ============================================================
  {
    id: 'sp-trig-func-01',
    subject: 'math',
    unit: '三角関数',
    unitId: 'math-2bc-trigonometric-functions',
    level: 'basic',
    patternName: 'パターン1: 加法定理を使った値の計算',
    strategyText:
      'sin(α±β), cos(α±β) を求める問題は加法定理の公式に代入するだけの直接型。' +
      'STEP1: sin(α+β)=sinαcosβ+cosαsinβ 等4つの公式を正確に覚える（sinは同符号、cosは逆符号）。STEP2: 75°=45°+30°のように有名角の和・差に分解できないか探す。' +
      'STEP3: 2倍角公式は加法定理でα=β=θとした特別な場合であると理解しておくと丸暗記が減る。',
  },
  {
    id: 'sp-trig-func-02',
    subject: 'math',
    unit: '三角関数',
    unitId: 'math-2bc-trigonometric-functions',
    level: 'standard',
    patternName: 'パターン2: 三角関数の合成と値の範囲',
    strategyText:
      'asinθ+bcosθ の形を見たら即座に「合成」を疑う。最大値・最小値を求める超頻出パターン。' +
      'STEP1: asinθ+bcosθ = √(a²+b²)sin(θ+α) の形に変形する（αはtanα=b/aを満たす角）。STEP2: sin(θ+α)の値域が-1〜1であることから最大値√(a²+b²)、最小値-√(a²+b²)がすぐ分かる。' +
      'STEP3: θの範囲に制限がある場合はθ+αの取りうる範囲を求め、その範囲内での最大最小を確認する。',
  },
  {
    id: 'sp-trig-func-03',
    subject: 'math',
    unit: '三角関数',
    unitId: 'math-2bc-trigonometric-functions',
    level: 'advanced',
    patternName: 'パターン3: 三角方程式・不等式の解法',
    strategyText:
      'sinθ・cosθが混在する方程式・不等式は「置き換え」で1変数の問題に帰着させるのが王道。' +
      'STEP1: sin²θ+cos²θ=1を使ってどちらかに統一する。STEP2: t=sinθ（またはcosθ）と置き、-1≦t≦1の制限に注意してtの方程式・不等式として解く。' +
      'STEP3: 得られたtの値・範囲から単位円を描いてθの範囲に逆変換する。',
  },

  // ============================================================
  // 指数関数・対数関数
  // ============================================================
  {
    id: 'sp-explog-01',
    subject: 'math',
    unit: '指数関数・対数関数',
    unitId: 'math-2bc-exponential-logarithmic',
    level: 'basic',
    patternName: 'パターン1: 指数・対数方程式の基本変形',
    strategyText:
      '指数方程式は「底をそろえる」、対数方程式は「真数条件を先に確認してからlogを外す」のが鉄則。' +
      'STEP1: a^x=a^yの形に底をそろえたらx=yとしてよい。STEP2: 対数は log_a x = log_a y ⇔ x=y（かつ真数>0）に注意。' +
      'STEP3: t=a^xと置換して2次方程式に帰着させるパターンも頻出なので、置換後の範囲(t>0)を忘れないこと。',
  },
  {
    id: 'sp-explog-02',
    subject: 'math',
    unit: '指数関数・対数関数',
    unitId: 'math-2bc-exponential-logarithmic',
    level: 'standard',
    patternName: 'パターン2: 常用対数を使った桁数・最高位の推定',
    strategyText:
      '「何桁の数か」「最高位の数字は何か」を問う問題はlog₁₀を使うのが定石。' +
      'STEP1: N=a^nのとき log₁₀N = n・log₁₀a を計算する。STEP2: 桁数は log₁₀N の整数部分+1。STEP3: 最高位の数字は log₁₀N の小数部分を10のべきに戻して比較する。' +
      '与えられたlog₁₀2やlog₁₀3の近似値を正確に使い分けることがポイント。',
  },

  // ============================================================
  // 微分法（数II）
  // ============================================================
  {
    id: 'sp-diff2-01',
    subject: 'math',
    unit: '微分法（数II）',
    unitId: 'math-2bc-differentiation',
    level: 'basic',
    patternName: 'パターン1: 接線の方程式を求める',
    strategyText:
      '「x=tにおける接線」と「点(a,b)から引いた接線」の2タイプを区別することが最初の分かれ道。' +
      'STEP1: 接点のx座標がtと分かっている場合は傾きf\'(t)と接点のy座標f(t)を求め y-f(t)=f\'(t)(x-t) に代入する。' +
      'STEP2: 通る点だけが与えられた場合は接点を(t, f(t))とおき、その接線が与えられた点を通る条件からtの方程式を作って解く。',
  },
  {
    id: 'sp-diff2-02',
    subject: 'math',
    unit: '微分法（数II）',
    unitId: 'math-2bc-differentiation',
    level: 'standard',
    patternName: 'パターン2: 増減表を書いて極値・最大最小を求める',
    strategyText:
      '3次関数以上のグラフの概形・最大最小を求める定番の流れ。' +
      'STEP1: f\'(x)を計算しf\'(x)=0となるxを求める。STEP2: 増減表を書き、符号が+→-なら極大、-→+なら極小と判定する。' +
      'STEP3: 定義域に端点がある場合はその値も比較する。文字係数を含む場合は判別式で極値を持つ条件を先に確認する。',
  },
  {
    id: 'sp-diff2-03',
    subject: 'math',
    unit: '微分法（数II）',
    unitId: 'math-2bc-differentiation',
    level: 'advanced',
    patternName: 'パターン3: 3次関数のグラフと方程式の実数解の個数',
    strategyText:
      '「方程式f(x)=kの実数解の個数」は「y=f(x)のグラフと直線y=kの共有点の個数」に読み替えるのが最大のコツ。' +
      'STEP1: 極大値M・極小値mを求めグラフの概形を把握する。STEP2: 直線y=kを上下に動かし、kとM・mの大小関係で交点数が変わることを場合分けする。' +
      'STEP3: 境界値(k=Mやk=m)を含むかどうかまで正確に answer する。',
  },

  // ============================================================
  // 積分法（数II）
  // ============================================================
  {
    id: 'sp-int2-01',
    subject: 'math',
    unit: '積分法（数II）',
    unitId: 'math-2bc-integration',
    level: 'basic',
    patternName: 'パターン1: 定積分の計算',
    strategyText:
      '定積分は「不定積分を求めてから上端・下端を代入して引き算」という機械的な作業に帰着する。' +
      'STEP1: 各項をべき乗の積分公式で不定積分する。STEP2: 原始関数F(x)から∫[a,b]f(x)dx=F(b)-F(a)を計算する。' +
      'STEP3: 絶対値付き関数は符号が変わるxで区間を分割してから計算する。',
  },
  {
    id: 'sp-int2-02',
    subject: 'math',
    unit: '積分法（数II）',
    unitId: 'math-2bc-integration',
    level: 'standard',
    patternName: 'パターン2: 面積を求める（2曲線に囲まれた部分）',
    strategyText:
      '2つのグラフに囲まれた面積は「上の関数から下の関数を引いて積分」が基本方針。' +
      'STEP1: 交点のx座標を求める（積分区間の端点になる）。STEP2: 区間内でどちらが上かを確認する。STEP3: S=∫(上-下)dxを計算する。' +
      '放物線と直線の面積では公式 S=|a|/6・(β-α)³ を使うと検算にも便利。',
  },

  // ============================================================
  // 数列
  // ============================================================
  {
    id: 'sp-sequence-01',
    subject: 'math',
    unit: '数列',
    unitId: 'math-2bc-sequences',
    level: 'basic',
    patternName: 'パターン1: 等差数列・等比数列の一般項と和',
    strategyText:
      'まず与えられた数列が等差か等比かを見抜く（差が一定→等差、比が一定→等比）。' +
      'STEP1: 一般項公式 an=a1+(n-1)d または an=a1・r^(n-1) に条件から求めたa1とd（r）を代入する。' +
      'STEP2: 和の公式（等差: Sn=n(a1+an)/2、等比: Sn=a1(r^n-1)/(r-1)）を使う。',
  },
  {
    id: 'sp-sequence-02',
    subject: 'math',
    unit: '数列',
    unitId: 'math-2bc-sequences',
    level: 'standard',
    patternName: 'パターン2: Σ計算・階差数列',
    strategyText:
      '一般項が複雑な数列の和は、Σの公式や階差数列の考え方に帰着させる。' +
      'STEP1: 一般項がkの多項式ならΣk、Σk²、Σk³の公式で計算する。STEP2: 階差数列bn=an+1-anが分かる場合はan=a1+Σbkの関係を使う（n=1は別途確認）。' +
      'STEP3: 分数の数列は部分分数分解して差の形にし、途中の項が打ち消し合うtelescopingで計算する。',
  },
  {
    id: 'sp-sequence-03',
    subject: 'math',
    unit: '数列',
    unitId: 'math-2bc-sequences',
    level: 'advanced',
    patternName: 'パターン3: 漸化式から一般項を求める',
    strategyText:
      '漸化式の「型」を見抜いて対応する変形パターンに当てはめるのが最重要スキル。' +
      'STEP1: an+1=p・an+qの形は特性方程式x=px+qの解αを使い an+1-α=p(an-α) と変形しbn=an-αを等比数列にする。' +
      'STEP2: an+1=an+f(n)の形は階差数列として和で処理する。STEP3: 3項間漸化式は特性方程式の2解から2つの等比数列の関係式に分解する。',
  },

  // ============================================================
  // ベクトル
  // ============================================================
  {
    id: 'sp-vector-01',
    subject: 'math',
    unit: 'ベクトル',
    unitId: 'math-2bc-vectors',
    level: 'basic',
    patternName: 'パターン1: 内積の定義となす角の基本計算',
    strategyText:
      '内積が絡む問題は「成分で計算するか」「大きさとなす角で計算するか」の2通りの定義式を使い分ける。' +
      'STEP1: 成分が与えられていればa・b=a1b1+a2b2で直接計算する。STEP2: |a|,|b|,θが与えられていればa・b=|a||b|cosθを使う。' +
      'a⊥b（垂直）はa・b=0と同値であることも即座に使えるようにしておく。',
  },
  {
    id: 'sp-vector-02',
    subject: 'math',
    unit: 'ベクトル',
    unitId: 'math-2bc-vectors',
    level: 'standard',
    patternName: 'パターン2: 内分点・垂直条件を使った図形問題',
    strategyText:
      '三角形や四角形の中の点の位置を、始点をそろえたベクトルの式で表す問題群。' +
      'STEP1: 図形の1頂点を始点に固定し、他の点はすべて基本ベクトルの1次結合で表す。STEP2: 内分点の公式に当てはめる。' +
      'STEP3: 垂直条件は内積=0、一直線上にある条件は「片方がもう片方の実数倍」で立式する。',
  },
  {
    id: 'sp-vector-03',
    subject: 'math',
    unit: 'ベクトル',
    unitId: 'math-2bc-vectors',
    level: 'advanced',
    patternName: 'パターン3: ベクトルの一次独立と係数比較',
    strategyText:
      '「3点が一直線上にある」「4点が同一平面上にある」といった条件を扱う最重要テクニック。' +
      'STEP1: 平行でない（一次独立な）2つのベクトルe1, e2を基準に選び、登場する全てのベクトルをs・e1+t・e2の形で表す。' +
      'STEP2: 同じ点や線分を2通りの経路でベクトル表示し、両辺のe1・e2の係数をそれぞれ比較する（一次独立なベクトルの表し方は一意という定理が根拠）。',
  },

  // ============================================================
  // 極限（数III）
  // ============================================================
  {
    id: 'sp-limit-01',
    subject: 'math',
    unit: '極限',
    unitId: 'math-3-limits',
    level: 'basic',
    patternName: 'パターン1: 0/0型の不定形の極限',
    strategyText:
      'x→aで分母分子が0になる不定形は「因数分解して約分」するのが基本方針。' +
      'STEP1: 分子・分母をそれぞれ(x-a)で因数分解できないか試す。STEP2: 約分してからx=aを代入する。' +
      '無理式が絡む場合は分子または分母の有理化（共役式を掛ける）を先に行う。',
  },
  {
    id: 'sp-limit-02',
    subject: 'math',
    unit: '極限',
    unitId: 'math-3-limits',
    level: 'standard',
    patternName: 'パターン2: 三角関数・指数関数を含む極限公式の利用',
    strategyText:
      'lim(sinx/x)=1やlim((1+1/n)^n)=eなどの基本極限公式に「形を合わせる」ことが目標。' +
      'STEP1: 与式を基本公式の形（sinX/X等）に変形できるよう文字を置換する。STEP2: 置換した文字が0または∞に近づくことを確認してから公式を適用する。',
  },

  // ============================================================
  // 微分法（数III）
  // ============================================================
  {
    id: 'sp-diff3-01',
    subject: 'math',
    unit: '微分法（数III）',
    unitId: 'math-3-differentiation',
    level: 'standard',
    patternName: 'パターン1: 合成関数の微分（chain rule)',
    strategyText:
      '{f(g(x))}\' = f\'(g(x))・g\'(x) の型を素早く見抜くことが鍵。' +
      'STEP1: 式全体を「外側の関数」と「内側の関数」に分解する。STEP2: 外側を内側の変数のまま微分し、内側の微分を掛ける。' +
      '複数回合成されている場合は内側から順に同じ操作を繰り返す。',
  },
  {
    id: 'sp-diff3-02',
    subject: 'math',
    unit: '微分法（数III）',
    unitId: 'math-3-differentiation',
    level: 'advanced',
    patternName: 'パターン2: 媒介変数表示・陰関数の微分',
    strategyText:
      'x,yがtの関数で表される場合や、陽に解けない式は特別な公式が必要。' +
      'STEP1（媒介変数）: dy/dx = (dy/dt)/(dx/dt) を使う。STEP2（陰関数）: 両辺をxで微分し、yをxの関数とみなしてdy/dxを含む式として整理してから解く。',
  },

  // ============================================================
  // 積分法（数III）
  // ============================================================
  {
    id: 'sp-int3-01',
    subject: 'math',
    unit: '積分法（数III）',
    unitId: 'math-3-integration',
    level: 'standard',
    patternName: 'パターン1: 置換積分・部分積分の使い分け',
    strategyText:
      '「置換すると簡単な形になるか」「積を減らせるか」で手法を選ぶ。' +
      'STEP1: 合成関数の形（f(g(x))g\'(x)）が見えたら置換積分t=g(x)を試す。STEP2: 多項式×三角関数・指数関数の積は部分積分∫f\'g=fg-∫fg\'を使う。' +
      '部分積分は「微分すると簡単になる方」をfに選ぶのがコツ。',
  },
  {
    id: 'sp-int3-02',
    subject: 'math',
    unit: '積分法（数III）',
    unitId: 'math-3-integration',
    level: 'advanced',
    patternName: 'パターン2: 回転体の体積',
    strategyText:
      'x軸まわりの回転体の体積はV=π∫[a,b]{f(x)}²dxが基本形。' +
      'STEP1: 回転させる領域の境界関数を明確にする。STEP2: 2曲線に挟まれた領域を回転する場合は外側の関数の2乗から内側の関数の2乗を引く（バウムクーヘン型ではないことに注意）。' +
      'STEP3: 積分区間は境界の交点のx座標から決める。',
  },

  // ============================================================
  // 力学
  // ============================================================
  {
    id: 'sp-mechanics-01',
    subject: 'physics',
    unit: '力学',
    unitId: 'physics-mechanics',
    level: 'basic',
    patternName: 'パターン1: 運動方程式の立式と等加速度運動',
    strategyText:
      '力学の問題はまず「物体に働く力をすべて図示する」ことから始める（自由体図）。' +
      'STEP1: 働く力（重力・垂直抗力・張力・摩擦力等）を矢印で図示し、運動方向とそれに垂直な方向に分解する。' +
      'STEP2: 運動方向についてma=F（合力）の運動方程式を立てる。STEP3: 求めた加速度で等加速度運動の公式（v=v0+at等）から速度・距離を求める。',
  },
  {
    id: 'sp-mechanics-02',
    subject: 'physics',
    unit: '力学',
    unitId: 'physics-mechanics',
    level: 'standard',
    patternName: 'パターン2: 力学的エネルギー保存則の利用',
    strategyText:
      '「速さ」を問われ「時間」の情報が不要なときはエネルギー保存則を疑う。' +
      'STEP1: 摩擦や空気抵抗がないことを確認する（あれば仕事とエネルギーの関係式に切り替える）。STEP2: 基準点を決め、始点・終点で(1/2)mv²+mghの値を計算し等号で結ぶ。' +
      'STEP3: 求めたい量についてこの式を解く。運動方程式で時間を追うより速く解けるのが強み。',
  },
  {
    id: 'sp-mechanics-03',
    subject: 'physics',
    unit: '力学',
    unitId: 'physics-mechanics',
    level: 'advanced',
    patternName: 'パターン3: 運動量保存則と衝突（反発係数）',
    strategyText:
      '衝突・分裂の問題は「運動量保存則」と「反発係数の式」の2本立てで連立するのが基本方針。' +
      'STEP1: 外力が働かない方向で運動量保存則m1v1+m2v2=m1v1\'+m2v2\'を立てる。STEP2: 反発係数e=-(v1\'-v2\')/(v1-v2)の式を立てる。' +
      'STEP3: 2式を連立して衝突後の速度を求める。e=1は完全弾性衝突（エネルギー保存も使える）、e=0は完全非弾性衝突。',
  },

  // ============================================================
  // 熱力学
  // ============================================================
  {
    id: 'sp-thermo-01',
    subject: 'physics',
    unit: '熱力学',
    unitId: 'physics-thermodynamics',
    level: 'basic',
    patternName: 'パターン1: ボイル・シャルルの法則',
    strategyText:
      '一定量の気体の状態変化ではP1V1/T1=P2V2/T2の1本の式が基本。' +
      'STEP1: 変化前後のP・V・T（絶対温度K）を表に整理する。STEP2: 「温度一定」ならボイルの法則、「圧力一定」ならシャルルの法則に簡略化できる。' +
      '℃のままTに代入する間違いが最頻出ミスなので必ず+273してKに変換する。',
  },
  {
    id: 'sp-thermo-02',
    subject: 'physics',
    unit: '熱力学',
    unitId: 'physics-thermodynamics',
    level: 'advanced',
    patternName: 'パターン2: 気体の状態変化と分子運動論',
    strategyText:
      '気体分子運動論の問題は「1回の壁との衝突で気体分子が受け取る/与える力積」から圧力を導く発想が軸になる。' +
      'STEP1: 分子1個が壁に与える力積(2mv)と衝突頻度から平均の力を求め、圧力P=力/面積の式にまとめる。' +
      'STEP2: PV=nRT（状態方程式）と結びつけて、絶対温度Tと分子の平均運動エネルギーの関係(3/2 kT)を利用する問題に発展させる。',
  },

  // ============================================================
  // 波動
  // ============================================================
  {
    id: 'sp-waves-01',
    subject: 'physics',
    unit: '波動',
    unitId: 'physics-waves',
    level: 'basic',
    patternName: 'パターン1: 波の基本式（v=fλ）と波形の読み取り',
    strategyText:
      '波のグラフから波長・周期・振幅を正しく読み取ることが第一歩。' +
      'STEP1: y-xグラフからは波長λと振幅Aを、y-tグラフからは周期Tと振幅Aを読み取る。STEP2: 振動数f=1/Tを計算しv=fλに代入して波の速さを求める。' +
      'STEP3: 「Δt秒後の波形」はvΔtの分だけグラフを進行方向にずらして描く。',
  },
  {
    id: 'sp-waves-02',
    subject: 'physics',
    unit: '波動',
    unitId: 'physics-waves',
    level: 'standard',
    patternName: 'パターン2: 弦・気柱の固有振動（定常波）',
    strategyText:
      '弦や気柱の固有振動は、両端の境界条件（固定端は節、自由端・開口端は腹）を最初に判定する。' +
      'STEP1: その振動モードで管・弦の長さLと波長λの関係式（基本振動ならL=λ/2等）を立てる。STEP2: 波の速さv（弦ならv=√(T/ρ)）を求める。' +
      'STEP3: v=fλから固有振動数を求める。',
  },
  {
    id: 'sp-waves-03',
    subject: 'physics',
    unit: '波動',
    unitId: 'physics-waves',
    level: 'advanced',
    patternName: 'パターン3: ドップラー効果と音源の移動',
    strategyText:
      'ドップラー効果は「誰が動いているか」を丁寧に整理してから公式f\'=(V-vo)/(V-vs)・fに当てはめるのが安全。' +
      'STEP1: 音源の速さvs・観測者の速さvoを「相手に近づく向きを正」として符号を決める。STEP2: 片方だけが動く場合はもう片方を0として単純化する。' +
      'STEP3: 音源が観測者を追い越す等の複合問題は、反射音との組み合わせに注意し前半・後半で式を立て直す。',
  },

  // ============================================================
  // 電磁気
  // ============================================================
  {
    id: 'sp-emag-01',
    subject: 'physics',
    unit: '電磁気',
    unitId: 'physics-electromagnetism',
    level: 'basic',
    patternName: 'パターン1: オームの法則と合成抵抗',
    strategyText:
      '回路の問題はまず「直列」「並列」を見抜いて合成抵抗を1つの値にまとめることが出発点。' +
      'STEP1: 直列はR=R1+R2+…、並列は1/R=1/R1+1/R2+…で計算する。STEP2: 回路全体をV=IRに当てはめ全体の電流・電圧を求める。' +
      'STEP3: 直列部分は「電流が共通」、並列部分は「電圧が共通」という性質で各抵抗の値を逆算する。',
  },
  {
    id: 'sp-emag-02',
    subject: 'physics',
    unit: '電磁気',
    unitId: 'physics-electromagnetism',
    level: 'standard',
    patternName: 'パターン2: コンデンサーを含む回路',
    strategyText:
      'コンデンサーが絡む回路は「十分時間が経った後（定常状態）」という設定を必ず確認する。' +
      'STEP1: 定常状態ではコンデンサーに電流が流れないことを利用し回路を単純化する。STEP2: コンデンサー両端の電圧を求める。' +
      'STEP3: Q=CV、U=(1/2)CV²で電荷・エネルギーを計算する。合成容量は直列で逆数の和、並列で単純な和（抵抗と逆）。',
  },
  {
    id: 'sp-emag-03',
    subject: 'physics',
    unit: '電磁気',
    unitId: 'physics-electromagnetism',
    level: 'advanced',
    patternName: 'パターン3: 電磁誘導と誘導起電力',
    strategyText:
      '電磁誘導の問題は「磁束Φの変化」を追うことがすべての出発点。' +
      'STEP1: コイルを貫く磁束Φ=BSの時間変化を求める。STEP2: ファラデーの法則V=-N(ΔΦ/Δt)から誘導起電力を求める（導体棒ならV=vBL）。' +
      'STEP3: 誘導電流の向きはレンツの法則で判定し、力F=BILを求めて力学との複合問題に対応する。',
  },

  // ============================================================
  // 物質の構成
  // ============================================================
  {
    id: 'sp-mole-01',
    subject: 'chemistry',
    unit: '物質の構成',
    unitId: 'chemistry-composition',
    level: 'basic',
    patternName: 'パターン1: 物質量（mol）の基本計算',
    strategyText:
      '化学計算のほぼ全ては「質量⇔物質量(mol)⇔粒子数・気体の体積」の変換に帰着する。' +
      'STEP1: n(mol) = 質量w(g) / モル質量M(g/mol) の関係を軸に質量とmolを行き来する。STEP2: 標準状態の気体はn(mol) = V(L) / 22.4(L/mol)も使える。' +
      'STEP3: 粒子数はnにアボガドロ定数を掛ける。',
  },
  {
    id: 'sp-mole-02',
    subject: 'chemistry',
    unit: '物質の構成',
    unitId: 'chemistry-composition',
    level: 'standard',
    patternName: 'パターン2: 溶液の濃度変換（質量パーセント⇔モル濃度）',
    strategyText:
      '濃度の単位変換は「溶液1Lを基準に置く」と機械的に計算できる。' +
      'STEP1: 質量パーセント濃度a%からは溶液1L(密度d g/mLならd×1000g)を基準に溶質の質量を求める。STEP2: モル質量で割って物質量を求め、体積1Lで割ればモル濃度になる。' +
      '密度dを必ず使って体積↔質量の変換を行うことを忘れずに。',
  },

  // ============================================================
  // 物質の変化（理論化学）
  // ============================================================
  {
    id: 'sp-reactions-01',
    subject: 'chemistry',
    unit: '物質の変化（理論化学）',
    unitId: 'chemistry-reactions',
    level: 'basic',
    patternName: 'パターン1: 化学反応式の量的関係（過不足のある反応）',
    strategyText:
      '2種類以上の反応物が与えられ「どちらが不足するか（限定試薬）」を見抜く必要がある複合パターン。' +
      'STEP1: 反応式の係数比を確認し、各反応物の物質量を係数で割って比較する。STEP2: 値が最も小さい反応物が限定試薬で、生成物はこれを基準に計算する。' +
      'STEP3: 過剰な方は反応した分を引き算して残りを求める。',
  },
  {
    id: 'sp-reactions-02',
    subject: 'chemistry',
    unit: '物質の変化（理論化学）',
    unitId: 'chemistry-reactions',
    level: 'standard',
    patternName: 'パターン2: 気体の状態方程式',
    strategyText:
      '物質量(mol)が変化する場合はPV=nRTの状態方程式を使う。' +
      'STEP1: 分かっている3つの量（P,V,n,T）を代入し残る1つを求める。STEP2: 気体が発生する反応では、まず化学反応式でnを求めてから代入する2段階構成が多い。' +
      'STEP3: 分子量を求める問題はPV=(w/M)RTの形に変形してMを逆算する。',
  },
  {
    id: 'sp-reactions-03',
    subject: 'chemistry',
    unit: '物質の変化（理論化学）',
    unitId: 'chemistry-reactions',
    level: 'advanced',
    patternName: 'パターン3: 混合気体の分圧（ドルトンの分圧の法則）',
    strategyText:
      '複数の気体が混ざっている問題は「各成分ごとに独立してPV=nRTが成り立つ」と考えるのが最大のコツ。' +
      'STEP1: 各成分気体が単独で同じV・Tを占めたと仮定し分圧piをpi・V=ni・RTから求める。STEP2: 全圧は各成分の分圧の和（ドルトンの分圧の法則）。' +
      '水上置換で捕集した場合は全圧から水蒸気圧を引いたものが集めた気体の分圧になる。',
  },

  // ============================================================
  // 無機化学
  // ============================================================
  {
    id: 'sp-inorganic-01',
    subject: 'chemistry',
    unit: '無機化学',
    unitId: 'chemistry-inorganic',
    level: 'basic',
    patternName: 'パターン1: 気体の発生方法と性質の暗記法',
    strategyText:
      '気体の発生問題は「発生方法（試薬の組み合わせ）」「捕集法」「検出反応」の3点セットで覚えると効率が良い。' +
      'STEP1: 弱酸・弱塩基の遊離反応（強酸/強塩基が弱酸/弱塩基の塩を追い出す）というパターンをまず疑う。' +
      'STEP2: 発生した気体の密度・水への溶けやすさから捕集法（上方/下方置換、水上置換）を判断する。',
  },
  {
    id: 'sp-inorganic-02',
    subject: 'chemistry',
    unit: '無機化学',
    unitId: 'chemistry-inorganic',
    level: 'standard',
    patternName: 'パターン2: 金属イオンの系統分離・沈殿反応',
    strategyText:
      '金属イオンの分離問題は「どの試薬でどのイオンが沈殿するか」の対応表を頭の中で再現できるかが勝負。' +
      'STEP1: 塩酸で沈殿するグループ（Ag+, Pb2+等）を最初に分離する。STEP2: 硫化水素・水酸化物・炭酸塩と順番に試薬を加えて沈殿するグループを絞り込む。' +
      '各ステップで「なぜこの試薬でこのイオンだけ沈殿するのか」を溶解度積の考え方で説明できるようにしておく。',
  },

  // ============================================================
  // 有機化学
  // ============================================================
  {
    id: 'sp-organic-01',
    subject: 'chemistry',
    unit: '有機化学',
    unitId: 'chemistry-organic',
    level: 'basic',
    patternName: 'パターン1: 分子式から構造異性体を書き出す',
    strategyText:
      '構造異性体を書き出す問題は「炭素骨格を先に決めてから官能基を配置する」順番が抜け漏れを防ぐ。' +
      'STEP1: 炭素数から可能な炭素骨格（直鎖・枝分かれ）をすべて列挙する。STEP2: 各骨格に官能基（-OHや-COOH等）を置く位置を重複なく配置する。' +
      '同じ構造を2回数えないよう、対称性を確認しながら進める。',
  },
  {
    id: 'sp-organic-02',
    subject: 'chemistry',
    unit: '有機化学',
    unitId: 'chemistry-organic',
    level: 'standard',
    patternName: 'パターン2: 元素分析から分子式を決定する',
    strategyText:
      '元素分析（燃焼によるCO2, H2Oの質量から組成を決める）問題は、比例計算の手順が決まっている。' +
      'STEP1: 生じたCO2の質量からC原子のmol数、H2Oの質量からH原子のmol数を求める。STEP2: 試料の質量から C, H の質量を引いて残りをOの質量とする。' +
      'STEP3: 各元素のmol比を整数比に直して組成式を求め、分子量条件から分子式を決定する。',
  },
];

// ------------------------------------------
// ヘルパー関数
// ------------------------------------------

export function getSolutionPatternsByUnit(unitId: string): SolutionPattern[] {
  return SOLUTION_PATTERNS.filter((pattern) => pattern.unitId === unitId);
}

function categoryForUnitId(unitId: string | undefined): UnitCategory | null {
  if (!unitId) return null;
  const unit = UNITS_DATA.find((candidate) => candidate.id === unitId);
  return unit?.category ?? null;
}

export interface WeaknessRadarAxis {
  label: UnitCategory;
  /** そのカテゴリの攻略率(0-100) */
  value: number;
  totalCount: number;
  clearedCount: number;
}

/**
 * カテゴリ（科目タブ）ごとの攻略率を計算する。
 * `clearedPatternIds` はユーザーストア（`lib/store/userStore.ts`）から渡す。
 */
export function getWeaknessRadarData(clearedPatternIds: string[]): WeaknessRadarAxis[] {
  const clearedSet = new Set(clearedPatternIds);

  return UNIT_CATEGORIES.map((category) => {
    const patternsInCategory = SOLUTION_PATTERNS.filter(
      (pattern) => categoryForUnitId(pattern.unitId) === category
    );
    const totalCount = patternsInCategory.length;
    const clearedCount = patternsInCategory.filter((pattern) => clearedSet.has(pattern.id)).length;
    const value = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;
    return { label: category, value, totalCount, clearedCount };
  });
}

export interface PatternCompletionSummary {
  totalCount: number;
  clearedCount: number;
  completionPercent: number;
}

export function getCompletionSummary(clearedPatternIds: string[]): PatternCompletionSummary {
  const clearedSet = new Set(clearedPatternIds);
  const totalCount = SOLUTION_PATTERNS.length;
  const clearedCount = SOLUTION_PATTERNS.filter((pattern) => clearedSet.has(pattern.id)).length;
  const completionPercent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;
  return { totalCount, clearedCount, completionPercent };
}

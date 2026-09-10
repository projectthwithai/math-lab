// ==========================================
// Apex Suite: Math Lab - Solution Patterns Master Data（本物の解法パターン図鑑）
// ==========================================
// 高校数学（数I・A / 数II・B・C / 数III）・物理（力学・熱・波動・電磁気）・
// 化学（理論・無機・有機）の主要入試解法パターンを網羅的に定義する（130本超）。
// 各パターンは「パターン名」＋「AIが書いた解き方の方針（アプローチのコツ）」を
// セットで持つ。
//
// ユーザーごとの攻略状況（isMastered相当）はこのファイルでは静的に持たず、
// `lib/store/userStore.ts` の `clearedPatternIds` を正とする。
// 写真OCR / AI発掘で後から増えるカードは静的配列を書き換えず、
// `userStore.discoveredPatterns` に登録し、図鑑UIが出題プールと合わせてマージする。

import type { SolutionPattern } from '@/types/mathLab';
import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory } from './unitsData';
import { resolveSubtopicIdForPattern } from './subtopicsData';

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
    exampleQuestion: '次の式を因数分解せよ。$x^2 + 5x + 6$',
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
    exampleQuestion: '不等式 $|x-3| \\le 2$ を解け。',
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
    exampleQuestion: '頂点が $(2, -3)$ で点 $(0, 5)$ を通る2次関数の式を求めよ。',
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
    exampleQuestion: '$f(x)=(x-a)^2+1$（$0\\le x\\le 4$）の最小値を、$a$ の値で場合分けして求めよ。',
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
    exampleQuestion: '$f(x)=x^2$ の $t\\le x\\le t+2$ における最小値を $t$ の関数として求めよ。',
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
    exampleQuestion: '$\\sin\\theta=3/5$（鋭角）のとき $\\cos\\theta$ を求めよ。',
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
    exampleQuestion: '三角形で $a=5$，$b=7$，$A=40^\\circ$ のとき辺 $c$ を求めよ（正弦定理または余弦定理）。',
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
    exampleQuestion: 'データ $2, 4, 6, 8$ の分散を求めよ。',
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
    exampleQuestion: '$x$ と $y$ の共分散が $4$、$s_x=2$、$s_y=4$ のとき相関係数 $r$ を求めよ。',
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
    exampleQuestion: '$8$ 人から委員長・副委員長を選ぶ方法は何通りか。',
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
    exampleQuestion: 'サイコロを3回投げて、少なくとも1回6が出る確率を求めよ。',
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
    exampleQuestion: '当たり確率 $1/5$ のくじを4回引くとき、ちょうど2回当たる確率を求めよ。',
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
    exampleQuestion: '$\\sin 75^\\circ$ の値を加法定理で求めよ。',
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
    exampleQuestion: '$3\\sin\\theta+4\\cos\\theta$ の最大値を求めよ。',
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
    exampleQuestion: '$2\\sin^2\\theta-\\sin\\theta-1=0$（$0\\le\\theta<2\\pi$）を解け。',
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
    exampleQuestion: '$2^{x}=8$ を解け。',
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
    exampleQuestion: '$\\log_{10}2=0.3010$ として $2^{10}$ の桁数を求めよ。',
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
    exampleQuestion: '$f(x)=x^3$ の $x=2$ における接線の方程式を求めよ。',
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
    exampleQuestion: '$f(x)=x^3-3x$ の極値を求めよ。',
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
    exampleQuestion: '方程式 $x^3-3x=k$ の異なる実数解の個数を $k$ で場合分けせよ。',
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
    exampleQuestion: '$\\displaystyle\\int_0^2 (2x+1)\\,dx$ を求めよ。',
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
    exampleQuestion: '$y=x^2$ と $y=2x$ で囲まれた面積を求めよ。',
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
    exampleQuestion: '初項3、公差2の等差数列の第10項を求めよ。',
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
    exampleQuestion: '$\\sum_{k=1}^{n} k^2$ の公式を用いて $n=10$ の和を求めよ。',
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
    exampleQuestion: '$a_1=1$，$a_{n+1}=2a_n+1$ の一般項を求めよ。',
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
    exampleQuestion: '$\\vec{a}=(2,1)$，$\\vec{b}=(1,3)$ のとき $\\vec{a}\\cdot\\vec{b}$ を求めよ。',
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
    exampleQuestion: '三角形ABCで辺BCを $1:2$ に内分する点をDとするとき $\\overrightarrow{AD}$ を $\\vec{b},\\vec{c}$ で表せ。',
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
    exampleQuestion: '$\\vec{p}=s\\vec{a}+t\\vec{b}=2\\vec{a}-\\vec{b}$ のとき $s,t$ を求めよ（$\\vec{a},\\vec{b}$ は一次独立）。',
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
    exampleQuestion: '$\\displaystyle\\lim_{x\\to 2}\\dfrac{x^2-4}{x-2}$ を求めよ。',
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
    exampleQuestion: '$\\displaystyle\\lim_{x\\to 0}\\dfrac{\\sin 3x}{x}$ を求めよ。',
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
    exampleQuestion: '$f(x)=(2x+1)^3$ のとき $f\'(1)$ を求めよ。',
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
    exampleQuestion: '$x=t^2$，$y=2t$ の $t=2$ における $dy/dx$ を求めよ。',
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
    exampleQuestion: '$\\displaystyle\\int x e^x\\,dx$ を部分積分で求めよ。',
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
    exampleQuestion: '$y=x^2$（$0\\le x\\le 1$）を $x$ 軸まわりに回転した体積を求めよ。',
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
    exampleQuestion: '質量 $2$ kg の物体に水平方向 $10$ N の力を加えたときの加速度を求めよ。',
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
    exampleQuestion: '高さ $5$ m から静かに落とした物体の地面到達時の速さを求めよ（$g=10$）。',
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
    exampleQuestion: '質量 $m$，$2m$ が速さ $v$，$0$ で完全弾性衝突したあと、入射側の速度を求めよ。',
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
    exampleQuestion: '$P_1=2$ atm，$V_1=3$ L，$T_1=300$ K を $V_2=6$ L，$T_2=400$ K にしたときの $P_2$ を求めよ。',
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
    exampleQuestion: '理想気体分子の平均運動エネルギーが $\\tfrac{3}{2}kT$ であるとき、絶対温度を2倍にすると平均運動エネルギーはどうなるか。',
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
    exampleQuestion: '振動数 $256$ Hz、波長 $1.3$ m の波の速さを求めよ。',
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
    exampleQuestion: '長さ $L$ の両端固定弦の基本振動の波長を求めよ。',
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
    exampleQuestion: '音速 $340$ m/s、振動数 $500$ Hz の音源が $20$ m/s で接近するとき、観測者が聞く振動数を求めよ。',
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
    exampleQuestion: '$3\\Omega$ と $6\\Omega$ を直列にし $9$ V をかけたときの電流を求めよ。',
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
    exampleQuestion: '容量 $2\\mu$F のコンデンサーに $10$ V をかけたときの電荷を求めよ。',
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
    exampleQuestion: '磁束が $0.2$ s で $0.05$ Wb から $0.01$ Wb に減ったとき、1回巻きコイルの誘導起電力の大きさはいくらか。',
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
    exampleQuestion: '質量 $18$ g の水（$M=18$）の物質量を求めよ。',
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
    exampleQuestion: '密度 $1.2$ g/mL、質量パーセント $10\\%$ の水溶液 $1.0$ L のモル濃度を求めよ（溶質のモル質量 $60$）。',
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
    exampleQuestion: '$\\mathrm{H_2}+\\mathrm{Cl_2}\\to 2\\mathrm{HCl}$ で $\\mathrm{H_2}$ $2$ mol と $\\mathrm{Cl_2}$ $1$ mol を反応させたとき、生じる HCl は何 mol か。',
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
    exampleQuestion: '$n=0.50$ mol の理想気体の $27^\\circ$C、$1.0$ atm における体積を求めよ（$R=0.082$）。',
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
    exampleQuestion: '全圧 $2.0$ atm の混合気体で成分Aのモル分率が $0.3$ のとき、Aの分圧を求めよ。',
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
    exampleQuestion: '亜鉛に希硫酸を加えたときに発生する気体の分子式を答えよ。',
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
    exampleQuestion: '水溶液に塩酸を加えると白色沈殿が生じ、その沈殿はアンモニア水に溶ける。この金属イオンは何か。',
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
    exampleQuestion: '分子式 $\\mathrm{C_4H_{10}}$ の構造異性体は何種類か。',
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
    exampleQuestion: '試料 $3.0$ g を完全燃焼させ $\\mathrm{CO_2}$ $8.8$ g、$\\mathrm{H_2O}$ $5.4$ g を得た。組成式を求めよ。',
    strategyText:
      '元素分析（燃焼によるCO2, H2Oの質量から組成を決める）問題は、比例計算の手順が決まっている。' +
      'STEP1: 生じたCO2の質量からC原子のmol数、H2Oの質量からH原子のmol数を求める。STEP2: 試料の質量から C, H の質量を引いて残りをOの質量とする。' +
      'STEP3: 各元素のmol比を整数比に直して組成式を求め、分子量条件から分子式を決定する。',
  },

  // ============================================================
  // 追加: 数と式 / 2次関数 / 三角比 / 指数対数 / 微積分 / 数列 / ベクトル
  // ============================================================
  {
    id: 'sp-numbers-03',
    subject: 'math',
    unit: '数と式',
    unitId: 'math-1a-numbers-and-expressions',
    level: 'advanced',
    patternName: 'パターン3: 対称式の変形と最大最小',
    exampleQuestion: '$x+y=5$，$xy=3$ のとき $x^2+y^2$ の値を求めよ。',
    strategyText:
      '対称式は基本対称式 x+y, xy で表すのが定石。' +
      'STEP1: x^2+y^2=(x+y)^2-2xy などの公式に持ち込む。STEP2: 与えられた和・積を代入する。' +
      'STEP3: 不等式評価が必要なら相加相乗平均も併用する。',
  },
  {
    id: 'sp-quadratic-04',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'standard',
    patternName: 'パターン4: 2次方程式の判別式と共有点',
    exampleQuestion: '$y=x^2$ と $y=ax+1$ が異なる2点で交わるような定数 $a$ の範囲を求めよ。',
    strategyText:
      '共有点の個数は「代入してできる2次方程式の判別式 D」で判定する。' +
      'STEP1: 連立して x の2次方程式をつくる。STEP2: D>0, =0, <0 で2点・1点・なしと読み替える。' +
      'STEP3: 接する条件は D=0（重解）。',
  },
  {
    id: 'sp-quadratic-05',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'advanced',
    patternName: 'パターン5: 文字定数を含む最大値関数 M(a)',
    exampleQuestion: '$f(x)=-x^2+2ax$（$0\\le x\\le 4$）の最大値 $M(a)$ を $a$ の式で表せ。',
    strategyText:
      '軸 x=a と定義域の位置関係で場合分けし、最大値を a の関数としてつなぐ。' +
      'STEP1: 平方完成して軸・頂点を出す。STEP2: a≦0 / 0≦a≦4 / a≧4 に分ける。' +
      'STEP3: 境界で式が連続につながることを確認する。',
  },
  {
    id: 'sp-trig-ratio-03',
    subject: 'math',
    unit: '図形と計量（三角比）',
    unitId: 'math-1a-trigonometric-ratios',
    level: 'advanced',
    patternName: 'パターン3: 三角形の面積と外接円',
    exampleQuestion: '$a=6$，$B=45^\\circ$，$C=60^\\circ$ の三角形の面積と外接円の半径 $R$ を求めよ。',
    strategyText:
      '面積は S=½bc sinA、外接円は a/sinA=2R。' +
      'STEP1: 内角の和から残りの角を出す。STEP2: 正弦定理で残りの辺を求める。' +
      'STEP3: 面積公式と 2R=a/sinA を使う。',
  },
  {
    id: 'sp-trig-func-04',
    subject: 'math',
    unit: '三角関数',
    unitId: 'math-2bc-trigonometric-functions',
    level: 'advanced',
    patternName: 'パターン4: 2倍角・半角と合成の融合',
    exampleQuestion: '$f(\\theta)=\\sin 2\\theta+\\cos 2\\theta+1$ の最大値を求めよ。',
    strategyText:
      '2倍角を一つの角と見てから合成する。' +
      'STEP1: sin2θ+cos2θ=√2 sin(2θ+π/4)。STEP2: 定数項を足して最大・最小を読む。' +
      'STEP3: 2θ の値域が十分広いか（制限があるか）を確認する。',
  },
  {
    id: 'sp-explog-03',
    subject: 'math',
    unit: '指数関数・対数関数',
    unitId: 'math-2bc-exponential-logarithmic',
    level: 'standard',
    patternName: 'パターン3: 真数条件つき対数方程式',
    exampleQuestion: '$\\log_2 x + \\log_2 (x-2) = 3$ を解け。',
    strategyText:
      '真数条件を先に書いてから、和を積にまとめて log を外す。' +
      'STEP1: x>0 かつ x-2>0。STEP2: log_2{x(x-2)}=3 ⇔ x(x-2)=8。' +
      'STEP3: 得た解が真数条件を満たすか判定する。',
  },
  {
    id: 'sp-explog-04',
    subject: 'math',
    unit: '指数関数・対数関数',
    unitId: 'math-2bc-exponential-logarithmic',
    level: 'advanced',
    patternName: 'パターン4: 指数の置換（t=a^x）',
    exampleQuestion: '$4^x - 6\\cdot 2^x + 8 = 0$ を解け。',
    strategyText:
      '4^x=(2^x)^2 と見て t=2^x>0 に置換し2次方程式へ帰着する。' +
      'STEP1: t の2次方程式を解く。STEP2: t>0 だけ残す。STEP3: x=log_2 t で戻す。',
  },
  {
    id: 'sp-diff2-04',
    subject: 'math',
    unit: '微分法（数II）',
    unitId: 'math-2bc-differentiation',
    level: 'advanced',
    patternName: 'パターン4: 点から引いた接線の本数',
    exampleQuestion: '点 $(0, -2)$ から曲線 $y=x^3$ に引ける接線の本数を求めよ。',
    strategyText:
      '接点を (t,f(t)) とおき、接線が与点を通る条件で t の方程式を作る。' +
      'STEP1: 接線の公式を書く。STEP2: 与点を代入して t の方程式にする。' +
      'STEP3: 実数解の個数が接線の本数。',
  },
  {
    id: 'sp-int2-03',
    subject: 'math',
    unit: '積分法（数II）',
    unitId: 'math-2bc-integration',
    level: 'advanced',
    patternName: 'パターン3: 絶対値を含む定積分',
    exampleQuestion: '$\\displaystyle\\int_{-1}^{2} |x^2-1|\\,dx$ を求めよ。',
    strategyText:
      '絶対値の中身の符号が変わる点で区間を分割する。' +
      'STEP1: x^2-1=0 の根 ±1 で区切る。STEP2: 各小区間で外した式を積分する。' +
      'STEP3: 符号を間違えないよう数直線で確認する。',
  },
  {
    id: 'sp-sequence-04',
    subject: 'math',
    unit: '数列',
    unitId: 'math-2bc-sequences',
    level: 'advanced',
    patternName: 'パターン4: 部分分数分解と望遠鏡和',
    exampleQuestion: '$\\sum_{k=1}^{n} \\dfrac{1}{k(k+1)}$ を求めよ。',
    strategyText:
      '分数一般項は部分分数に分解し、隣項が打ち消し合う形にする。' +
      'STEP1: 1/{k(k+1)}=1/k-1/(k+1)。STEP2: 和を書いて途中項を消す。' +
      'STEP3: 残った端の項だけが答え。',
  },
  {
    id: 'sp-vector-04',
    subject: 'math',
    unit: 'ベクトル',
    unitId: 'math-2bc-vectors',
    level: 'advanced',
    patternName: 'パターン4: 空間ベクトルと垂直条件',
    exampleQuestion: '$\\vec{a}=(1,2,2)$，$\\vec{b}=(2,-1,t)$ が垂直のとき t を求めよ。',
    strategyText:
      '空間でも垂直 ⇔ 内積0。成分の積の和を0とおく。' +
      'STEP1: a·b=1·2+2·(-1)+2·t=0。STEP2: t について解く。' +
      'STEP3: 必要なら大きさを使ってなす角も求められる。',
  },

  // ============================================================
  // 未カバー単元の追加
  // ============================================================
  {
    id: 'sp-plane-01',
    subject: 'math',
    unit: '図形の性質',
    unitId: 'mathA-plane-geometry',
    level: 'basic',
    patternName: 'パターン1: 角の二等分線定理',
    exampleQuestion: '三角形ABCで AB=6，AC=4，BC=5，∠Aの二等分線とBCの交点をDとするとき BD を求めよ。',
    strategyText:
      '角の二等分線は対辺を隣辺の比に内分する。' +
      'STEP1: BD:DC=AB:AC を書く。STEP2: BD=BC×AB/(AB+AC) を計算する。',
  },
  {
    id: 'sp-plane-02',
    subject: 'math',
    unit: '図形の性質',
    unitId: 'mathA-plane-geometry',
    level: 'standard',
    patternName: 'パターン2: 方べきの定理',
    exampleQuestion: '円の2弦AB, CDが点Pで交わる。AP=3，PB=4，CP=2 のとき PD を求めよ。',
    strategyText:
      '交わる2弦では AP·PB=CP·PD。' +
      'STEP1: どの線分の積が等しいかを図で確認する。STEP2: 未知の線分について解く。',
  },
  {
    id: 'sp-plane-03',
    subject: 'math',
    unit: '図形の性質',
    unitId: 'mathA-plane-geometry',
    level: 'advanced',
    patternName: 'パターン3: 円周角と中心角',
    exampleQuestion: '同じ弧に対する円周角が $35^\\circ$ のとき、中心角の大きさを求めよ。',
    strategyText:
      '中心角は円周角の2倍。同じ弧・同じ弦を見ているかを先に確認する。' +
      'STEP1: 注目する弧を決める。STEP2: 中心角=2×円周角。',
  },
  {
    id: 'sp-int-01',
    subject: 'math',
    unit: '整数の性質',
    unitId: 'mathA-integers',
    level: 'basic',
    patternName: 'パターン1: ユークリッドの互除法',
    exampleQuestion: '$252$ と $105$ の最大公約数を互除法で求めよ。',
    strategyText:
      '大きい数を小さい数で割り、割る数と余りを入れ替えて余り0まで繰り返す。最後の割る数が gcd。',
  },
  {
    id: 'sp-int-02',
    subject: 'math',
    unit: '整数の性質',
    unitId: 'mathA-integers',
    level: 'standard',
    patternName: 'パターン2: 1次不定方程式',
    exampleQuestion: '$5x+3y=1$ の整数解を1組求めよ。',
    strategyText:
      '互除法を逆に辿って特殊解を作り、一般解は係数を周期にして加える。' +
      'STEP1: 特殊解 (x0,y0) を見つける。STEP2: 一般解 x=x0+3t，y=y0-5t。',
  },
  {
    id: 'sp-int-03',
    subject: 'math',
    unit: '整数の性質',
    unitId: 'mathA-integers',
    level: 'advanced',
    patternName: 'パターン3: n進法と基数変換',
    exampleQuestion: '十進法の $45$ を二進法で表せ。',
    strategyText:
      '基数で割り続けて余りを逆順に並べる（整数部分）。小数は掛けて整数部分を順に取る。',
  },
  {
    id: 'sp-proof-01',
    subject: 'math',
    unit: 'いろいろな式（式と証明・複素数と方程式）',
    unitId: 'math2-expressions-and-proof',
    level: 'basic',
    patternName: 'パターン1: 剰余の定理',
    exampleQuestion: '$P(x)=x^3-2x+1$ を $x-1$ で割った余りを求めよ。',
    strategyText: 'P(x) を (x-c) で割った余りは P(c)。代入するだけでよい。',
  },
  {
    id: 'sp-proof-02',
    subject: 'math',
    unit: 'いろいろな式（式と証明・複素数と方程式）',
    unitId: 'math2-expressions-and-proof',
    level: 'standard',
    patternName: 'パターン2: 因数定理で3次式を分解',
    exampleQuestion: '$x^3-6x^2+11x-6$ を因数分解せよ。',
    strategyText:
      '定数項の約数を代入して P(c)=0 となる c を探し、(x-c) で組立除法する。',
  },
  {
    id: 'sp-proof-03',
    subject: 'math',
    unit: 'いろいろな式（式と証明・複素数と方程式）',
    unitId: 'math2-expressions-and-proof',
    level: 'advanced',
    patternName: 'パターン3: 複素数と2次方程式',
    exampleQuestion: '$x^2+x+1=0$ の解を求め、絶対値を求めよ。',
    strategyText:
      '解の公式で複素数解を出し、|z|=√(a^2+b^2) を計算する。1の立方根になることも多い。',
  },
  {
    id: 'sp-coord-01',
    subject: 'math',
    unit: '図形と方程式',
    unitId: 'math2-coordinate-geometry',
    level: 'basic',
    patternName: 'パターン1: 点と直線の距離',
    exampleQuestion: '点 $(1,2)$ と直線 $3x+4y-5=0$ の距離を求めよ。',
    strategyText: 'd=|ax0+by0+c|/√(a^2+b^2) に代入する。直線を ax+by+c=0 に直してから使う。',
  },
  {
    id: 'sp-coord-02',
    subject: 'math',
    unit: '図形と方程式',
    unitId: 'math2-coordinate-geometry',
    level: 'standard',
    patternName: 'パターン2: 円と直線の共有点',
    exampleQuestion: '円 $x^2+y^2=4$ と直線 $y=x+k$ が接する k を求めよ。',
    strategyText:
      '代入して2次方程式にし D=0、または中心から直線までの距離=半径。',
  },
  {
    id: 'sp-coord-03',
    subject: 'math',
    unit: '図形と方程式',
    unitId: 'math2-coordinate-geometry',
    level: 'advanced',
    patternName: 'パターン3: 領域と最大最小',
    exampleQuestion: '$x\\ge 0$，$y\\ge 0$，$x+y\\le 4$ で $2x+y$ の最大値を求めよ。',
    strategyText:
      '線形なら頂点を調べる。曲線境界なら接する条件や偏り（一方を固定）で評価する。',
  },
  {
    id: 'sp-stat-01',
    subject: 'math',
    unit: '統計的な推測',
    unitId: 'mathB-statistics',
    level: 'basic',
    patternName: 'パターン1: 二項分布の期待値',
    exampleQuestion: '成功率 $1/4$ の試行を $20$ 回行うとき、成功回数の期待値を求めよ。',
    strategyText: 'B(n,p) の期待値は np。分散は np(1-p)。公式をそのまま使う。',
  },
  {
    id: 'sp-stat-02',
    subject: 'math',
    unit: '統計的な推測',
    unitId: 'mathB-statistics',
    level: 'standard',
    patternName: 'パターン2: 正規分布への近似',
    exampleQuestion: 'B(100, 1/2) を正規分布で近似するとき、平均と分散を求めよ。',
    strategyText:
      'np と np(1-p) を計算し N(μ,σ^2) と見る。連続補正が必要な場合は ±0.5 を意識する。',
  },
  {
    id: 'sp-stat-03',
    subject: 'math',
    unit: '統計的な推測',
    unitId: 'mathB-statistics',
    level: 'advanced',
    patternName: 'パターン3: 母平均の区間推定',
    exampleQuestion: '標本平均 $50$、標本サイズ $n=100$、σ=10 のとき 95% 信頼区間を求めよ（z=1.96）。',
    strategyText:
      '区間は 平均 ± z · σ/√n。信頼度で z を選び、標本サイズの影響を解釈する。',
  },
  {
    id: 'sp-param-01',
    subject: 'math',
    unit: '曲線の媒介変数表示・極座標',
    unitId: 'math3-parametric-polar',
    level: 'basic',
    patternName: 'パターン1: 媒介変数表示の接線の傾き',
    exampleQuestion: '$x=t^2$，$y=2t$ の $t=2$ における $dy/dx$ を求めよ。',
    strategyText: 'dy/dx=(dy/dt)/(dx/dt)。それぞれ t で微分して比を取る。',
  },
  {
    id: 'sp-param-02',
    subject: 'math',
    unit: '曲線の媒介変数表示・極座標',
    unitId: 'math3-parametric-polar',
    level: 'standard',
    patternName: 'パターン2: 極方程式と直交座標',
    exampleQuestion: '$r=2\\cos\\theta$ を直交座標の方程式に直せ。',
    strategyText:
      'x=r cosθ，y=r sinθ，r^2=x^2+y^2 を使って r,θ を消す。円になることが多い。',
  },
  {
    id: 'sp-complex-01',
    subject: 'math',
    unit: '複素数平面・2次曲線',
    unitId: 'mathC-complex-plane-conics',
    level: 'basic',
    patternName: 'パターン1: 複素数の絶対値',
    exampleQuestion: '$z=3+4i$ のとき $|z|$ を求めよ。',
    strategyText: '|z|=√(a^2+b^2)。原点からの距離と同じ。',
  },
  {
    id: 'sp-complex-02',
    subject: 'math',
    unit: '複素数平面・2次曲線',
    unitId: 'mathC-complex-plane-conics',
    level: 'standard',
    patternName: 'パターン2: ド・モアブルの定理',
    exampleQuestion: '$(\\cos 20^\\circ + i\\sin 20^\\circ)^3$ を求めよ。',
    strategyText: '(cosθ+i sinθ)^n = cos(nθ)+i sin(nθ)。偏角を n 倍、絶対値は n 乗。',
  },
  {
    id: 'sp-complex-03',
    subject: 'math',
    unit: '複素数平面・2次曲線',
    unitId: 'mathC-complex-plane-conics',
    level: 'advanced',
    patternName: 'パターン3: 楕円の標準形',
    exampleQuestion: '$\\dfrac{x^2}{9}+\\dfrac{y^2}{4}=1$ の長軸の長さと焦点を求めよ。',
    strategyText:
      'a>b なら長軸 2a、焦点は (±c,0)、c=√(a^2-b^2)。離心率 e=c/a もセットで覚える。',
  },
  {
    id: 'sp-atomic-01',
    subject: 'physics',
    unit: '原子',
    unitId: 'physics-atomic',
    level: 'basic',
    patternName: 'パターン1: 半減期と残存量',
    exampleQuestion: '半減期 $4$ 年の試料が初め $80$ g。$12$ 年後の残存量を求めよ。',
    strategyText: '経過時間が半減期の何倍かを数え、N=N0·(1/2)^{t/T} を使う。',
  },
  {
    id: 'sp-atomic-02',
    subject: 'physics',
    unit: '原子',
    unitId: 'physics-atomic',
    level: 'standard',
    patternName: 'パターン2: 光電効果',
    exampleQuestion: '仕事関数 $2.0$ eV の金属にエネルギー $3.5$ eV の光子を当てたときの最大運動エネルギーを求めよ。',
    strategyText: 'Einstein の式 K_max=hν-W。閾値周波数は W=hν0。',
  },
  {
    id: 'sp-acid-01',
    subject: 'chemistry',
    unit: '酸と塩基・中和',
    unitId: 'chemistry-acid-base',
    level: 'basic',
    patternName: 'パターン1: 中和の量的関係',
    exampleQuestion: '$0.10$ mol/L の HCl $20$ mL を中和する $0.20$ mol/L NaOH の体積を求めよ。',
    strategyText: '1価どうしなら c1v1=c2v2。価数が違うときは n を掛ける。',
  },
  {
    id: 'sp-acid-02',
    subject: 'chemistry',
    unit: '酸と塩基・中和',
    unitId: 'chemistry-acid-base',
    level: 'standard',
    patternName: 'パターン2: pH の計算',
    exampleQuestion: '$0.010$ mol/L の塩酸の pH を求めよ。',
    strategyText: '強酸は [H+]=濃度。pH=-log10[H+]。弱酸は Ka と近似 [H+]=√(Ka c)。',
  },
  {
    id: 'sp-acid-03',
    subject: 'chemistry',
    unit: '酸と塩基・中和',
    unitId: 'chemistry-acid-base',
    level: 'advanced',
    patternName: 'パターン3: 中和滴定曲線の読み取り',
    exampleQuestion: '弱酸を強塩基で滴定するとき、当量点の pH は 7 より大きいか小さいか。',
    strategyText:
      '当量点では塩の加水分解が効く。弱酸+強塩基なら塩基性（pH>7）。指示薬は変色域で選ぶ。',
  },
  {
    id: 'sp-redox-01',
    subject: 'chemistry',
    unit: '酸化還元反応',
    unitId: 'chemistry-redox',
    level: 'basic',
    patternName: 'パターン1: 酸化数の増減',
    exampleQuestion: '$\\mathrm{MnO_4^-}$ の Mn の酸化数を求めよ。',
    strategyText: 'O は -2、全体の電荷との帳尻で中心原子の酸化数を出す。',
  },
  {
    id: 'sp-redox-02',
    subject: 'chemistry',
    unit: '酸化還元反応',
    unitId: 'chemistry-redox',
    level: 'standard',
    patternName: 'パターン2: 電子の授受で物質量を決める',
    exampleQuestion: '電子5個を受け取る酸化剤 $0.02$ mol と反応する、電子1個を出す還元剤は何 mol か。',
    strategyText: '(酸化剤mol)×(受け取るe)=(還元剤mol)×(放出するe)。',
  },
  {
    id: 'sp-redox-03',
    subject: 'chemistry',
    unit: '酸化還元反応',
    unitId: 'chemistry-redox',
    level: 'advanced',
    patternName: 'パターン3: 電気分解の電気量',
    exampleQuestion: '$2.0$ A で $965$ s 電気分解したとき流れた電子は何 mol か（F=9.65×10^4）。',
    strategyText: 'Q=It、電子の mol は Q/F。析出量は半反応の係数比で換算する。',
  },
  {
    id: 'sp-eq-01',
    subject: 'chemistry',
    unit: '化学平衡',
    unitId: 'chemistry-equilibrium',
    level: 'basic',
    patternName: 'パターン1: 平衡定数の定義',
    exampleQuestion: 'A+B⇌C+D で各濃度が $1,2,2,3$ mol/L のとき K を求めよ。',
    strategyText: 'K=[生成物]/[反応物]（係数は指数）。固体・純液体は 1 とおく。',
  },
  {
    id: 'sp-eq-02',
    subject: 'chemistry',
    unit: '化学平衡',
    unitId: 'chemistry-equilibrium',
    level: 'standard',
    patternName: 'パターン2: ルシャトリエの原理',
    exampleQuestion: '発熱反応 2A⇌B で温度を上げると平衡はどちらに動くか。',
    strategyText:
      '変化を打ち消す向きに動く。温度上昇は吸熱側、加圧は分子数の少ない側、濃度増加はその物質を減らす側。',
  },
  {
    id: 'sp-eq-03',
    subject: 'chemistry',
    unit: '化学平衡',
    unitId: 'chemistry-equilibrium',
    level: 'advanced',
    patternName: 'パターン3: 電離平衡と Ka',
    exampleQuestion: '酢酸 $0.10$ mol/L、Ka=1.8×10^{-5} の [H+] を近似で求めよ。',
    strategyText: 'x^2/(c-x)≈x^2/c=Ka より x=√(Ka c)。近似の条件 x≪c を最後に確認する。',
  },
  {
    id: 'sp-poly-01',
    subject: 'chemistry',
    unit: '高分子化合物',
    unitId: 'chemistry-polymer',
    level: 'basic',
    patternName: 'パターン1: 平均重合度',
    exampleQuestion: '単量体分子量 $28$、高分子の平均分子量 $28000$ のとき平均重合度を求めよ。',
    strategyText: 'n ≈ M(高分子)/M(単量体)。付加重合では原子の脱落がない。',
  },
  {
    id: 'sp-poly-02',
    subject: 'chemistry',
    unit: '高分子化合物',
    unitId: 'chemistry-polymer',
    level: 'standard',
    patternName: 'パターン2: 縮合重合と脱離',
    exampleQuestion: 'アミノ酸 $n$ 分子が縮合して直鎖ペプチドになるとき、生じる水は何分子か。',
    strategyText:
      '直鎖なら水は n-1 分子。環状なら n 分子。エステル・ナイロンも同じ「結合数=脱離数」。',
  },
  {
    id: 'sp-mech-04',
    subject: 'physics',
    unit: '力学',
    unitId: 'physics-mechanics',
    level: 'advanced',
    patternName: 'パターン4: 斜面上の運動と摩擦力',
    exampleQuestion: '角度 $30^\\circ$ の粗い斜面（μ=1/√3）を下ろす質量 $m$ の加速度を求めよ。',
    strategyText:
      '斜面方向: mg sinθ-μN、垂直: N=mg cosθ。静止/運動の摩擦を区別し、降りるか止まるかを先に判定する。',
  },
  {
    id: 'sp-thermo-03',
    subject: 'physics',
    unit: '熱力学',
    unitId: 'physics-thermodynamics',
    level: 'standard',
    patternName: 'パターン3: 熱力学第一法則',
    exampleQuestion: '気体が $Q=300$ J の熱を受け、$W=120$ J の仕事をした。内部エネルギーの変化を求めよ。',
    strategyText:
      'ΔU=Q-W（仕事を気体がしたとき）。等積は W=0、等温（理想気体）は ΔU=0。過程ごとに簡略化する。',
  },
  {
    id: 'sp-numbers-04',
    subject: 'math',
    unit: '数と式',
    unitId: 'math-1a-numbers-and-expressions',
    level: 'standard',
    patternName: 'パターン4: 1次不等式の解の図示',
    exampleQuestion: '不等式 $3x-5 < 2x+1$ を解け。',
    strategyText: '移項して x の係数を正にそろえ、不等号の向きに注意して数直線に図示する。',
  },
  {
    id: 'sp-quadratic-06',
    subject: 'math',
    unit: '2次関数',
    unitId: 'math-1a-quadratic-functions',
    level: 'standard',
    patternName: 'パターン6: 2次不等式と符号表',
    exampleQuestion: '$x^2-5x+6 < 0$ を解け。',
    strategyText: '因数分解して (x-2)(x-3)<0。符号表または放物線が負になる区間が解。',
  },
  {
    id: 'sp-data-03',
    subject: 'math',
    unit: 'データの分析',
    unitId: 'math-1a-data-analysis',
    level: 'basic',
    patternName: 'パターン3: 四分位数と箱ひげ図',
    exampleQuestion: 'データ $1,3,4,6,8,9,12$ の第1四分位数 $Q_1$ を求めよ。',
    strategyText: '小さい順に並べ、中央値で前後に分け、前半の中央値が Q1。箱ひげは Q1-Q2-Q3 を箱にする。',
  },
  {
    id: 'sp-prob-04',
    subject: 'math',
    unit: '場合の数と確率',
    unitId: 'math-1a-combinatorics-probability',
    level: 'standard',
    patternName: 'パターン4: 期待値の線形性',
    exampleQuestion: 'サイコロ1個の出目の期待値を求めよ。',
    strategyText: 'E[X]=Σ x P(x)。独立なら和の期待値は期待値の和。数え上げより線形性の方が速いことが多い。',
  },
  {
    id: 'sp-trig-func-05',
    subject: 'math',
    unit: '三角関数',
    unitId: 'math-2bc-trigonometric-functions',
    level: 'standard',
    patternName: 'パターン5: 2倍角・半角公式',
    exampleQuestion: '$\\cos 2\\theta$ を $\\cos\\theta$ だけで表し、$\\theta=30^\\circ$ の値を求めよ。',
    strategyText: 'cos2θ=2cos^2θ-1=1-2sin^2θ=cos^2θ-sin^2θ。求める量に合わせて使い分ける。',
  },
  {
    id: 'sp-sequence-05',
    subject: 'math',
    unit: '数列',
    unitId: 'math-2bc-sequences',
    level: 'advanced',
    patternName: 'パターン5: 数学的帰納法',
    exampleQuestion: 'すべての自然数 n で $1+2+\\cdots+n=n(n+1)/2$ を帰納法で示せ。',
    strategyText: 'n=1 を確認し、n=k を仮定して n=k+1 を導く。等式・不等式・割り切れることで書き方が少し変わる。',
  },
  {
    id: 'sp-limit-03',
    subject: 'math',
    unit: '極限',
    unitId: 'math-3-limits',
    level: 'advanced',
    patternName: 'パターン3: 無限等比級数',
    exampleQuestion: '$\\sum_{n=0}^{\\infty} (1/3)^n$ を求めよ。',
    strategyText: '|r|<1 なら和は a/(1-r)。|r|≧1 は発散。初項と公比の取り方を確認する。',
  },
  {
    id: 'sp-diff3-03',
    subject: 'math',
    unit: '微分法（数III）',
    unitId: 'math-3-differentiation',
    level: 'advanced',
    patternName: 'パターン3: 逆関数の微分',
    exampleQuestion: '$y=\\sin^{-1}x$ の導関数を求めよ。',
    strategyText: 'x=f(y) の両辺を x で微分し dy/dx=1/f\'(y)。y を x に戻す。',
  },
  {
    id: 'sp-int3-03',
    subject: 'math',
    unit: '積分法（数III）',
    unitId: 'math-3-integration',
    level: 'standard',
    patternName: 'パターン3: 部分積分の定積分',
    exampleQuestion: '$\\displaystyle\\int_0^{\\pi} x\\sin x\\,dx$ を求めよ。',
    strategyText: '微分して簡単になる方を u、残りを dv。定積分は [uv] の端点を先に計算するとミスが減る。',
  },
  {
    id: 'sp-vector-05',
    subject: 'math',
    unit: 'ベクトル',
    unitId: 'math-2bc-vectors',
    level: 'advanced',
    patternName: 'パターン5: 空間の直線の方向ベクトル',
    exampleQuestion: '点 A(1,0,0) と B(1,2,2) を通る直線の方向ベクトルを1つ求めよ。',
    strategyText: '方向ベクトルは AB。直線上の点は A+t AB。交わり・ねじれは方向と位置の一次独立で判定する。',
  },
  {
    id: 'sp-waves-04',
    subject: 'physics',
    unit: '波動',
    unitId: 'physics-waves',
    level: 'standard',
    patternName: 'パターン4: 干渉の経路差',
    exampleQuestion: '波長 $0.40$ m の波で経路差 $0.20$ m の点は強め合うか弱め合うか。',
    strategyText: '同位相なら経路差=整数×λ で強め、半整数で弱め。逆位相なら逆。',
  },
  {
    id: 'sp-emag-04',
    subject: 'physics',
    unit: '電磁気',
    unitId: 'physics-electromagnetism',
    level: 'advanced',
    patternName: 'パターン4: ローレンツ力と等速円運動',
    exampleQuestion: '磁場 B 中を速さ v で入射した電荷 q の円運動の半径を求めよ。',
    strategyText: 'qvB=mv^2/r より r=mv/(qB)。周期 T=2πm/(qB) は速さによらない。',
  },
  {
    id: 'sp-mole-03',
    subject: 'chemistry',
    unit: '物質の構成',
    unitId: 'chemistry-composition',
    level: 'advanced',
    patternName: 'パターン3: 結晶の密度と単位格子',
    exampleQuestion: '一辺 a の立方晶、単位格子に原子4個、原子量 M の密度を記号で表せ。',
    strategyText: 'd = (Z M)/(N_A a^3)。Z は格子の種類（fcc=4, bcc=2）で決まる。',
  },
  {
    id: 'sp-organic-03',
    subject: 'chemistry',
    unit: '有機化学',
    unitId: 'chemistry-organic',
    level: 'advanced',
    patternName: 'パターン3: 官能基の定性反応',
    exampleQuestion: '銀鏡反応が陽性の化合物が持つ官能基は何か。',
    strategyText: 'アルデヒドは銀鏡・フェーリング、カルボン酸は炭酸水素ナトリウム、フェノールは塩化鉄(III)。表で対応づける。',
  },
  {
    id: 'sp-inorganic-03',
    subject: 'chemistry',
    unit: '無機化学',
    unitId: 'chemistry-inorganic',
    level: 'advanced',
    patternName: 'パターン3: 両性元素の反応',
    exampleQuestion: 'アルミニウムが強塩基に溶けるときのイオン式を書け。',
    strategyText: 'Al, Zn, Sn, Pb は酸にも塩基にも溶ける。錯イオン（[Al(OH)4]- など）まで書く。',
  },
  {
    id: 'sp-mechanics-05',
    subject: 'physics',
    unit: '力学',
    unitId: 'physics-mechanics',
    level: 'advanced',
    patternName: 'パターン5: 単振動の周期',
    exampleQuestion: 'ばね定数 k、質量 m の単振動の周期を求めよ。',
    strategyText: 'ma=-kx を ω^2=k/m と見て T=2π√(m/k)。振り子は T=2π√(l/g)。復元力が変位に比例するかを先に見る。',
  },
  {
    id: 'sp-thermo-04',
    subject: 'physics',
    unit: '熱力学',
    unitId: 'physics-thermodynamics',
    level: 'advanced',
    patternName: 'パターン4: 断熱過程とポアソンの法則',
    exampleQuestion: '単原子理想気体の断熱で V が2倍になったとき T はどうなるか。',
    strategyText: 'TV^{γ-1}=一定、PV^γ=一定。γ=Cp/Cv。断熱は Q=0 なので ΔU=-W。',
  },
  {
    id: 'sp-reactions-04',
    subject: 'chemistry',
    unit: '物質の変化（理論化学）',
    unitId: 'chemistry-reactions',
    level: 'advanced',
    patternName: 'パターン4: 熱化学方程式と反応熱',
    exampleQuestion: 'C+O2=CO2+394 kJ、2CO+O2=2CO2+566 kJ から C+1/2 O2=CO の反応熱を求めよ。',
    strategyText: 'ヘスの法則で式を加減する。求める式の係数に合わせて既知の式を操作する。',
  },
  {
    id: 'sp-coord-04',
    subject: 'math',
    unit: '図形と方程式',
    unitId: 'math2-coordinate-geometry',
    level: 'standard',
    patternName: 'パターン4: 軌跡の方程式',
    exampleQuestion: '点 (2,0) からの距離が点 (0,0) からの距離の2倍である点の軌跡を求めよ。',
    strategyText: '条件を距離の等式に書き、平方して整理する。円や直線になることが多い。',
  },
  {
    id: 'sp-explog-05',
    subject: 'math',
    unit: '指数関数・対数関数',
    unitId: 'math-2bc-exponential-logarithmic',
    level: 'advanced',
    patternName: 'パターン5: 指数・対数不等式',
    exampleQuestion: '$2^x > 8$ を解け。',
    strategyText: '底が1より大きい対数は不等号を保ち、0<底<1は逆向き。真数条件を先に書く。',
  },
  {
    id: 'sp-acid-04',
    subject: 'chemistry',
    unit: '酸と塩基・中和',
    unitId: 'chemistry-acid-base',
    level: 'standard',
    patternName: 'パターン4: 水のイオン積',
    exampleQuestion: '$25^\\circ$C で [H+]=1.0×10^{-3} のとき [OH-] を求めよ。',
    strategyText: 'Kw=[H+][OH-]=1.0×10^{-14}（25℃）。一方が分かれば他方が出る。',
  },
  {
    id: 'sp-complex-04',
    subject: 'math',
    unit: '複素数平面・2次曲線',
    unitId: 'mathC-complex-plane-conics',
    level: 'standard',
    patternName: 'パターン4: 複素数の偏角と回転',
    exampleQuestion: '$z=1+i$ を原点まわりに $90^\\circ$ 回転した点を求めよ。',
    strategyText: 'i を掛けると90°回転。一般に r(cosθ+i sinθ) を掛けると偏角が加算される。',
  },
  {
    id: 'sp-atomic-03',
    subject: 'physics',
    unit: '原子',
    unitId: 'physics-atomic',
    level: 'advanced',
    patternName: 'パターン3: ボーア模型のエネルギー準位',
    exampleQuestion: '水素原子で n=2 から n=1 へ落ちるときの光子エネルギーを、E_n=-13.6/n^2 eV で求めよ。',
    strategyText: 'ΔE=E_high-E_low が光子エネルギー。波長は E=hc/λ。バルマー・ライマンの系列と対応づける。',
  },
  {
    id: 'sp-param-03',
    subject: 'math',
    unit: '曲線の媒介変数表示・極座標',
    unitId: 'math3-parametric-polar',
    level: 'advanced',
    patternName: 'パターン3: 極方程式の面積',
    exampleQuestion: '$r=a(1+\\cos\\theta)$ が囲む面積の公式の形を述べよ。',
    strategyText: '極座標の面積は (1/2)∫ r^2 dθ。対称性で区間を半分にして2倍すると計算が楽。',
  },
  {
    id: 'sp-stat-04',
    subject: 'math',
    unit: '統計的な推測',
    unitId: 'mathB-statistics',
    level: 'standard',
    patternName: 'パターン4: 仮説検定の考え方',
    exampleQuestion: '帰無仮説のもとで観測以上に極端な結果が出る確率が 0.02 のとき、有意水準 5% で棄却するか。',
    strategyText: 'p値が有意水準より小さければ棄却。第1種・第2種の誤りを混同しない。',
  },
  {
    id: 'sp-eq-04',
    subject: 'chemistry',
    unit: '化学平衡',
    unitId: 'chemistry-equilibrium',
    level: 'standard',
    patternName: 'パターン4: 圧平衡定数 Kp',
    exampleQuestion: '2A(g)⇌B(g) で Kc と Kp の関係を述べよ。',
    strategyText: 'Kp=Kc (RT)^{Δn}。Δn は気体の係数差。固体は K に入れない。',
  },
  {
    id: 'sp-poly-03',
    subject: 'chemistry',
    unit: '高分子化合物',
    unitId: 'chemistry-polymer',
    level: 'advanced',
    patternName: 'パターン3: 天然高分子の識別',
    exampleQuestion: 'デンプンをヨウ素液で呈色させたときの色は何か。',
    strategyText: 'デンプンは青紫、タンパク質はビウレット、還元糖はフェーリング。構造（アミロースの螺旋）と結びつける。',
  },
  {
    id: 'sp-plane-04',
    subject: 'math',
    unit: '図形の性質',
    unitId: 'mathA-plane-geometry',
    level: 'standard',
    patternName: 'パターン4: チェバの定理',
    exampleQuestion: '三角形の内部の1点と各頂点を結ぶ直線が対辺を分ける比の積が1になる定理の名を答えよ。',
    strategyText: 'チェバは concurrent（1点で交わる）、メネラウスは一直線。比を辺に沿って一周して積=1。',
  },
  {
    id: 'sp-proof-04',
    subject: 'math',
    unit: 'いろいろな式（式と証明・複素数と方程式）',
    unitId: 'math2-expressions-and-proof',
    level: 'standard',
    patternName: 'パターン4: 相加相乗平均',
    exampleQuestion: '$x>0$ のとき $x+1/x$ の最小値を求めよ。',
    strategyText: 'x+1/x ≥ 2。等号は x=1/x。条件つきは代入やパラメータで帰着する。',
  },
  {
    id: 'sp-diff2-05',
    subject: 'math',
    unit: '微分法（数II）',
    unitId: 'math-2bc-differentiation',
    level: 'standard',
    patternName: 'パターン5: 平均変化率と微分係数',
    exampleQuestion: '$f(x)=x^2$ の x=1 から x=1+h の平均変化率の h→0 の極限を求めよ。',
    strategyText: '平均変化率 [f(a+h)-f(a)]/h の極限が f\'(a)。定義に戻る問題は約分してから極限。',
  },
  {
    id: 'sp-int2-04',
    subject: 'math',
    unit: '積分法（数II）',
    unitId: 'math-2bc-integration',
    level: 'standard',
    patternName: 'パターン4: 偶関数・奇関数の定積分',
    exampleQuestion: '$\\displaystyle\\int_{-1}^{1} x^3\\,dx$ を求めよ。',
    strategyText: '奇関数を対称区間で積分すると 0。偶関数は 2∫[0,a]。まず偶奇を判定する。',
  },
];

for (const pattern of SOLUTION_PATTERNS) {
  pattern.subtopicId = resolveSubtopicIdForPattern(pattern);
}

// ------------------------------------------
// ヘルパー関数
// ------------------------------------------

export function getSolutionPatternsByUnit(unitId: string): SolutionPattern[] {
  return SOLUTION_PATTERNS.filter((pattern) => pattern.unitId === unitId);
}

export function getSolutionPatternsBySubtopic(subtopicId: string): SolutionPattern[] {
  return SOLUTION_PATTERNS.filter((pattern) => pattern.subtopicId === subtopicId);
}

export function getPatternDefaultDifficulty(level: SolutionPattern['level']): number {
  if (level === 'basic') return 2;
  if (level === 'standard') return 5;
  return 9;
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

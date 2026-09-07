// ==========================================
// Apex Suite: Math Lab - Local Pattern Discovery Engine
// ==========================================
// OPENAI_API_KEY 未設定時のゼロコスト発掘。単元ごとの「まだ図鑑に無い」
// 入試パターンを 3〜5 件返す。同じ単元を何度掘っても、除外リストと乱数で
// 別角度のパターンが出るようにしてある。

import type { PatternLevel, SolutionPattern, Subject } from '@/types/mathLab';
import { getUnitById } from '@/data/unitsData';

interface PatternSeed {
  level: PatternLevel;
  patternName: string;
  exampleQuestion: string;
  strategyText: string;
}

const DISCOVERY_POOL: Record<string, PatternSeed[]> = {
  'math-1a-numbers-and-expressions': [
    { level: 'basic', patternName: '二重根号の簡単化', exampleQuestion: '$\\sqrt{8+2\\sqrt{15}}$ を簡単にせよ。', strategyText: '√(a+b+2√(ab))=(√a+√b) の形を探す。内側の積と和が合う2数を見つける。' },
    { level: 'standard', patternName: '対称式の最大最小', exampleQuestion: '$x+y=4$，$xy=3$ のとき $x^3+y^3$ を求めよ。', strategyText: 'x^3+y^3=(x+y)((x+y)^2-3xy) に基本対称式を代入する。' },
    { level: 'advanced', patternName: '高次不等式の場合分け', exampleQuestion: '$(x-1)(x-2)(x-3)>0$ を解け。', strategyText: '根で数直線を区切り、各区間の符号を調べる。端点は等号の有無で入れる。' },
    { level: 'standard', patternName: '有理化の工夫', exampleQuestion: '分母を有理化せよ。$1/(\\sqrt{3}-\\sqrt{2})$', strategyText: '共役を掛ける。入れ子の根号は内側から順に有理化する。' },
    { level: 'advanced', patternName: '整数条件つき不等式', exampleQuestion: '$n$ が自然数のとき $n+1/n$ が整数になる n を求めよ。', strategyText: 'n が n の約数になる条件に帰着し、有限個を調べる。' },
  ],
  'math-1a-quadratic-functions': [
    { level: 'standard', patternName: '2次関数と直線の共有条件', exampleQuestion: '$y=x^2$ と $y=kx+1$ が接する k を求めよ。', strategyText: '代入して D=0。幾何的には中心距離=半径の発想と同じ。' },
    { level: 'advanced', patternName: '定義域つき最大のグラフ読み', exampleQuestion: '$f(x)=x^2-2x$（$1\\le x\\le 4$）の最大・最小を求めよ。', strategyText: '軸と端点を比較。下に凸なら最小は軸に近い点、最大は遠い端。' },
    { level: 'basic', patternName: '平行移動で式を作る', exampleQuestion: '$y=x^2$ を x 方向に 3、y 方向に -1 だけ平行移動した式を求めよ。', strategyText: 'y-q=a(x-p)^2。移動量を p,q にそのまま入れる。' },
    { level: 'advanced', patternName: '係数決定と判別式の融合', exampleQuestion: '$x^2+ax+a=0$ が実数解を持つ a の範囲を求めよ。', strategyText: 'D=a^2-4a≧0。a(a-4)≧0 を数直線で解く。' },
    { level: 'standard', patternName: '2次関数の決定（3点指定）', exampleQuestion: '(0,1),(1,2),(2,5) を通る y=ax^2+bx+c を求めよ。', strategyText: '3点を代入して連立。頂点指定なら標準形の方が速い。' },
  ],
  'math-1a-trigonometric-ratios': [
    { level: 'standard', patternName: '三角形の面積公式', exampleQuestion: '$b=5$，$c=6$，$A=60^\\circ$ の面積を求めよ。', strategyText: 'S=½bc sinA。正弦定理と組み合わせて2辺挟角に持ち込む。' },
    { level: 'advanced', patternName: 'ヘロンの公式', exampleQuestion: '3辺 5,5,6 の三角形の面積を求めよ。', strategyText: 's=(a+b+c)/2，S=√{s(s-a)(s-b)(s-c)}。余弦定理経由でも検算できる。' },
    { level: 'basic', patternName: '三角比の拡張（鈍角）', exampleQuestion: '$\\cos 120^\\circ$ の値を求めよ。', strategyText: '単位円または 180°-θ の公式。鈍角の cos は負。' },
    { level: 'standard', patternName: '正弦定理で外接円半径', exampleQuestion: '$a=6$，$A=30^\\circ$ のとき R を求めよ。', strategyText: 'a/sinA=2R をそのまま使う。' },
  ],
  'math-1a-data-analysis': [
    { level: 'standard', patternName: '変動係数の比較', exampleQuestion: '平均 50 標準偏差 10 と平均 80 標準偏差 12 のどちらが相対的に散らばっているか。', strategyText: 'CV=σ/平均。単位や尺度が違う集団の比較に使う。' },
    { level: 'advanced', patternName: '共分散の符号と散布図', exampleQuestion: '右下がりの散布図の共分散の符号は何か。', strategyText: '共分散の符号=相関の符号。大きさは標準偏差で正規化して r にする。' },
    { level: 'basic', patternName: '平均値と中央値の使い分け', exampleQuestion: '外れ値があるとき、代表値として中央値が好まれる理由を述べよ。', strategyText: '平均は外れ値に弱い。中央値・四分位は頑健。' },
  ],
  'math-1a-combinatorics-probability': [
    { level: 'advanced', patternName: '包除原理', exampleQuestion: '1〜100 で 2 または 5 の倍数は何個か。', strategyText: '|A∪B|=|A|+|B|-|A∩B|。3集合はさらに交差を足し引きする。' },
    { level: 'standard', patternName: '同じものを含む順列', exampleQuestion: 'A,A,B,C の並び方は何通りか。', strategyText: '4!/2!。区別できないものの階乗で割る。' },
    { level: 'advanced', patternName: 'ベイズの定理', exampleQuestion: '事前確率 0.1 の検査（感度0.9、偽陽性0.1）で陽性のとき、本当に陽性である確率を求めよ。', strategyText: 'P(A|B)=P(B|A)P(A)/P(B)。P(B) は全確率で分ける。' },
    { level: 'basic', patternName: '独立試行の積', exampleQuestion: 'コインを3回投げてすべて表の確率を求めよ。', strategyText: '独立なら掛け算。従属なら条件付きに切り替える。' },
  ],
  'mathA-plane-geometry': [
    { level: 'advanced', patternName: 'メネラウスの定理', exampleQuestion: '三角形の辺を一直線が切るとき、分比の積はいくつか。', strategyText: '一直線なら分比の積=1（向きつき）。チェバと使い分ける。' },
    { level: 'standard', patternName: '接弦定理', exampleQuestion: '接線と弦が作る角と、その弦が囲む円周角の関係を述べよ。', strategyText: '接線と弦のなす角=弦の円周角（接弦定理）。' },
    { level: 'basic', patternName: '三角形の内心と傍心', exampleQuestion: '内心はどの線の交点か。', strategyText: '内心=角の二等分線。傍心は外角の二等分線。' },
  ],
  'mathA-integers': [
    { level: 'advanced', patternName: '合同式の基本操作', exampleQuestion: '$17 \\equiv 2 \\pmod 5$ を用いて $17^2$ を 5 で割った余りを求めよ。', strategyText: '和・積は合同を保つ。指数は繰り返し掛けるかオイラー。' },
    { level: 'standard', patternName: '約数の個数', exampleQuestion: '$12=2^2·3$ の正の約数は何個か。', strategyText: '(e1+1)(e2+1)…。和は等比の積。' },
    { level: 'basic', patternName: '倍数判定法', exampleQuestion: '315 は 3 の倍数か。', strategyText: '各位の和が 3 の倍数。9,11 も別ルールがある。' },
  ],
  'math2-expressions-and-proof': [
    { level: 'advanced', patternName: '複素数の極形式', exampleQuestion: '$1+i$ を極形式で表せ。', strategyText: 'r=√2，θ=π/4。掛け算は偏角の和。' },
    { level: 'standard', patternName: '等式証明の加減', exampleQuestion: '$(a-b)^2+(b-c)^2+(c-a)^2 \\ge 0$ から何が分かるか。', strategyText: '平方和≧0。等号は a=b=c。不等式証明の常套。' },
    { level: 'basic', patternName: '二項定理の特定項', exampleQuestion: '$(x+2)^5$ の x^3 の係数を求めよ。', strategyText: '5C3 x^3 2^2。一般項 nCk a^{n-k} b^k。' },
  ],
  'math2-coordinate-geometry': [
    { level: 'advanced', patternName: '2円の共通弦', exampleQuestion: '2円の方程式を引くと何の方程式になるか。', strategyText: '引き算で共通弦（根軸）。交点を通る直線族にも使える。' },
    { level: 'standard', patternName: '円の接線の公式', exampleQuestion: '$x^2+y^2=r^2$ 上の点 (x0,y0) における接線を求めよ。', strategyText: 'xx0+yy0=r^2。一般の円は中心をずらす。' },
    { level: 'basic', patternName: '中点と距離', exampleQuestion: 'A(1,2), B(5,6) の中点を求めよ。', strategyText: '中点は平均、距離は三平方。直線の方向ベクトルとセット。' },
  ],
  'math-2bc-trigonometric-functions': [
    { level: 'advanced', patternName: '積和・和積の公式', exampleQuestion: '$\\sin 75^\\circ \\sin 15^\\circ$ を求めよ。', strategyText: '積を和に変えて計算。波形のうなりの元でもある。' },
    { level: 'standard', patternName: '三角関数の周期', exampleQuestion: '$y=\\sin 2x$ の周期を求めよ。', strategyText: 'sin(bx) の周期は 2π/|b|。合成後も振幅と周期を分離する。' },
    { level: 'basic', patternName: '単位円と符号', exampleQuestion: '第2象限で正になる三角比はどれか。', strategyText: 'All / Sin / Tan / Cos（ASTC）。符号だけで選択肢が切れる。' },
  ],
  'math-2bc-exponential-logarithmic': [
    { level: 'advanced', patternName: '対数の底の変換', exampleQuestion: '$\\log_2 9 / \\log_2 3$ を簡単にせよ。', strategyText: 'log_b a / log_b c = log_c a。同じ底なら商は変換公式。' },
    { level: 'standard', patternName: '指数の大小比較', exampleQuestion: '$2^{100}$ と $3^{60}$ の大小を比較せよ。', strategyText: '対数を取って log2 / log3 の比で比べる。' },
    { level: 'basic', patternName: '対数の定義域', exampleQuestion: '$\\log_2 (x-1)$ が定義される x の範囲を求めよ。', strategyText: '真数>0、底>0かつ≠1。複合は共通部分。' },
  ],
  'math-2bc-differentiation': [
    { level: 'advanced', patternName: '接線の本数と3次方程式', exampleQuestion: '点 (0,k) から y=x^3 に引ける接線の本数を k で場合分けせよ。', strategyText: '接点 t の方程式の実数解の個数=本数。増減で場合分け。' },
    { level: 'standard', patternName: '法線の方程式', exampleQuestion: '$y=x^2$ の x=1 における法線を求めよ。', strategyText: '法線の傾きは -1/f\'。接線と垂直。' },
    { level: 'basic', patternName: '積の微分', exampleQuestion: "$(x^2\\sin x)'$ を求めよ（数II範囲外でも公式確認）。", strategyText: '(fg)\'=f\'g+fg\'。数IIは多項式中心だが公式の型は同じ。' },
  ],
  'math-2bc-integration': [
    { level: 'advanced', patternName: '面積の最大（区間が動く）', exampleQuestion: 'y=x(1-x) と x 軸、x=t, x=t+0.2 で囲む面積の最大を論じよ。', strategyText: 'S(t) を積分で表し S\'(t)=0。幅一定なら平均値の定理的発想。' },
    { level: 'standard', patternName: '速度から変位', exampleQuestion: 'v=2t の 0〜3 秒の変位を求めよ。', strategyText: '変位は速度の定積分。距離は |v| を積分。' },
    { level: 'basic', patternName: '不定積分の定数', exampleQuestion: '$\\int 3x^2 dx$ を求めよ。', strategyText: 'x^3+C。初期条件があれば C を決める。' },
  ],
  'math-2bc-sequences': [
    { level: 'advanced', patternName: '隣接3項間漸化式', exampleQuestion: 'a_{n+2}-3a_{n+1}+2a_n=0 の一般項の型を述べよ。', strategyText: '特性方程式の2解 α,β から a_n=Aα^n+Bβ^n。重解は n r^n。' },
    { level: 'standard', patternName: '等比数列の無限和', exampleQuestion: '初項 1、公比 1/2 の無限和を求めよ。', strategyText: '|r|<1 で a/(1-r)。有限和の極限と同じ。' },
    { level: 'basic', patternName: '階差から一般項', exampleQuestion: 'a1=1，a_{n+1}-a_n=n の a_n を求めよ。', strategyText: 'a_n=a1+Σ_{k=1}^{n-1} 階差。和の公式に乗せる。' },
  ],
  'mathB-statistics': [
    { level: 'advanced', patternName: '標本平均の分散', exampleQuestion: '母分散 σ^2、標本サイズ n のとき標本平均の分散は何か。', strategyText: 'V(X̄)=σ^2/n。大きい n で推定が鋭くなる理由。' },
    { level: 'standard', patternName: '正規分布の標準化', exampleQuestion: 'N(50,10^2) で X≥60 を標準正規で表せ。', strategyText: 'Z=(X-μ)/σ。表または近似で確率を読む。' },
    { level: 'basic', patternName: '確率変数の分散公式', exampleQuestion: 'E[X]=3，E[X^2]=13 のとき V(X) を求めよ。', strategyText: 'V=E[X^2]-(E[X])^2。定義の展開と同じ。' },
  ],
  'math-3-limits': [
    { level: 'advanced', patternName: 'e の定義形への変形', exampleQuestion: '$\\lim (1+2/n)^n$ を求めよ。', strategyText: '(1+2/n)^{n/2·2} → e^2。形を (1+1/m)^m に合わせる。' },
    { level: 'standard', patternName: '無限大の分数関数', exampleQuestion: '$\\lim_{x\\to\\infty} (3x^2+1)/(x^2-x)$ を求めよ。', strategyText: '最高次で割る。次数の差で 0, 有限, ∞ が決まる。' },
    { level: 'basic', patternName: 'はさみうちの原理', exampleQuestion: '$|a_n|\\le 1/n$ のとき a_n の極限は。', strategyText: '-1/n ≤ a_n ≤ 1/n → 0。三角関数×1/x で頻出。' },
  ],
  'math-3-differentiation': [
    { level: 'advanced', patternName: '対数微分法', exampleQuestion: '$y=x^x$ の導関数を求めよ。', strategyText: 'log y = x log x を微分。積の多い関数も対数で和にする。' },
    { level: 'standard', patternName: '高次導関数', exampleQuestion: "$(e^{2x})''$ を求めよ。", strategyText: 'e^{ax} は a^n e^{ax}。sin, cos は4周期。' },
    { level: 'basic', patternName: '商の微分', exampleQuestion: "$(x/(x+1))'$ を求めよ。", strategyText: '(f/g)\'=(f\'g-fg\')/g^2。共通因数を約分する。' },
  ],
  'math-3-integration': [
    { level: 'advanced', patternName: '微分方程式の変数分離', exampleQuestion: 'dy/dx=ky の一般解を求めよ。', strategyText: 'dy/y=k dx。両辺積分して y=Ce^{kx}。初期条件で C。' },
    { level: 'standard', patternName: '置換積分の定積分', exampleQuestion: '$\\int_0^1 2x(x^2+1)^3 dx$ を求めよ。', strategyText: 'u=x^2+1，du=2x dx。区間も u に変換する。' },
    { level: 'basic', patternName: '基本関数の不定積分', exampleQuestion: '$\\int 1/x dx$ を求めよ。', strategyText: 'log|x|+C。絶対値を忘れない。' },
  ],
  'math3-parametric-polar': [
    { level: 'advanced', patternName: 'サイクロイドの接線', exampleQuestion: 'x=a(θ-sinθ), y=a(1-cosθ) の dy/dx を求めよ。', strategyText: 'dy/dθ ÷ dx/dθ。特異点は分母0を調べる。' },
    { level: 'standard', patternName: '極と直交の変換', exampleQuestion: 'r=2 を直交座標で表せ。', strategyText: 'x^2+y^2=4。直線 r cosθ=a は x=a。' },
    { level: 'basic', patternName: '媒介変数の消去', exampleQuestion: 'x=t，y=t^2 から y を x で表せ。', strategyText: 't=x を代入。円なら x^2+y^2 の形を作る。' },
  ],
  'math-2bc-vectors': [
    { level: 'advanced', patternName: '空間の平面の方程式', exampleQuestion: '点 (1,0,0) を通り法線 (1,1,1) の平面の方程式を求めよ。', strategyText: '法線·(r-r0)=0。3点指定なら2ベクトルの外積が法線。' },
    { level: 'standard', patternName: '位置ベクトルの内分', exampleQuestion: 'A,B を 2:1 に内分する点の位置ベクトルを求めよ。', strategyText: '(1·A+2·B)/3 ではなく (nA+mB)/(m+n) の対応を確認。' },
    { level: 'basic', patternName: 'ベクトルの大きさ', exampleQuestion: '|(3,4)| を求めよ。', strategyText: '√(x^2+y^2)。単位ベクトルは成分/大きさ。' },
  ],
  'mathC-complex-plane-conics': [
    { level: 'advanced', patternName: '1次分数変換', exampleQuestion: '$w=(z-i)/(z+i)$ が実軸をどこへ移すか概略を述べよ。', strategyText: '円円対応。実軸・単位円など典型曲線の像を追跡する。' },
    { level: 'standard', patternName: '双曲線の定義', exampleQuestion: '2焦点からの距離の差が一定な曲線は何か。', strategyText: '楕円=和一定、双曲線=差一定、放物線=焦点と準線。' },
    { level: 'basic', patternName: '共役複素数', exampleQuestion: '$z=2-3i$ の共役と積 z z̄ を求めよ。', strategyText: 'z z̄=|z|^2。実数条件は z=z̄。' },
  ],
  'physics-mechanics': [
    { level: 'advanced', patternName: '単振り子の等価', exampleQuestion: '長さ l の単振り子の微小振動の周期を求めよ。', strategyText: '接線方向 mg sinθ ≈ mgθ = -m l θ̈。ω^2=g/l。' },
    { level: 'standard', patternName: '仕事と運動エネルギーの定理', exampleQuestion: '10 N で 4 m 押したとき、質量 2 kg の速さの増加を求めよ（摩擦なし、初速0）。', strategyText: 'W=ΔK。力が一定なら Fx=½mv^2。' },
    { level: 'basic', patternName: '作用反作用', exampleQuestion: '壁を 20 N で押すとき、壁が手に及ぼす力はいくらか。', strategyText: '作用反作用は同一直線・逆向き・同じ大きさ。釣り合いとは別物。' },
    { level: 'advanced', patternName: 'ケプラーと万有引力', exampleQuestion: '円軌道の周期の2乗が半径の3乗に比例することを示せ。', strategyText: 'GMm/r^2=m v^2/r と T=2πr/v を連立。' },
  ],
  'physics-thermodynamics': [
    { level: 'advanced', patternName: 'カルノー効率', exampleQuestion: '高温 400 K、低温 300 K の理想効率を求めよ。', strategyText: 'η=1-T_L/T_H。絶対温度比。' },
    { level: 'standard', patternName: '定積・定圧モル熱容量', exampleQuestion: '単原子分子の Cv, Cp を R で表せ。', strategyText: 'Cv=3/2 R，Cp=Cv+R。γ=5/3。' },
    { level: 'basic', patternName: '絶対温度とセルシウス', exampleQuestion: '$27^\\circ$C を K で表せ。', strategyText: 'T=t+273。状態方程式は必ず K。' },
  ],
  'physics-waves': [
    { level: 'advanced', patternName: 'ヤングの干渉', exampleQuestion: 'スリット間隔 d、屏風まで L、波長 λ の明線間隔を求めよ。', strategyText: 'Δx=Lλ/d。経路差 d sinθ ≈ d x/L。' },
    { level: 'standard', patternName: 'うなり', exampleQuestion: '440 Hz と 444 Hz のうなりの回数は1秒あたり何回か。', strategyText: 'うなり周波数は |f1-f2|。' },
    { level: 'basic', patternName: '反射の位相', exampleQuestion: '固定端反射で位相はどうなるか。', strategyText: '固定端はπずれ（腹と節が入れ替わる）。自由端は同位相。' },
  ],
  'physics-electromagnetism': [
    { level: 'advanced', patternName: 'RL回路の時定数', exampleQuestion: 'R=10 Ω，L=0.2 H の時定数を求めよ。', strategyText: 'τ=L/R。電流は (E/R)(1-e^{-t/τ})。' },
    { level: 'standard', patternName: 'クーロンの法則', exampleQuestion: '1 μC どうしが 0.1 m 離れているときの力を求めよ（k=9.0×10^9）。', strategyText: 'F=k q1 q2 / r^2。符号で引力・斥力。' },
    { level: 'basic', patternName: '直列と並列の電流', exampleQuestion: '直列回路で各抵抗に流れる電流の関係は。', strategyText: '直列は電流共通、並列は電圧共通。' },
  ],
  'physics-atomic': [
    { level: 'advanced', patternName: 'コンプトン効果の概要', exampleQuestion: 'X線が電子に当たると波長はどうなるか。', strategyText: '散乱で波長が伸びる。エネルギー・運動量保存。' },
    { level: 'standard', patternName: '崩壊定数と半減期', exampleQuestion: '半減期 T と崩壊定数 λ の関係を書け。', strategyText: 'T=ln2 / λ。N=N0 e^{-λt}。' },
    { level: 'basic', patternName: '質量数と原子番号', exampleQuestion: 'α崩壊で質量数と原子番号はどう変わるか。', strategyText: 'αは -4 と -2。β- は原子番号 +1。' },
  ],
  'chemistry-composition': [
    { level: 'advanced', patternName: '実験式と分子式', exampleQuestion: '組成式 CH2O、分子量 180 の分子式を求めよ。', strategyText: '実験式量で分子量を割り、整数倍する。' },
    { level: 'standard', patternName: 'イオン結合と共有結合', exampleQuestion: 'NaCl と Cl2 の結合の違いは何か。', strategyText: '金属+非金属はイオン、非金属どうしは共有。電気陰性度差。' },
    { level: 'basic', patternName: 'アボガドロ定数', exampleQuestion: '2 mol の分子の個数を求めよ。', strategyText: 'N=n N_A。N_A=6.0×10^{23}。' },
  ],
  'chemistry-reactions': [
    { level: 'advanced', patternName: '混合気体の平均分子量', exampleQuestion: 'H2 と O2 が物質量比 2:1 の平均分子量を求めよ。', strategyText: 'M=Σ x_i M_i。密度比からも出せる。' },
    { level: 'standard', patternName: '水上置換と水蒸気圧', exampleQuestion: '全圧 1.02 atm、水蒸気圧 0.02 atm のとき捕集気体の分圧は。', strategyText: 'P_gas=P_total-P_water。温度に依存。' },
    { level: 'basic', patternName: '化学反応式の係数合わせ', exampleQuestion: 'C3H8+O2→CO2+H2O の係数を合わせよ。', strategyText: 'C→H→O の順。分数係数も一時的に使ってよい。' },
  ],
  'chemistry-acid-base': [
    { level: 'advanced', patternName: '緩衝液の考え方', exampleQuestion: '弱酸とその塩の混合液が pH を保つ理由を述べよ。', strategyText: 'H+ が増えると A- が吸収、減ると HA が補給。Henderson-Hasselbalch。' },
    { level: 'standard', patternName: '価数を含む中和', exampleQuestion: '0.10 mol/L H2SO4 10 mL を中和する 0.10 mol/L NaOH の体積は。', strategyText: 'c1 v1 n1 = c2 v2 n2。硫酸は2価。' },
    { level: 'basic', patternName: '酸塩基の定義', exampleQuestion: 'HCl が酸である理由をアレニウスで述べよ。', strategyText: '水中で H+ を出すのが酸、OH- が塩基。ブレンステッドは质子の授受。' },
  ],
  'chemistry-redox': [
    { level: 'advanced', patternName: 'ダニエル電池の起電力', exampleQuestion: 'Zn と Cu の標準電極電位から起電力の向きを述べよ。', strategyText: 'イオン化傾向が大きい方が負極（酸化）。E=E_cathode-E_anode。' },
    { level: 'standard', patternName: '過マンガン酸滴定', exampleQuestion: '酸性で MnO4- は何当量の電子を受け取るか。', strategyText: 'MnO4- → Mn2+ で電子5。濃度計算は電子等量で揃える。' },
    { level: 'basic', patternName: '酸化還元の定義', exampleQuestion: '酸化数か電子か、どちらが増えると酸化か。', strategyText: '酸化数増加=酸化=電子放出。還元はその逆。' },
  ],
  'chemistry-equilibrium': [
    { level: 'advanced', patternName: '溶解度積 Ksp', exampleQuestion: 'AgCl の Ksp=[Ag+][Cl-] から、共通イオンがあるときの溶解度の変化を述べよ。', strategyText: '共通イオンで溶解度低下。Q と Ksp の比較で沈殿判定。' },
    { level: 'standard', patternName: '平衡移動と触媒', exampleQuestion: '触媒は平衡定数を変えるか。', strategyText: '触媒は速度だけ。K は温度のみ。収率は平衡位置で決まる。' },
    { level: 'basic', patternName: '可逆反応の意味', exampleQuestion: '平衡状態で正反応は止まっているか。', strategyText: '巨視的には一定、微視的には正逆が等速（動的平衡）。' },
  ],
  'chemistry-inorganic': [
    { level: 'advanced', patternName: '遷移元素の錯イオン', exampleQuestion: '[Cu(H2O)4]^{2+} の色の概略を述べよ。', strategyText: '水和銅(II)は青。アンミンで濃青。配位子で吸収波長が変わる。' },
    { level: 'standard', patternName: 'ハロゲンの反応性', exampleQuestion: 'F2, Cl2, Br2, I2 で最も酸化力が強いのは。', strategyText: '周期が上ほど酸化力が強い。置換反応で確認。' },
    { level: 'basic', patternName: 'アルカリ金属の性質', exampleQuestion: 'ナトリウムと水の反応で発生する気体は。', strategyText: 'H2。炎色反応（Na 黄）とセットで覚える。' },
  ],
  'chemistry-organic': [
    { level: 'advanced', patternName: '芳香族の配向性', exampleQuestion: 'フェノールのニトロ化はどの位置が主か。', strategyText: 'OH はオルト・パラ配向。ニトロはメタ配向。' },
    { level: 'standard', patternName: '付加と置換の見分け', exampleQuestion: 'エチレンに臭素を加える反応は付加か置換か。', strategyText: '二重結合は付加、ベンゼンは置換が主。アルカンはラジカル置換。' },
    { level: 'basic', patternName: '炭素の結合数', exampleQuestion: '炭素原子は通常何本の共有結合を作るか。', strategyText: '4本。二重結合は2本分。不飽和度と対応。' },
  ],
  'chemistry-polymer': [
    { level: 'advanced', patternName: 'アミノ酸の等電点', exampleQuestion: '等電点でアミノ酸はどんなイオンになるか。', strategyText: '正負が打ち消し合う双性イオン。電気泳動で動かない。' },
    { level: 'standard', patternName: '付加重合と縮合重合', exampleQuestion: 'ポリエチレンはどちらの重合か。', strategyText: 'エチレンは付加。ナイロン・ポリエステルは縮合（水が抜ける）。' },
    { level: 'basic', patternName: '単量体と重合体', exampleQuestion: '塩化ビニルが重合した高分子の名を答えよ。', strategyText: 'ポリ塩化ビニル (PVC)。名称はポリ＋単量体。' },
  ],
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function variantize(seed: PatternSeed, stamp: number): PatternSeed {
  const tag = stamp % 17;
  if (tag === 0) return seed;
  return {
    ...seed,
    patternName: `${seed.patternName}（発展${tag}）`,
    exampleQuestion: seed.exampleQuestion.replace(/(\d+)/, (match) => {
      const next = Number(match) + (tag % 3);
      return Number.isFinite(next) ? String(next) : match;
    }),
    strategyText: `${seed.strategyText} 数値や係数が変わっても、型（見分ける条件→公式→検算）は同じ。`,
  };
}

function genericPool(unitTitle: string): PatternSeed[] {
  return [
    { level: 'basic', patternName: `${unitTitle}の基本公式の直接適用`, exampleQuestion: `${unitTitle}の基本公式に与えられた数値を代入して値を求めよ。`, strategyText: '公式のどの文字が既知かを表にし、残り1つを求める。単位を揃える。' },
    { level: 'standard', patternName: `${unitTitle}の場合分け`, exampleQuestion: `文字定数を含む${unitTitle}の問題で、境界値によって答えの形が変わる例を考えよ。`, strategyText: 'パラメータの境界（符号・定義域・判別式）で場合分けし、境界で式がつながるか確認する。' },
    { level: 'advanced', patternName: `${unitTitle}の融合問題`, exampleQuestion: `${unitTitle}と隣接単元を組み合わせた入試問題の方針を述べよ。`, strategyText: '主武器（この単元の公式）を先に決め、補助公式は後から足す。図や表で情報を整理する。' },
    { level: 'standard', patternName: `${unitTitle}の典型的なひっかけ`, exampleQuestion: `${unitTitle}で受験生が最も間違えやすい条件を指摘せよ。`, strategyText: '符号・単位・定義域・「異なる/重解を含む」の文言を先にマークする。' },
    { level: 'advanced', patternName: `${unitTitle}の逆向き思考`, exampleQuestion: `答えの形から${unitTitle}の条件を逆算する問題の方針を述べよ。`, strategyText: 'ゴールから必要な中間量を列挙し、与えられた量とのギャップを公式で埋める。' },
  ];
}

export interface GenerateMockPatternsParams {
  unitId?: string;
  subject?: Subject;
  existingNames?: string[];
  count?: number;
}

export function generateMockPatterns({
  unitId,
  subject,
  existingNames = [],
  count = 4,
}: GenerateMockPatternsParams): SolutionPattern[] {
  const unit = unitId ? getUnitById(unitId) : undefined;
  const resolvedSubject: Subject = unit?.subject ?? subject ?? 'math';
  const unitTitle = unit?.title ?? '総合問題';
  const resolvedUnitId = unit?.id ?? unitId ?? `generic-${resolvedSubject}`;

  const pool = DISCOVERY_POOL[resolvedUnitId] ?? genericPool(unitTitle);
  const blocked = new Set(existingNames);
  const unused = pool.filter((seed) => !blocked.has(seed.patternName) && !blocked.has(`${seed.patternName}（発展）`));
  const stamp = Date.now();
  const source = unused.length > 0 ? unused : pool;
  const picked = shuffle(source)
    .slice(0, Math.max(3, Math.min(5, count)))
    .map((seed, index) => {
      const useVariant = unused.length === 0 || blocked.has(seed.patternName);
      const finalSeed = useVariant ? variantize(seed, stamp + index) : seed;
      return {
        id: `ai-pat-${resolvedUnitId}-${stamp}-${index}`,
        subject: resolvedSubject,
        unit: unitTitle,
        unitId: resolvedUnitId,
        level: finalSeed.level,
        patternName: finalSeed.patternName,
        exampleQuestion: finalSeed.exampleQuestion,
        strategyText: finalSeed.strategyText,
        discovered: true,
      } satisfies SolutionPattern;
    });

  return picked;
}

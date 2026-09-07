// ==========================================
// Apex Suite: Math Lab - Extra Mock Variants
// ==========================================
// 各単元の「メインテンプレート」に加えて抽選する別パターン。
// 同じ unitId でも問題文・数値・解法が変わるようにする。

import type { TemplateBlueprint } from '@/lib/mock/blueprintTypes';
import { difficultySpan } from '@/lib/mock/blueprintTypes';

type ExtraFactory = (difficulty: number, unitTitle: string) => unknown[];

function mathInput(
  title: string,
  unit: string,
  templateText: string,
  variables: TemplateBlueprint['variables'],
  calcLogicJS: string,
  hints: [string, string, string],
  keyFormula: string,
  commonMistakes: string
): TemplateBlueprint {
  return {
    title,
    unit,
    subject: 'math',
    format: 'input',
    variables,
    templateText,
    calcLogicJS,
    hints,
    keyFormula,
    commonMistakes,
  };
}

const EXTRA_BY_UNIT: Record<string, ExtraFactory> = {
  'math-1a-numbers-and-expressions': (d, unit) => {
    const r = difficultySpan(d, 2, 8);
    return [
      mathInput(
        '絶対値方程式 |x-a| = b',
        unit,
        '方程式 |x - {{a}}| = {{b}} の解のうち、大きい方を求めよ。',
        { a: { min: r.min, max: r.max, step: 1 }, b: { min: 1, max: 6, step: 1 } },
        `const a = vars.a, b = Math.abs(vars.b);
         return { vars: { a, b }, correctAnswer: a + b,
           explanationSteps: ['|x-a|=b ⇔ x=a+b または x=a-b。', '大きい方は a+b = '+(a+b)+'。'] };`,
        ['絶対値の定義で場合分けする。', '中身が正のときと負のときを両方書く。', '大きい方の解を答える。'],
        '|x-a| = b ⇔ x = a±b',
        '絶対値を外すとき符号を片方だけにするミス。'
      ),
      mathInput(
        '1次不等式の解',
        unit,
        '不等式 {{a}}x + {{b}} > {{c}} を満たす整数 x のうち最小のものを求めよ。',
        { a: { min: 2, max: 5, step: 1 }, b: { min: -4, max: 4, step: 1 }, c: { min: 1, max: 10, step: 1 } },
        `const a = vars.a, b = vars.b, c = vars.c;
         const bound = (c - b) / a;
         const answer = Math.floor(bound) + 1;
         return { vars: { a, b, c }, correctAnswer: answer,
           explanationSteps: ['ax+b>c より x>(c-b)/a = '+bound+'。', '最小の整数は '+answer+'。'] };`,
        ['まず x について始める。', '不等号の向きに注意（今回 a>0）。', '境界を含まないので次の整数。'],
        'ax+b > c ⇔ x > (c-b)/a  (a>0)',
        '等号の有無と切り上げ・切り捨てを混同する。'
      ),
    ];
  },

  'math-1a-quadratic-functions': (d, unit) => {
    const r = difficultySpan(d, -4, 4);
    return [
      mathInput(
        '軸の方程式',
        unit,
        '2次関数 y = {{a}}x² + {{b}}x + {{c}} の軸の方程式 x = □ の □ を求めよ。',
        { a: { min: 1, max: 3, step: 1 }, b: { min: r.min === 0 ? 1 : r.min, max: r.max || 4, step: 2 }, c: { min: -5, max: 5, step: 1 } },
        `const a = vars.a, b = vars.b === 0 ? 2 : vars.b, c = vars.c;
         const axis = -b / (2 * a);
         return { vars: { a, b, c }, correctAnswer: Math.round(axis * 100) / 100,
           explanationSteps: ['軸は x = -b/(2a)。', 'x = -('+b+')/(2·'+a+') = '+axis+'。'] };`,
        ['軸の公式 x=-b/(2a) を使う。', '平方完成しても同じ軸が出る。', '分数は約分して答える。'],
        '軸: x = -b / (2a)',
        '符号を落として b/(2a) にしてしまう。'
      ),
      mathInput(
        '判別式の符号',
        unit,
        '2次方程式 x² + {{b}}x + {{c}} = 0 の実数解の個数を求めよ。',
        { b: { min: -6, max: 6, step: 1 }, c: { min: -6, max: 6, step: 1 } },
        `const b = vars.b, c = vars.c;
         const D = b*b - 4*c;
         const n = D > 0 ? 2 : D === 0 ? 1 : 0;
         return { vars: { b, c }, correctAnswer: n,
           explanationSteps: ['D = b²-4ac = '+b+'²-4·'+c+' = '+D+'。', 'D>0なら2個、D=0なら1個、D<0なら0個。答えは '+n+'。'] };`,
        ['判別式 D=b²-4ac を計算する。', 'a=1 である。', 'Dの符号で実数解の個数が決まる。'],
        'D = b² - 4ac',
        'D=0 を「解なし」と誤る。'
      ),
    ];
  },

  'math-1a-trigonometric-ratios': (_d, unit) => [
    mathInput(
      '正弦定理',
      unit,
      '△ABC で a = {{a}}, A = {{A}}°, B = {{B}}° のとき辺 b を求めよ（小数第1位）。',
      { a: { min: 6, max: 12, step: 1 }, A: { min: 30, max: 60, step: 15 }, B: { min: 30, max: 60, step: 15 } },
      `const a = vars.a, A = vars.A, B = vars.B;
       const b = Math.round((a * Math.sin(B*Math.PI/180) / Math.sin(A*Math.PI/180)) * 10) / 10;
       return { vars: { a, A, B }, correctAnswer: b,
         explanationSteps: ['正弦定理 a/sinA = b/sinB。', 'b = a·sinB/sinA ≈ '+b+'。'] };`,
      ['正弦定理 a/sinA = b/sinB。', '角度はラジアンに直して sin を取る。', '小数第1位まで。'],
      'a / sin A = b / sin B',
      '度のまま Math.sin に入れる（ラジアン忘れ）。'
    ),
    mathInput(
      '余弦定理で辺を求める',
      unit,
      '△ABC で b = {{b}}, c = {{c}}, A = {{A}}° のとき辺 a を求めよ（小数第1位）。',
      { b: { min: 4, max: 8, step: 1 }, c: { min: 4, max: 8, step: 1 }, A: { min: 30, max: 90, step: 15 } },
      `const b = vars.b, c = vars.c, A = vars.A;
       const a2 = b*b + c*c - 2*b*c*Math.cos(A*Math.PI/180);
       const a = Math.round(Math.sqrt(Math.max(0,a2)) * 10) / 10;
       return { vars: { b, c, A }, correctAnswer: a,
         explanationSteps: ['余弦定理 a²=b²+c²-2bc cosA。', 'a ≈ '+a+'。'] };`,
      ['余弦定理 a²=b²+c²-2bc cosA。', 'cos はラジアン指定。', '最後に平方根を取る。'],
      'a² = b² + c² - 2bc cos A',
      '符号を +2bc にしてしまう。'
    ),
  ],

  'math-1a-data-analysis': (d, unit) => {
    const r = difficultySpan(d, 2, 12);
    return [
      mathInput(
        '平均値',
        unit,
        'データ {{a}}, {{b}}, {{c}}, {{d}} の平均値を求めよ。',
        { a: { min: r.min, max: r.max, step: 1 }, b: { min: r.min, max: r.max, step: 1 }, c: { min: r.min, max: r.max, step: 1 }, d: { min: r.min, max: r.max, step: 1 } },
        `const vals = [vars.a, vars.b, vars.c, vars.d];
         const mean = vals.reduce((s,v)=>s+v,0) / 4;
         return { vars: { a: vars.a, b: vars.b, c: vars.c, d: vars.d }, correctAnswer: Math.round(mean*100)/100,
           explanationSteps: ['合計 '+vals.reduce((s,v)=>s+v,0)+' を 4 で割る。', '平均は '+mean+'。'] };`,
        ['平均は合計÷個数。', '4個のデータを足す。', '必要なら小数第2位まで。'],
        '平均 = (x1+…+xn)/n',
        '合計を n-1 で割ってしまう。'
      ),
      mathInput(
        '分散',
        unit,
        'データ {{a}}, {{b}}, {{c}} の分散（標本ではなくデータの散らばり: 平均からの偏差平方の平均）を求めよ。',
        { a: { min: 1, max: 6, step: 1 }, b: { min: 2, max: 8, step: 1 }, c: { min: 3, max: 10, step: 1 } },
        `const xs = [vars.a, vars.b, vars.c];
         const mean = xs.reduce((s,v)=>s+v,0)/3;
         const variance = xs.reduce((s,v)=>s+(v-mean)**2,0)/3;
         return { vars: { a: vars.a, b: vars.b, c: vars.c }, correctAnswer: Math.round(variance*100)/100,
           explanationSteps: ['平均 = '+mean+'。', '偏差平方の平均（分散）= '+variance+'。'] };`,
        ['まず平均を出す。', '各偏差を2乗して平均する。', '今回は /n（母分散型）。'],
        's² = Σ(xi-x̄)² / n',
        '/(n-1) と /n を取り違える。'
      ),
    ];
  },

  'math-1a-combinatorics-probability': (_d, unit) => [
    mathInput(
      '順列',
      unit,
      '{{n}} 人から {{r}} 人を並べる順列の総数を求めよ。',
      { n: { min: 5, max: 8, step: 1 }, r: { min: 2, max: 3, step: 1 } },
      `function fact(k){ let p=1; for(let i=2;i<=k;i++) p*=i; return p; }
       const n = vars.n, r = Math.min(vars.r, vars.n);
       const ans = fact(n) / fact(n-r);
       return { vars: { n, r }, correctAnswer: ans,
         explanationSteps: ['P(n,r)=n!/(n-r)! = '+ans+'。'] };`,
      ['順列は P(n,r)=n!/(n-r)!。', '順番が区別される。', '電卓なしでも順に掛けてよい。'],
      'P(n,r) = n! / (n-r)!',
      '組合せ C と順列 P を取り違える。'
    ),
    mathInput(
      '組合せ',
      unit,
      '{{n}} 個から {{r}} 個を選ぶ組合せの総数を求めよ。',
      { n: { min: 6, max: 10, step: 1 }, r: { min: 2, max: 3, step: 1 } },
      `function fact(k){ let p=1; for(let i=2;i<=k;i++) p*=i; return p; }
       const n = vars.n, r = Math.min(vars.r, vars.n);
       const ans = fact(n) / (fact(r)*fact(n-r));
       return { vars: { n, r }, correctAnswer: ans,
         explanationSteps: ['C(n,r)=n!/(r!(n-r)!) = '+ans+'。'] };`,
      ['組合せは順番を区別しない。', 'C(n,r)=n!/(r!(n-r)!)。', '約分して計算する。'],
      'C(n,r) = n! / (r!(n-r)!)',
      '分母の r! を忘れる。'
    ),
  ],

  'mathA-plane-geometry': (_d, unit) => [
    mathInput(
      '円周角',
      unit,
      '円周角が {{a}}° のとき、同じ弧に対する中心角を求めよ。',
      { a: { min: 20, max: 70, step: 5 } },
      `const a = vars.a;
       return { vars: { a }, correctAnswer: 2*a,
         explanationSteps: ['中心角は円周角の2倍。', '2×'+a+' = '+(2*a)+'°。'] };`,
      ['円周角の定理: 中心角 = 2×円周角。', '同じ弧に対して成り立つ。', '単位は度。'],
      '中心角 = 2 × 円周角',
      '2倍を忘れて同じ角と答える。'
    ),
    mathInput(
      '三角形の内角',
      unit,
      '△ABC で A = {{A}}°, B = {{B}}° のとき角 C を求めよ。',
      { A: { min: 30, max: 80, step: 5 }, B: { min: 30, max: 80, step: 5 } },
      `const A = vars.A, B = vars.B;
       const C = 180 - A - B;
       return { vars: { A, B }, correctAnswer: C,
         explanationSteps: ['内角の和は180°。', 'C = 180-'+A+'-'+B+' = '+C+'。'] };`,
      ['三角形の内角の和は180°。', '残りの角を引く。', '単位は度。'],
      'A+B+C = 180°',
      '外角と内角を混同する。'
    ),
  ],

  'mathA-integers': (d, unit) => {
    const r = difficultySpan(d, 4, 18);
    return [
      mathInput(
        '最大公約数',
        unit,
        '{{a}} と {{b}} の最大公約数を求めよ。',
        { a: { min: r.min, max: r.max, step: 1 }, b: { min: r.min, max: r.max, step: 1 } },
        `function gcd(x,y){ x=Math.abs(x); y=Math.abs(y); while(y){ const t=x%y; x=y; y=t; } return x || 1; }
         const a = vars.a, b = vars.b;
         return { vars: { a, b }, correctAnswer: gcd(a,b),
           explanationSteps: ['ユークリッドの互除法で gcd('+a+','+b+') を求める。'] };`,
        ['互除法: 大きい数を小さい数で割る。', '余りで置き換えて繰り返す。', '余り0になったときの割る数が gcd。'],
        'gcd(a,b) = gcd(b, a mod b)',
        '最小公倍数と取り違える。'
      ),
      mathInput(
        '余り',
        unit,
        '{{a}} を {{b}} で割った余りを求めよ。',
        { a: { min: 20, max: 80, step: 1 }, b: { min: 3, max: 9, step: 1 } },
        `const a = vars.a, b = vars.b;
         return { vars: { a, b }, correctAnswer: a % b,
           explanationSteps: [a+' = '+b+'·'+Math.floor(a/b)+' + '+(a%b)+'。'] };`,
        ['割り算の等式 a = bq + r。', '0 ≤ r < b。', '余り r を答える。'],
        'a = bq + r (0 ≤ r < b)',
        '商を答えてしまう。'
      ),
    ];
  },

  'math2-expressions-and-proof': (d, unit) => [
    mathInput(
      '余り定理',
      unit,
      'P(x)=x³ + {{a}}x + {{b}} を x-{{c}} で割った余りを求めよ。',
      { a: { min: -4, max: 4, step: 1 }, b: { min: -6, max: 6, step: 1 }, c: { min: 1, max: 3, step: 1 } },
      `const a = vars.a, b = vars.b, c = vars.c;
       const rem = c*c*c + a*c + b;
       return { vars: { a, b, c }, correctAnswer: rem,
         explanationSteps: ['余り定理より余りは P('+c+')。', 'P('+c+') = '+rem+'。'] };`,
      ['x-c で割った余りは P(c)。', '代入するだけ。', '計算ミスに注意。'],
      'P(x) を (x-c) で割った余り = P(c)',
      '商を答えてしまう。'
    ),
    mathInput(
      '因数定理',
      unit,
      'P(x)=x³ - {{s}}x² + {{p}}x - {{q}} が x-1 を因数に持つとき P(1) の値を確認し、P(1) を求めよ。',
      { s: { min: 2, max: 6, step: 1 }, p: { min: 1, max: 8, step: 1 }, q: { min: 1, max: 8, step: 1 } },
      `const s = vars.s, p = vars.p, q = vars.q;
       const val = 1 - s + p - q;
       return { vars: { s, p, q }, correctAnswer: val,
         explanationSteps: ['P(1)=1-s+p-q = '+val+'。', '0なら x-1 は因数。'] };`,
      ['因数定理: P(c)=0 なら (x-c) が因数。', '今回は P(1) を計算する。', '符号に注意。'],
      'P(c)=0 ⇔ (x-c) が因数',
      '定数項の符号ミス。'
    ),
  ],

  'math2-coordinate-geometry': (d, unit) => [
    mathInput(
      '2点間の距離',
      unit,
      '点 A({{x1}}, {{y1}}) と B({{x2}}, {{y2}}) の距離を求めよ（小数第2位）。',
      { x1: { min: -3, max: 3, step: 1 }, y1: { min: -3, max: 3, step: 1 }, x2: { min: 1, max: 6, step: 1 }, y2: { min: 1, max: 6, step: 1 } },
      `const dx = vars.x2-vars.x1, dy = vars.y2-vars.y1;
       const dist = Math.round(Math.sqrt(dx*dx+dy*dy)*100)/100;
       return { vars: { x1: vars.x1, y1: vars.y1, x2: vars.x2, y2: vars.y2 }, correctAnswer: dist,
         explanationSteps: ['距離 = √((x2-x1)²+(y2-y1)²) ≈ '+dist+'。'] };`,
      ['距離公式を使う。', '差を2乗して足して平方根。', '小数第2位まで。'],
      'd = √((x2-x1)²+(y2-y1)²)',
      '平方根を取り忘れる。'
    ),
    mathInput(
      '中点',
      unit,
      'A({{x1}}, {{y1}}) と B({{x2}}, {{y2}}) の中点の x 座標を求めよ。',
      { x1: { min: -4, max: 4, step: 1 }, y1: { min: -4, max: 4, step: 1 }, x2: { min: -4, max: 4, step: 1 }, y2: { min: -4, max: 4, step: 1 } },
      `const mx = (vars.x1 + vars.x2) / 2;
       return { vars: { x1: vars.x1, y1: vars.y1, x2: vars.x2, y2: vars.y2 }, correctAnswer: mx,
         explanationSteps: ['中点の x は (x1+x2)/2 = '+mx+'。'] };`,
      ['中点は各座標の平均。', 'x 座標だけ答える。', '符号に注意。'],
      '中点 ((x1+x2)/2, (y1+y2)/2)',
      '差を2で割ってしまう。'
    ),
  ],

  'math-2bc-trigonometric-functions': (_d, unit) => [
    mathInput(
      '三角関数の値',
      unit,
      'sin {{deg}}° の値を求めよ（小数第2位）。',
      { deg: { min: 30, max: 150, step: 30 } },
      `const deg = vars.deg;
       const v = Math.round(Math.sin(deg*Math.PI/180)*100)/100;
       return { vars: { deg }, correctAnswer: v,
         explanationSteps: ['sin('+deg+'°) ≈ '+v+'。'] };`,
      ['特殊角なら正確な値を使う。', '度→ラジアン。', '小数第2位。'],
      'sin θ （単位円）',
      'cos と取り違える。'
    ),
    mathInput(
      '2倍角',
      unit,
      'cos θ = {{c}} のとき cos 2θ を求めよ。',
      { c: { min: -8, max: 8, step: 2 } },
      `const raw = vars.c;
       const c = Math.max(-0.8, Math.min(0.8, raw / 10));
       const ans = Math.round((2*c*c - 1)*100)/100;
       return { vars: { c }, correctAnswer: ans,
         explanationSteps: ['cos2θ = 2cos²θ-1 = '+ans+'。'] };`,
      ['2倍角: cos2θ=2cos²θ-1。', '与えられた cosθ を代入。', 'sin の公式と混同しない。'],
      'cos 2θ = 2cos²θ - 1',
      '2cosθ にしてしまう。'
    ),
  ],

  'math-2bc-exponential-logarithmic': (d, unit) => [
    mathInput(
      '対数の計算',
      unit,
      'log₂ {{a}} の値を求めよ。',
      { a: { min: 2, max: 5, step: 1 } },
      `const exp = vars.a;
       const a = 2 ** exp;
       return { vars: { a }, correctAnswer: exp,
         explanationSteps: ['2^'+exp+' = '+a+' なので log₂'+a+' = '+exp+'。'] };`,
      ['log₂ a = x ⇔ 2^x = a。', '2の累乗を思い出す。', '真数は正。'],
      'log_b a = x ⇔ b^x = a',
      '底と真数を逆にする。'
    ),
    mathInput(
      '指数方程式',
      unit,
      '2^{{k}} = {{n}} のとき、左辺の指数 k として入っている値そのものを答えよ（与えられた k）。',
      { k: { min: 2, max: 6, step: 1 }, n: { min: 1, max: 1, step: 1 } },
      `const k = vars.k;
       const n = 2 ** k;
       return { vars: { k, n }, correctAnswer: k,
         explanationSteps: ['2^k = '+n+' となる k は '+k+'。'] };`,
      ['両辺を同じ底で表す。', '指数を比較する。', '今回は 2^k の k。'],
      'a^x = a^y ⇔ x = y',
      '対数を取り忘れる。'
    ),
  ],

  'math-2bc-differentiation': (d, unit) => [
    mathInput(
      '導関数の値',
      unit,
      'f(x) = x^{{n}} のとき f\'({{p}}) を求めよ。',
      { n: { min: 2, max: 5, step: 1 }, p: { min: 2, max: 4, step: 1 } },
      `const n = vars.n, p = vars.p;
       const ans = n * (p ** (n-1));
       return { vars: { n, p }, correctAnswer: ans,
         explanationSteps: ['f\'(x)=n x^{n-1}。', 'x='+p+' を代入して '+ans+'。'] };`,
      ['べき乗の微分 n x^{n-1}。', 'その後 x に代入。', '指数を1つ下げる。'],
      '(x^n)\' = n x^{n-1}',
      '代入してから微分してしまう。'
    ),
    mathInput(
      '接線の傾き',
      unit,
      'y = {{a}}x² + {{b}}x の x = {{p}} における接線の傾きを求めよ。',
      { a: { min: 1, max: 4, step: 1 }, b: { min: -3, max: 3, step: 1 }, p: { min: -2, max: 3, step: 1 } },
      `const a = vars.a, b = vars.b, p = vars.p;
       const slope = 2*a*p + b;
       return { vars: { a, b, p }, correctAnswer: slope,
         explanationSteps: ['y\'=2ax+b。', 'x='+p+' で傾き '+slope+'。'] };`,
      ['接線の傾きは導関数の値。', 'まず微分する。', '指定の x を代入。'],
      '接線の傾き = f\'(a)',
      '関数値 f(a) を傾きと答える。'
    ),
  ],

  'math-2bc-integration': (d, unit) => [
    mathInput(
      '不定積分',
      unit,
      '∫ {{a}}x dx の x² の係数を求めよ（定数項は無視）。',
      { a: { min: 2, max: 8, step: 1 } },
      `const a = vars.a;
       const coef = a / 2;
       return { vars: { a }, correctAnswer: coef,
         explanationSteps: ['∫ax dx = (a/2)x² + C。係数は '+coef+'。'] };`,
      ['x^n の積分は x^{n+1}/(n+1)。', '係数 a はそのまま掛かる。', 'C は無視して係数だけ。'],
      '∫ x^n dx = x^{n+1}/(n+1) + C',
      '微分の公式で積分してしまう。'
    ),
    mathInput(
      '定積分',
      unit,
      '∫₀^{{b}} {{a}}x dx の値を求めよ。',
      { a: { min: 2, max: 6, step: 1 }, b: { min: 2, max: 5, step: 1 } },
      `const a = vars.a, b = vars.b;
       const ans = a * b * b / 2;
       return { vars: { a, b }, correctAnswer: ans,
         explanationSteps: ['[(a/2)x²]_0^b = (a/2)b² = '+ans+'。'] };`,
      ['原始関数を求める。', '上端代入−下端代入。', '下端0なので上端だけ。'],
      '∫_a^b f = F(b)-F(a)',
      '下端を引き忘れる。'
    ),
  ],

  'math-2bc-sequences': (d, unit) => [
    mathInput(
      '等差数列の一般項',
      unit,
      '初項 {{a}}、公差 {{d}} の等差数列の第 {{n}} 項を求めよ。',
      { a: { min: 1, max: 8, step: 1 }, d: { min: 2, max: 5, step: 1 }, n: { min: 4, max: 8, step: 1 } },
      `const a = vars.a, d = vars.d, n = vars.n;
       const an = a + (n-1)*d;
       return { vars: { a, d, n }, correctAnswer: an,
         explanationSteps: ['a_n = a+(n-1)d = '+an+'。'] };`,
      ['等差の一般項 a+(n-1)d。', 'n-1 回公差を足す。', '初項を n=1 と確認。'],
      'a_n = a + (n-1)d',
      'n 回足してしまい a+nd にする。'
    ),
    mathInput(
      '等差の和',
      unit,
      '初項 {{a}}、末項 {{l}}、項数 {{n}} の等差数列の和を求めよ。',
      { a: { min: 1, max: 5, step: 1 }, l: { min: 10, max: 20, step: 1 }, n: { min: 5, max: 10, step: 1 } },
      `const a = vars.a, l = vars.l, n = vars.n;
       const s = n * (a + l) / 2;
       return { vars: { a, l, n }, correctAnswer: s,
         explanationSteps: ['S_n = n(a+l)/2 = '+s+'。'] };`,
      ['和の公式 n(初項+末項)/2。', '項数を掛ける。', '2で割る。'],
      'S_n = n(a+l)/2',
      'n を掛け忘れる。'
    ),
  ],

  'mathB-statistics': (d, unit) => [
    mathInput(
      '正規分布の標準化',
      unit,
      '平均 {{m}}、標準偏差 {{s}} のとき、値 {{x}} の標準化変量 z を求めよ（小数第2位）。',
      { m: { min: 50, max: 60, step: 2 }, s: { min: 4, max: 10, step: 2 }, x: { min: 40, max: 80, step: 5 } },
      `const m = vars.m, s = vars.s, x = vars.x;
       const z = Math.round(((x-m)/s)*100)/100;
       return { vars: { m, s, x }, correctAnswer: z,
         explanationSteps: ['z=(x-μ)/σ = '+z+'。'] };`,
      ['標準化 z=(x-μ)/σ。', '偏差を標準偏差で割る。', '小数第2位。'],
      'z = (x - μ) / σ',
      'σ と μ を逆にする。'
    ),
    mathInput(
      '期待値',
      unit,
      '確率 1/{{n}} で {{a}}、残りで 0 を得る試行の期待値を求めよ（小数第2位）。',
      { n: { min: 2, max: 6, step: 1 }, a: { min: 6, max: 18, step: 2 } },
      `const n = vars.n, a = vars.a;
       const e = Math.round((a/n)*100)/100;
       return { vars: { n, a }, correctAnswer: e,
         explanationSteps: ['E = (1/n)·a + (1-1/n)·0 = '+e+'。'] };`,
      ['期待値は値×確率の和。', '0 の項は消える。', 'a/n が答え。'],
      'E(X) = Σ x_i p_i',
      '確率を足し忘れる。'
    ),
  ],

  'math-3-limits': (d, unit) => [
    mathInput(
      '多項式の極限',
      unit,
      'lim_{x→∞} ({{a}}x² + 1) / ({{b}}x² + x) を求めよ。',
      { a: { min: 2, max: 6, step: 1 }, b: { min: 2, max: 6, step: 1 } },
      `const a = vars.a, b = vars.b;
       const ans = Math.round((a/b)*100)/100;
       return { vars: { a, b }, correctAnswer: ans,
         explanationSteps: ['最高次で割ると a/b = '+ans+'。'] };`,
      ['∞/∞ は最高次の係数比。', 'x² で割る。', '定数項は消える。'],
      'lim x→∞ (ax^n+…)/(bx^n+…) = a/b',
      '定数項の比にしてしまう。'
    ),
    mathInput(
      '微分係数の定義',
      unit,
      'f(x)=x² の x={{p}} における微分係数 lim_{h→0} [f(p+h)-f(p)]/h の値を求めよ。',
      { p: { min: 1, max: 5, step: 1 } },
      `const p = vars.p;
       return { vars: { p }, correctAnswer: 2*p,
         explanationSteps: ['f\'(x)=2x なので f\'('+p+')='+(2*p)+'。'] };`,
      ['定義は導関数の値。', 'x² の導関数は 2x。', 'x=p を代入。'],
      'f\'(a) = lim_{h→0} [f(a+h)-f(a)]/h',
      'h を消さずに残す。'
    ),
  ],

  'math-3-differentiation': (d, unit) => [
    mathInput(
      '積の微分',
      unit,
      'f(x)=x^{{n}} の導関数に x={{p}} を代入した値を求めよ。',
      { n: { min: 3, max: 6, step: 1 }, p: { min: 2, max: 3, step: 1 } },
      `const n = vars.n, p = vars.p;
       const ans = n * (p ** (n-1));
       return { vars: { n, p }, correctAnswer: ans,
         explanationSteps: ['(x^n)\'=n x^{n-1}、x='+p+' で '+ans+'。'] };`,
      ['べき乗の微分。', '代入は微分の後。', '指数を1下げる。'],
      '(uv)\' = u\'v + uv\'',
      '両方を微分して掛けるだけにする。'
    ),
    mathInput(
      '合成関数',
      unit,
      '({{a}}x + 1)² を展開したときの x² の係数を求めよ（微分の前に確認）。',
      { a: { min: 2, max: 5, step: 1 } },
      `const a = vars.a;
       return { vars: { a }, correctAnswer: a*a,
         explanationSteps: ['(ax+1)² = a²x² + 2ax + 1。x² の係数は '+ (a*a) +'。'] };`,
      ['合成の微分の前に中の係数を見る。', '展開しても a² が x² の係数。', '2ax と混同しない。'],
      '(f(g))\' = f\'(g)·g\'',
      '内側の微分を掛け忘れる。'
    ),
  ],

  'math-3-integration': (d, unit) => [
    mathInput(
      '置換積分の係数',
      unit,
      '∫ ({{a}}x + 1) dx の x² の係数を求めよ。',
      { a: { min: 2, max: 8, step: 1 } },
      `const a = vars.a;
       return { vars: { a }, correctAnswer: a/2,
         explanationSteps: ['∫ax dx の x² 係数は a/2 = '+(a/2)+'。'] };`,
      ['1次式の積分。', 'x²/2 に係数 a。', '定数 +x は無視。'],
      '∫ (ax+b) dx = (a/2)x² + bx + C',
      'a を割らない。'
    ),
    mathInput(
      '面積',
      unit,
      'y = {{a}}x と x 軸、x=0, x={{b}} で囲まれた面積を求めよ。',
      { a: { min: 1, max: 4, step: 1 }, b: { min: 2, max: 5, step: 1 } },
      `const a = vars.a, b = vars.b;
       const s = a * b * b / 2;
       return { vars: { a, b }, correctAnswer: s,
         explanationSteps: ['∫_0^b ax dx = (a/2)b² = '+s+'。'] };`,
      ['直線と軸の囲む面積は定積分。', '下端0。', '三角形の面積でも検算可。'],
      '面積 = ∫ |f(x)| dx',
      '符号付き積分と面積を混同。'
    ),
  ],

  'math3-parametric-polar': (_d, unit) => [
    mathInput(
      '極座標の r',
      unit,
      '直交座標 ({{x}}, {{y}}) の r = √(x²+y²) を求めよ（小数第2位）。',
      { x: { min: 3, max: 8, step: 1 }, y: { min: 4, max: 8, step: 1 } },
      `const x = vars.x, y = vars.y;
       const r = Math.round(Math.sqrt(x*x+y*y)*100)/100;
       return { vars: { x, y }, correctAnswer: r,
         explanationSteps: ['r=√(x²+y²) ≈ '+r+'。'] };`,
      ['極座標 r は原点からの距離。', '三平方の定理。', '小数第2位。'],
      'r = √(x² + y²)',
      'x+y にしてしまう。'
    ),
    mathInput(
      '媒介変数の点',
      unit,
      'x=t, y={{a}}t の t={{t}} における y 座標を求めよ。',
      { a: { min: 2, max: 5, step: 1 }, t: { min: 2, max: 6, step: 1 } },
      `const a = vars.a, t = vars.t;
       return { vars: { a, t }, correctAnswer: a*t,
         explanationSteps: ['y=at に t='+t+' を代入して '+ (a*t) +'。'] };`,
      ['媒介変数を代入する。', 'y=at。', 'x は聞かれない。'],
      'x=x(t), y=y(t)',
      't を消してから代入しようとする。'
    ),
  ],

  'math-2bc-vectors': (d, unit) => [
    mathInput(
      '内積',
      unit,
      'a = ({{ax}}, {{ay}}), b = ({{bx}}, {{by}}) の内積を求めよ。',
      { ax: { min: -3, max: 4, step: 1 }, ay: { min: -3, max: 4, step: 1 }, bx: { min: -3, max: 4, step: 1 }, by: { min: -3, max: 4, step: 1 } },
      `const ans = vars.ax*vars.bx + vars.ay*vars.by;
       return { vars: { ax: vars.ax, ay: vars.ay, bx: vars.bx, by: vars.by }, correctAnswer: ans,
         explanationSteps: ['内積 = ax bx + ay by = '+ans+'。'] };`,
      ['成分どうしを掛けて足す。', '2次元。', 'ノルムの積ではない。'],
      'a·b = ax bx + ay by',
      '外積やノルムと混同。'
    ),
    mathInput(
      'ベクトルの大きさ',
      unit,
      'ベクトル ({{x}}, {{y}}) の大きさを求めよ（小数第2位）。',
      { x: { min: 2, max: 6, step: 1 }, y: { min: 3, max: 8, step: 1 } },
      `const x = vars.x, y = vars.y;
       const n = Math.round(Math.sqrt(x*x+y*y)*100)/100;
       return { vars: { x, y }, correctAnswer: n,
         explanationSteps: ['|a|=√(x²+y²) ≈ '+n+'。'] };`,
      ['大きさは成分の2乗和の平方根。', '小数第2位。', '符号は2乗で消える。'],
      '|a| = √(ax²+ay²)',
      '成分を足すだけにする。'
    ),
  ],

  'mathC-complex-plane-conics': (d, unit) => [
    mathInput(
      '複素数の絶対値',
      unit,
      '複素数 {{a}} + {{b}}i の絶対値を求めよ（小数第2位）。',
      { a: { min: 2, max: 6, step: 1 }, b: { min: 2, max: 6, step: 1 } },
      `const a = vars.a, b = vars.b;
       const abs = Math.round(Math.sqrt(a*a+b*b)*100)/100;
       return { vars: { a, b }, correctAnswer: abs,
         explanationSteps: ['|a+bi|=√(a²+b²) ≈ '+abs+'。'] };`,
      ['絶対値は原点からの距離。', '実部・虚部の2乗和。', '小数第2位。'],
      '|a+bi| = √(a²+b²)',
      '実部だけを絶対値にする。'
    ),
    mathInput(
      '円の半径',
      unit,
      '円 x² + y² = {{r2}} の半径を求めよ。',
      { r2: { min: 4, max: 36, step: 5 } },
      `const r2 = vars.r2;
       const r = Math.round(Math.sqrt(r2)*100)/100;
       return { vars: { r2 }, correctAnswer: r,
         explanationSteps: ['x²+y²=r² より r=√'+r2+' ≈ '+r+'。'] };`,
      ['標準形 x²+y²=r²。', '半径は右辺の平方根。', '直径と取り違えない。'],
      'x² + y² = r²',
      'r² を半径と答える。'
    ),
  ],

  'physics-mechanics': (d, unit) => [
    {
      title: '等加速度の変位',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { v: { min: 4, max: 12, step: 1 }, t: { min: 2, max: 6, step: 1 }, a: { min: 1, max: 4, step: 1 } },
      templateText: '初速度 {{v}} m/s、加速度 {{a}} m/s² で {{t}} s 進んだ変位(m)を求めよ。',
      calcLogicJS: `const v=vars.v,t=vars.t,a=vars.a; const x=v*t+0.5*a*t*t;
        return { vars:{v,t,a}, correctAnswer:x, explanationSteps:['x=v0t+(1/2)at² = '+x+' m。'] };`,
      hints: ['公式 x=v0t+(1/2)at²。', '単位は m。', '1/2 を忘れない。'] as [string, string, string],
      keyFormula: 'x = v0 t + (1/2) a t²',
      commonMistakes: 'at² をそのまま足す。',
    },
    {
      title: '運動方程式',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { m: { min: 2, max: 8, step: 1 }, a: { min: 2, max: 6, step: 1 } },
      templateText: '質量 {{m}} kg の物体に加速度 {{a}} m/s² を与える力(N)を求めよ。',
      calcLogicJS: `const m=vars.m,a=vars.a;
        return { vars:{m,a}, correctAnswer:m*a, explanationSteps:['F=ma = '+(m*a)+' N。'] };`,
      hints: ['運動方程式 F=ma。', '単位は N。', '質量と加速度を掛ける。'] as [string, string, string],
      keyFormula: 'F = ma',
      commonMistakes: '重量 mg と混同する。',
    },
  ],

  'physics-thermodynamics': (_d, unit) => [
    {
      title: '絶対温度',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { c: { min: 0, max: 80, step: 5 } },
      templateText: '{{c}} °C をケルビン(K)に換算せよ。',
      calcLogicJS: `const c=vars.c; return { vars:{c}, correctAnswer:c+273,
        explanationSteps:['T(K)=t(°C)+273 = '+(c+273)+'。'] };`,
      hints: ['0°C = 273 K。', '足すだけ。', '273.15 はここでは 273。'] as [string, string, string],
      keyFormula: 'T(K) = t(°C) + 273',
      commonMistakes: '273 を引いてしまう。',
    },
    {
      title: 'ボイルの法則',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { p1: { min: 1, max: 4, step: 1 }, v1: { min: 2, max: 8, step: 1 }, p2: { min: 2, max: 6, step: 1 } },
      templateText: 'P1={{p1}}×10⁵ Pa, V1={{v1}} L が P2={{p2}}×10⁵ Pa になったときの V2(L)を求めよ。',
      calcLogicJS: `const p1=vars.p1,v1=vars.v1,p2=vars.p2;
        const v2=Math.round((p1*v1/p2)*100)/100;
        return { vars:{p1,v1,p2}, correctAnswer:v2, explanationSteps:['P1V1=P2V2 より V2='+v2+'。'] };`,
      hints: ['温度一定なら PV 一定。', 'V2=P1V1/P2。', '単位 L のまま。'] as [string, string, string],
      keyFormula: 'P1 V1 = P2 V2',
      commonMistakes: 'P と V を掛け忘れる。',
    },
  ],

  'physics-waves': (_d, unit) => [
    {
      title: '波長',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { v: { min: 20, max: 80, step: 10 }, f: { min: 2, max: 10, step: 2 } },
      templateText: '速さ {{v}} m/s、振動数 {{f}} Hz の波の波長(m)を求めよ。',
      calcLogicJS: `const v=vars.v,f=vars.f; const l=v/f;
        return { vars:{v,f}, correctAnswer:l, explanationSteps:['λ=v/f = '+l+' m。'] };`,
      hints: ['v=fλ。', 'λ=v/f。', '単位 m。'] as [string, string, string],
      keyFormula: 'v = f λ',
      commonMistakes: 'v·f を波長と答える。',
    },
    {
      title: '周期',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { f: { min: 2, max: 10, step: 1 } },
      templateText: '振動数 {{f}} Hz の波の周期(s)を求めよ。',
      calcLogicJS: `const f=vars.f; const T=Math.round((1/f)*100)/100;
        return { vars:{f}, correctAnswer:T, explanationSteps:['T=1/f = '+T+' s。'] };`,
      hints: ['周期は振動数の逆数。', 'T=1/f。', '小数第2位でもよい。'] as [string, string, string],
      keyFormula: 'T = 1 / f',
      commonMistakes: 'f をそのまま答える。',
    },
  ],

  'physics-electromagnetism': (_d, unit) => [
    {
      title: 'オームの法則（電流）',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { v: { min: 6, max: 24, step: 3 }, r: { min: 2, max: 8, step: 1 } },
      templateText: '電圧 {{v}} V、抵抗 {{r}} Ω の回路の電流(A)を求めよ。',
      calcLogicJS: `const v=vars.v,r=vars.r; const i=v/r;
        return { vars:{v,r}, correctAnswer:i, explanationSteps:['I=V/R = '+i+' A。'] };`,
      hints: ['オームの法則 V=IR。', 'I=V/R。', '単位 A。'] as [string, string, string],
      keyFormula: 'V = I R',
      commonMistakes: 'V·R を電流と答える。',
    },
    {
      title: '直列合成抵抗',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { r1: { min: 2, max: 10, step: 1 }, r2: { min: 2, max: 10, step: 1 } },
      templateText: '抵抗 {{r1}} Ω と {{r2}} Ω を直列につないだ合成抵抗(Ω)を求めよ。',
      calcLogicJS: `const r1=vars.r1,r2=vars.r2;
        return { vars:{r1,r2}, correctAnswer:r1+r2, explanationSteps:['直列は和 R='+(r1+r2)+' Ω。'] };`,
      hints: ['直列合成は和。', '並列と混同しない。', '単位 Ω。'] as [string, string, string],
      keyFormula: 'R = R1 + R2 （直列）',
      commonMistakes: '並列の公式を使う。',
    },
  ],

  'physics-atomic': (_d, unit) => [
    {
      title: '半減期後の個数',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { n0: { min: 8, max: 32, step: 8 }, k: { min: 1, max: 3, step: 1 } },
      templateText: '初め {{n0}} 個の原子核が半減期を {{k}} 回経過したあとの個数を求めよ。',
      calcLogicJS: `const n0=vars.n0,k=vars.k; const n=n0/ (2**k);
        return { vars:{n0,k}, correctAnswer:n, explanationSteps:['N = N0 / 2^k = '+n+'。'] };`,
      hints: ['1回で半分。', 'k 回で 1/2^k。', '個数は割り切れる。'] as [string, string, string],
      keyFormula: 'N = N0 / 2^{t/T}',
      commonMistakes: 'k を掛ける。',
    },
    {
      title: '光子エネルギー比',
      unit,
      subject: 'physics' as const,
      format: 'input' as const,
      variables: { f: { min: 2, max: 8, step: 1 } },
      templateText: '振動数を {{f}} 倍にしたとき、光子のエネルギーは何倍になるか。',
      calcLogicJS: `const f=vars.f;
        return { vars:{f}, correctAnswer:f, explanationSteps:['E=hf なので振動数に比例。'+f+' 倍。'] };`,
      hints: ['E=hf。', 'h は定数。', '比は振動数の比。'] as [string, string, string],
      keyFormula: 'E = h f',
      commonMistakes: '波長に比例すると覚える。',
    },
  ],

  'chemistry-composition': (_d, unit) => [
    {
      title: '物質量',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { g: { min: 18, max: 72, step: 18 }, m: { min: 18, max: 18, step: 1 } },
      templateText: 'モル質量 {{m}} g/mol の物質 {{g}} g の物質量(mol)を求めよ。',
      calcLogicJS: `const g=vars.g,m=vars.m; const n=g/m;
        return { vars:{g,m}, correctAnswer:n, explanationSteps:['n=m/M = '+n+' mol。'] };`,
      hints: ['n = 質量 / モル質量。', '単位 mol。', '与えられた M を使う。'] as [string, string, string],
      keyFormula: 'n = m / M',
      commonMistakes: 'M を掛けてしまう。',
    },
    {
      title: '質量パーセント',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { solute: { min: 10, max: 40, step: 5 }, sol: { min: 100, max: 200, step: 50 } },
      templateText: '溶質 {{solute}} g を含む溶液 {{sol}} g の質量パーセント濃度(%)を求めよ。',
      calcLogicJS: `const solute=vars.solute, sol=vars.sol;
        const p=Math.round((solute/sol)*10000)/100;
        return { vars:{solute, sol}, correctAnswer:p, explanationSteps:['(溶質/溶液)×100 = '+p+'%。'] };`,
      hints: ['質量パーセント = 溶質/溶液×100。', '溶液は溶質+溶媒。', '今回は溶液質量が与えられている。'] as [string, string, string],
      keyFormula: '\\text{質量パーセント} = (\\text{溶質}/\\text{溶液}) \\times 100',
      commonMistakes: '溶媒質量で割る。',
    },
  ],

  'chemistry-reactions': (_d, unit) => [
    {
      title: '気体の物質量',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { v: { min: 11.2, max: 44.8, step: 11.2 } },
      templateText: '標準状態で {{v}} L の気体の物質量(mol)を求めよ（22.4 L/mol）。',
      calcLogicJS: `const v=vars.v; const n=Math.round((v/22.4)*100)/100;
        return { vars:{v}, correctAnswer:n, explanationSteps:['n=V/22.4 = '+n+' mol。'] };`,
      hints: ['標準状態 1 mol = 22.4 L。', 'n=V/22.4。', '小数でもよい。'] as [string, string, string],
      keyFormula: 'n = V / 22.4 （標準状態）',
      commonMistakes: '22.4 を掛ける。',
    },
    {
      title: '係数比',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { a: { min: 1, max: 3, step: 1 }, n: { min: 2, max: 6, step: 1 } },
      templateText: '反応 aA → 生成物 で A が {{n}} mol のとき、係数 a={{a}} として A の係数そのものを答えよ。',
      calcLogicJS: `const a=vars.a;
        return { vars:{a, n: vars.n}, correctAnswer:a, explanationSteps:['反応式の係数 a は '+a+'。'] };`,
      hints: ['係数は反応式に書いてある。', '物質量比に使う。', '今回は係数 a を答える。'] as [string, string, string],
      keyFormula: '係数比 = 物質量比',
      commonMistakes: '質量比と混同。',
    },
  ],

  'chemistry-acid-base': (_d, unit) => [
    {
      title: '中和の物質量',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { c: { min: 1, max: 2, step: 1 }, v: { min: 10, max: 50, step: 10 } },
      templateText: '{{c}} mol/L の塩酸 {{v}} mL に含まれる HCl の物質量(mol)を求めよ。',
      calcLogicJS: `const c=vars.c,v=vars.v; const n=c*(v/1000);
        return { vars:{c,v}, correctAnswer:n, explanationSteps:['n=cV = '+n+' mol（VはL）。'] };`,
      hints: ['n=cV。', 'mL を L にする（÷1000）。', '1価どうし。'] as [string, string, string],
      keyFormula: 'n = c V',
      commonMistakes: 'mL のまま掛ける。',
    },
    {
      title: 'pH（水素イオン）',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { p: { min: 1, max: 3, step: 1 } },
      templateText: 'pH = {{p}} の水溶液の [H+] は 10 の何乗 mol/L か。指数（負の整数）を答えよ。',
      calcLogicJS: `const p=vars.p;
        return { vars:{p}, correctAnswer:-p, explanationSteps:['[H+]=10^{-pH} なので指数は -'+p+'。'] };`,
      hints: ['pH = -log[H+]。', '[H+]=10^{-pH}。', '指数は -pH。'] as [string, string, string],
      keyFormula: 'pH = -\\log [H+]',
      commonMistakes: '符号を落とす。',
    },
  ],

  'chemistry-redox': (_d, unit) => [
    {
      title: '酸化数の変化',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { from: { min: 0, max: 2, step: 1 }, to: { min: 3, max: 7, step: 1 } },
      templateText: '酸化数が {{from}} から {{to}} へ変化したとき、1原子あたり何電子酸化されたか。',
      calcLogicJS: `const from=vars.from,to=vars.to; const e=to-from;
        return { vars:{from,to}, correctAnswer:e, explanationSteps:['酸化数の増加 = 失った電子数 = '+e+'。'] };`,
      hints: ['酸化で酸化数は増える。', '増加分が失電子数。', '還元と逆。'] as [string, string, string],
      keyFormula: '\\text{酸化数の増加} = \\text{失電子数}',
      commonMistakes: '還元と酸化を逆にする。',
    },
    {
      title: '半反応の電子',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { e: { min: 1, max: 3, step: 1 } },
      templateText: 'Fe^{3+} が {{e}} 電子還元されたあとの酸化数を求めよ。',
      calcLogicJS: `const e=vars.e;
        return { vars:{e}, correctAnswer:3-e, explanationSteps:['Fe^{3+} が '+e+' 電子還元されると酸化数は '+(3-e)+'。'] };`,
      hints: ['還元で酸化数は減る。', '電子1つで1減る。', '3-e が答え。'] as [string, string, string],
      keyFormula: '\\text{還元: 酸化数が減少}',
      commonMistakes: '電子を足して酸化数を増やす。',
    },
  ],

  'chemistry-equilibrium': (_d, unit) => [
    {
      title: '平衡定数の形',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { a: { min: 1, max: 2, step: 1 }, b: { min: 1, max: 2, step: 1 } },
      templateText: 'aA ⇌ bB で a={{a}}, b={{b}} のとき、K = [B]^{b}/[A]^{a} の分子の指数 b を答えよ。',
      calcLogicJS: `const b=vars.b;
        return { vars:{a:vars.a,b}, correctAnswer:b, explanationSteps:['生成物の係数が分子の指数。b='+b+'。'] };`,
      hints: ['K は生成物/反応物。', '指数は係数。', '今回は b を答える。'] as [string, string, string],
      keyFormula: 'K = [B]^b / [A]^a',
      commonMistakes: '反応物を分子に置く。',
    },
    {
      title: '圧平衡の比',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { p: { min: 2, max: 6, step: 1 } },
      templateText: '平衡で生成物の分圧が反応物の {{p}} 倍（係数1:1）のとき Kp の値を求めよ。',
      calcLogicJS: `const p=vars.p;
        return { vars:{p}, correctAnswer:p, explanationSteps:['Kp=P生成/P反応 = '+p+'。'] };`,
      hints: ['1:1 なら Kp は分圧比。', '与えられた倍率。', '単位は省略。'] as [string, string, string],
      keyFormula: 'Kp = P_{prod} / P_{react}',
      commonMistakes: '濃度平衡と混同。',
    },
  ],

  'chemistry-inorganic': (_d, unit) => [
    {
      title: 'イオンの電荷',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { n: { min: 1, max: 3, step: 1 } },
      templateText: 'Al が 3 価の陽イオンになるとき、電子を何個失うか。与えられたプレースホルダ {{n}} ではなく 3 を答えよ。',
      calcLogicJS: `return { vars:{n:vars.n}, correctAnswer:3, explanationSteps:['Al^{3+} は電子3個を失う。'] };`,
      hints: ['13族は3価になりやすい。', '陽イオンは電子を失う。', '答えは 3。'] as [string, string, string],
      keyFormula: '\\text{Al} \\to \\text{Al}^{3+} + 3e^-',
      commonMistakes: '電子を得ると覚える。',
    },
    {
      title: '中和生成塩',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { v: { min: 1, max: 2, step: 1 } },
      templateText: 'H2SO4 + 2NaOH の反応で生じる塩 Na2SO4 の Na の数を答えよ（係数確認、{{v}} は未使用）。',
      calcLogicJS: `return { vars:{v:vars.v}, correctAnswer:2, explanationSteps:['Na2SO4 の Na は 2。'] };`,
      hints: ['硫酸は2価の酸。', '塩は Na2SO4。', 'Na の数は 2。'] as [string, string, string],
      keyFormula: '\\text{H}_2\\text{SO}_4 + 2\\text{NaOH} \\to \\text{Na}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}',
      commonMistakes: 'NaHSO4 と取り違える。',
    },
  ],

  'chemistry-organic': (_d, unit) => [
    {
      title: 'IHD（不飽和度）',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { c: { min: 2, max: 6, step: 1 }, h: { min: 4, max: 12, step: 2 } },
      templateText: '組成式 C_{{c}}H_{{h}} の不飽和度（IHD）を求めよ。IHD=(2C+2-H)/2。',
      calcLogicJS: `const c=vars.c,h=vars.h; const ihd=(2*c+2-h)/2;
        return { vars:{c,h}, correctAnswer:ihd, explanationSteps:['IHD=(2C+2-H)/2 = '+ihd+'。'] };`,
      hints: ['アルカンは IHD=0。', '二重結合1つで +1。', 'ハロゲンは H と同じ扱い（今回なし）。'] as [string, string, string],
      keyFormula: 'IHD = (2C + 2 - H)/2',
      commonMistakes: '2で割らない。',
    },
    {
      title: 'アルカンのH数',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { n: { min: 2, max: 6, step: 1 } },
      templateText: '炭素数 {{n}} のアルカン CnH? の水素原子数を求めよ。',
      calcLogicJS: `const n=vars.n; const h=2*n+2;
        return { vars:{n}, correctAnswer:h, explanationSteps:['アルカンは CnH_{2n+2} なので H='+h+'。'] };`,
      hints: ['アルカンの一般式 CnH2n+2。', '2n+2 を計算。', '環や二重結合はない。'] as [string, string, string],
      keyFormula: '\\text{C}_n\\text{H}_{2n+2}',
      commonMistakes: '2n で止める（アルケン）。',
    },
  ],

  'chemistry-polymer': (_d, unit) => [
    {
      title: '重合度',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { m: { min: 10000, max: 50000, step: 10000 }, mon: { min: 28, max: 104, step: 26 } },
      templateText: '高分子の平均分子量 {{m}}、モノマー分子量 {{mon}} のとき平均重合度を求めよ（整数）。',
      calcLogicJS: `const m=vars.m, mon=vars.mon; const n=Math.round(m/mon);
        return { vars:{m,mon}, correctAnswer:n, explanationSteps:['重合度 ≈ M/モノマーM = '+n+'。'] };`,
      hints: ['重合度 = 高分子M / モノマーM。', '整数に丸める。', '付加重合を想定。'] as [string, string, string],
      keyFormula: 'n ≈ M_{polymer} / M_{monomer}',
      commonMistakes: '掛け算にする。',
    },
    {
      title: '繰り返し単位',
      unit,
      subject: 'chemistry' as const,
      format: 'input' as const,
      variables: { n: { min: 2, max: 5, step: 1 } },
      templateText: 'モノマー C2H4 が {{n}} 個つながったときの炭素原子の総数を求めよ。',
      calcLogicJS: `const n=vars.n;
        return { vars:{n}, correctAnswer:2*n, explanationSteps:['繰り返し単位に C が2つ。合計 '+(2*n)+'。'] };`,
      hints: ['エチレンは炭素2つ。', 'n 個で 2n。', '水素は聞かれない。'] as [string, string, string],
      keyFormula: '\\text{-(C}_2\\text{H}_4\\text{)}_n-',
      commonMistakes: 'n だけ答える。',
    },
  ],
};

export function getExtraBlueprints(
  unitId: string | undefined,
  difficulty: number,
  unitTitle: string
): TemplateBlueprint[] {
  if (!unitId) return [];
  const factory = EXTRA_BY_UNIT[unitId];
  if (!factory) return [];
  return factory(difficulty, unitTitle) as TemplateBlueprint[];
}

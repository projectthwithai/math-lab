// ==========================================
// Apex Suite: Math Lab - Remaining unit exam blueprints
// ==========================================
// 既存の tieredBlueprints が未カバーの数A/II/B/III/C・物理・化学を
// ★1 教科書 / ★2-3 標準入試 / ★4-5 難関二次 に分岐する。

import type { Subject } from '@/types/mathLab';
import type { PatternKey, TemplateBlueprint } from '@/lib/mock/blueprintTypes';
import { difficultySpan, type DifficultyTier } from '@/lib/mock/blueprintTypes';

function math(
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

function sci(
  subject: Subject,
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
    subject,
    format: 'input',
    variables,
    templateText,
    calcLogicJS,
    hints,
    keyFormula,
    commonMistakes,
  };
}

export function buildRemainingExamBlueprint(
  patternKey: PatternKey,
  tier: DifficultyTier,
  difficulty: number,
  _unitTitle: string
): TemplateBlueprint | null {
  switch (patternKey) {
    case 'combinatorics':
      return combinatoricsByTier(tier);
    case 'integers':
      return integersByTier(tier);
    case 'remainder_theorem':
      return remainderByTier(tier);
    case 'statistics':
      return statisticsByTier(tier);
    case 'differentiation_advanced':
      return diffAdvByTier(tier, difficulty);
    case 'integration_advanced':
      return intAdvByTier(tier);
    case 'parametric':
      return parametricByTier(tier);
    case 'complex_plane':
      return complexByTier(tier);
    case 'wave_speed':
      return wavesByTier(tier);
    case 'ohms_law':
      return circuitByTier(tier);
    case 'half_life':
      return atomicByTier(tier);
    case 'mole_calculation':
      return moleByTier(tier);
    case 'neutralization':
      return acidBaseByTier(tier);
    case 'redox':
      return redoxByTier(tier);
    case 'equilibrium':
      return equilibriumByTier(tier);
    case 'inorganic_stoichiometry':
      return inorganicByTier(tier);
    case 'organic_ihd':
      return organicByTier(tier);
    case 'polymer':
      return polymerByTier(tier);
    case 'generic_math':
      return combinatoricsByTier(tier);
    case 'generic_physics':
      return circuitByTier(tier);
    case 'generic_chemistry':
      return moleByTier(tier);
    default:
      return null;
  }
}

function combinatoricsByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 条件付きの組合せ',
      '場合の数と確率',
      '{{n}} 人から委員長1人と委員 {{k}} 人を選ぶ（委員長は委員と重複しない）。総数を求めよ。',
      { n: { min: 8, max: 12, step: 1 }, k: { min: 2, max: 4, step: 1 } },
      `const n = vars.n, k = Math.min(vars.k, vars.n - 1);
       function C(n, r) { let x=1; for (let i=0;i<r;i++) x=x*(n-i)/(i+1); return Math.round(x); }
       const answer = n * C(n-1, k);
       return { vars:{n,k}, correctAnswer: answer, explanationSteps: [
         '委員長の選び方は $' + n + '$ 通り。',
         '残りから委員を選ぶのは $_{' + (n-1) + '}C_{' + k + '}$。',
         '積は $' + answer + '$。公式 $n\\\\cdot {}_{n-1}C_k$。',
       ]};`,
      ['先に特別な役職を決める。', '残りは組合せ。', '$n \\times {}_{n-1}C_k$。'],
      '$n \\times {}_{n-1}C_{k}$',
      '委員長を委員に含めて二重に数える。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 条件付き確率',
      '場合の数と確率',
      '2個のさいころを同時に投げる。出目の和が偶数であるとき、少なくとも一方が {{k}} である条件付き確率を小数第2位まで求めよ。',
      { k: { min: 4, max: 6, step: 1 } },
      `const k = vars.k;
       let even = 0, both = 0;
       for (let i=1;i<=6;i++) for (let j=1;j<=6;j++) {
         if ((i+j)%2!==0) continue;
         even += 1;
         if (i===k || j===k) both += 1;
       }
       const answer = Math.round((both/even)*100)/100;
       return { vars:{k}, correctAnswer: answer, explanationSteps: [
         '全事象は 36。偶数が ' + even + ' 通り（条件）。',
         'そのうち少なくとも一方が ' + k + ' は ' + both + ' 通り。',
         '条件付き確率 $P(A|B)=P(A\\\\cap B)/P(B)=' + answer + '$。',
       ]};`,
      ['先に「和が偶数」を分母にする。', '偶奇が同じ組が偶数和。', '$P(A\\mid B)=n(A\\cap B)/n(B)$。'],
      '$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$',
      '全36で割ってしまう。'
    );
  }
  return math(
    '★難関: 非復元抽出の確率漸化式',
    '場合の数と確率',
    '袋に赤玉 {{r}} 個、白玉 {{w}} 個。1個ずつ非復元で取り出す。2回目が赤である確率を既約分数 a/b としたとき a+b を求めよ。',
    { r: { min: 3, max: 6, step: 1 }, w: { min: 2, max: 5, step: 1 } },
    `function gcd(a,b){ while(b){ const t=a%b; a=b; b=t;} return a; }
     const r = vars.r, w = vars.w, n = r+w;
     const num = r; const den = n;
     const g = gcd(num, den);
     const answer = num/g + den/g;
     return { vars:{r,w}, correctAnswer: answer, explanationSteps: [
       '漸化式: $p_k=$ k 回目が赤。$p_1=r/n$。',
       '全確率: 1回目赤なら残り赤 r-1、白なら赤 r。',
       '$p_2=\\\\frac{r}{n}\\\\cdot\\\\frac{r-1}{n-1}+\\\\frac{w}{n}\\\\cdot\\\\frac{r}{n-1}=\\\\frac{r}{n}$。',
       '非復元でも k 回目が赤の確率は常に $r/n$（対称性）。',
       '既約分数は $' + (num/g) + '/' + (den/g) + '$ より a+b=' + answer + '。',
       '検算: 2回目の位置は一様。',
     ]};`,
    ['位置の対称性を疑う。', '全確率の定理で2通りに分ける。', '約分して分子+分母。'],
    '$p_k=\\dfrac{r}{r+w}$（非復元でも一定）',
    '2回目だけ分母を n-1 のまま残して計算を止める。'
  );
}

function integersByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 1次不定方程式の整数解の存在',
      '整数の性質',
      '方程式 {{a}}x + {{b}}y = {{c}} が整数解をもつとき 1、もたないとき 0 を答えよ。',
      { a: { min: 4, max: 9, step: 1 }, b: { min: 6, max: 12, step: 1 }, c: { min: 6, max: 24, step: 1 } },
      `function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t;} return a; }
       const a=vars.a,b=vars.b,c=vars.c;
       const g=gcd(a,b);
       const answer = c%g===0 ? 1 : 0;
       return { vars:{a,b,c}, correctAnswer: answer, explanationSteps: [
         '$\\\\gcd(' + a + ',' + b + ')=' + g + '$。',
         '整数解の必要十分条件は $g$ が $' + c + '$ を割り切ること。',
         '答えは ' + answer + '。',
       ]};`,
      ['まず gcd を互除法で。', '右辺がその倍数か。', 'ベズーの補題。'],
      '$ax+by=c$ が整数解をもつ $\\iff \\gcd(a,b)\\mid c$',
      'gcd で割れるのに「もたない」とする。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 互除法のステップ数',
      '整数の性質',
      '{{m}} と {{n}} にユークリッドの互除法を適用するとき、余りが 0 になるまでの除算回数を求めよ。',
      { m: { min: 48, max: 120, step: 1 }, n: { min: 18, max: 45, step: 1 } },
      `let x=Math.max(vars.m,vars.n), y=Math.min(vars.m,vars.n), steps=0;
       while(y!==0){ const r=x%y; x=y; y=r; steps+=1; }
       return { vars:{m:vars.m,n:vars.n}, correctAnswer: steps, explanationSteps: [
         '大きい方を小さい方で割り、余りで置き換える。',
         '余り 0 まで ' + steps + ' 回。最後の割る数が gcd。',
       ]};`,
      ['大きい数を左に置く。', '商ではなく回数を数える。', 'フィボナッチで最悪回数。'],
      '$\\gcd(a,b)=\\gcd(b,a\\bmod b)$',
      '最後の余り0の行を回数に含め忘れる。'
    );
  }
  return math(
    '★難関: 非負整数解の個数',
    '整数の性質',
    '不定方程式 $3x+5y={{c}}$ の非負整数解 $(x,y)$ の組の個数を求めよ。',
    { c: { min: 18, max: 40, step: 1 } },
    `const c=vars.c;
     let count=0;
     for (let y=0; 5*y<=c; y++) {
       if ((c-5*y)%3===0) count += 1;
     }
     return { vars:{c}, correctAnswer: count, explanationSteps: [
       '$y=0,1,\\\\ldots,\\\\lfloor c/5\\\\rfloor$ を走査し $c-5y$ が 3 の倍数か見る。',
       '一般解は特解から周期 5,3 で動く。非負の窓の長さが個数。',
       '個数は ' + count + '。',
     ]};`,
    ['y を有界に走査する。', 'x=(c-5y)/3 が 0 以上整数。', '周期は lcm ではなく係数。'],
    '$3x+5y=c$ の非負解は $y\\equiv c\\pmod{3}$ かつ $0\\le y\\le c/5$',
    '負の x を含めてしまう。'
  );
}

function remainderByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 剰余の定理',
      'いろいろな式',
      '整式 $P(x)=x^3+{{a}}x+{{b}}$ を $(x-{{c}})$ で割った余りを求めよ。',
      { a: { min: -4, max: 4, step: 1 }, b: { min: -6, max: 6, step: 1 }, c: { min: -2, max: 3, step: 1 } },
      `const a=vars.a,b=vars.b,c=vars.c===0?1:vars.c;
       const rem=c*c*c+a*c+b;
       return { vars:{a,b,c}, correctAnswer: rem, explanationSteps: [
         '剰余の定理より余りは $P(c)$。',
         '$P(' + c + ')=' + rem + '$。',
       ]};`,
      ['割らずに代入。', '$P(c)$ が余り。', '負の奇数乗に注意。'],
      '$P(x)=(x-c)Q(x)+P(c)$',
      '代入する値の符号を逆にする。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 因数定理',
      'いろいろな式',
      '$P(x)=x^3+{{p}}x^2+{{q}}x+{{r}}$ が $x+{{s}}$ を因数にもつとき 1、もたないとき 0 を答えよ。',
      { p: { min: -3, max: 3, step: 1 }, q: { min: -4, max: 4, step: 1 }, r: { min: -6, max: 6, step: 1 }, s: { min: 1, max: 3, step: 1 } },
      `const p=vars.p,q=vars.q,r=vars.r,s=vars.s;
       const val=(-s)**3 + p*(-s)**2 + q*(-s) + r;
       const answer = val===0 ? 1 : 0;
       return { vars:{p,q,r,s}, correctAnswer: answer, explanationSteps: [
         '因数定理: $x+s$ が因数 $\\\\iff P(-s)=0$。',
         '$P(-' + s + ')=' + val + '$ より答え ' + answer + '。',
       ]};`,
      ['$x+s=0$ の根を代入。', '値が 0 かだけ見る。', '組立除法でも可。'],
      '$x-a$ が因数 $\\iff P(a)=0$',
      '$P(s)$ を計算してしまう。'
    );
  }
  return math(
    '★難関: 1次の余り',
    'いろいろな式',
    '$P(x)=x^3+{{a}}x$ を $(x-1)(x-{{b}})$ で割った余りを $mx+n$ とする。$m+n$ を求めよ（$b\\\\ne 1$）。',
    { a: { min: 2, max: 6, step: 1 }, b: { min: 2, max: 5, step: 1 } },
    `const a=vars.a, b=vars.b===1?2:vars.b;
     const p1=1+a;
     const pb=b*b*b + a*b;
     const m=(p1-pb)/(1-b);
     const n=p1-m;
     const answer=Math.round((m+n)*100)/100;
     return { vars:{a,b}, correctAnswer: answer, explanationSteps: [
       '次数が2未満なので余りは $mx+n$。',
       '$P(1)=m+n$、$P(b)=mb+n$。',
       '$P(1)=1+a=' + p1 + '$、$P(b)=' + pb + '$。',
       '連立して $m=' + m + '$、$n=' + n + '$。',
       '$m+n=' + answer + '$。',
     ]};`,
    ['余りは1次。', '2点代入で連立。', '割る式の根を使う。'],
    '$P(x)=(x-1)(x-b)Q(x)+mx+n$',
    '定数余りだと思って P の値だけ答える。'
  );
}

function statisticsByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 二項分布の期待値',
      '統計的な推測',
      '成功確率 $p={{p}}/10$ のベルヌーイ試行を {{n}} 回行う。成功回数の期待値を求めよ。',
      { n: { min: 8, max: 20, step: 1 }, p: { min: 2, max: 8, step: 1 } },
      `const n=vars.n, p=vars.p/10;
       const answer=Math.round(n*p*100)/100;
       return { vars:{n,p:vars.p}, correctAnswer: answer, explanationSteps: [
         '$X\\\\sim B(n,p)$ なら $E[X]=np$。',
         '$' + n + '\\\\times ' + p + '=' + answer + '$。',
       ]};`,
      ['二項分布の平均は $np$。', 'p は 10 で割る。', '分散は $np(1-p)$ と混同しない。'],
      '$E[X]=np$',
      '分散の公式を平均に使う。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 二項分布の分散',
      '統計的な推測',
      '$X\\sim B({{n}}, {{p}}/10)$ の分散を小数第2位まで求めよ。',
      { n: { min: 10, max: 20, step: 1 }, p: { min: 2, max: 7, step: 1 } },
      `const n=vars.n, p=vars.p/10;
       const answer=Math.round(n*p*(1-p)*100)/100;
       return { vars:{n,p:vars.p}, correctAnswer: answer, explanationSteps: [
         '$V(X)=np(1-p)$。',
         '代入して ' + answer + '。',
       ]};`,
      ['分散は $npq$。', 'q=1-p。', '連続補正は不要。'],
      '$V(X)=np(1-p)$',
      '$np$ を分散と答える。'
    );
  }
  return math(
    '★難関: 標本分散と母分散',
    '統計的な推測',
    '母分散 $\\sigma^2={{v}}$ の正規母集団から大きさ {{n}} の標本をとる。不偏分散の期待値と標本平均の分散 $V(\\bar X)$ の和を小数第2位まで求めよ。',
    { v: { min: 4, max: 16, step: 1 }, n: { min: 5, max: 12, step: 1 } },
    `const v=vars.v, n=vars.n;
     const answer=Math.round((v + v/n)*100)/100;
     return { vars:{v,n}, correctAnswer: answer, explanationSteps: [
       '不偏分散 $s^2$ は $E[s^2]=\\\\sigma^2=' + v + '$。',
       '$V(\\\\bar X)=\\\\sigma^2/n=' + (v/n) + '$。',
       '和は ' + answer + '。標本分散（/n）と不偏（/(n-1)）を混同しない。',
     ]};`,
    ['不偏分散の期待値は母分散。', '標本平均の分散は n で割る。', '足すだけ。'],
    '$E[s^2]=\\sigma^2,\\quad V(\\bar X)=\\sigma^2/n$',
    '標本平均の分散を $\\sigma^2$ のままにする。'
  );
}

function diffAdvByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  const kRange = difficultySpan(difficulty, 1, 4);
  if (tier === 'basic') {
    return math(
      '★基礎: 積の微分',
      '微分法（数III）',
      '$f(x)=x^{{n}} e^{x}$ の $x=0$ における微分係数を求めよ。',
      { n: { min: 1, max: Math.max(3, kRange.max), step: 1 } },
      `const n=vars.n;
       const answer = n===1 ? 1 : 0;
       return { vars:{n}, correctAnswer: n===1?1:0, explanationSteps: [
         '積の法則 $ (uv)=u v + u v $ で $u=x^n$, $v=e^x$。',
         '$f(x)=n x^{n-1}e^x + x^n e^x$。',
         'x=0 では n=1 のときだけ 1、それ以外 0。今回 n=' + n + ' なので ' + (n===1?1:0) + '。',
       ]};`,
      ['積の法則。', 'e^x は 0 で 1。', 'x^n の微分が残るか。'],
      '$(uv)=u\\prime v+uv\\prime$',
      'e^x ごと 0 にする。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 陰関数の微分',
      '微分法（数III）',
      '$x^2+y^2={{r}}$ 上の点 $({{x0}}, y)$（$y>0$）における $dy/dx$ を求めよ（小数第2位まで）。',
      { r: { min: 25, max: 36, step: 1 }, x0: { min: 1, max: 4, step: 1 } },
      `const r=vars.r, x0=vars.x0;
       const y=Math.sqrt(Math.max(0.01, r-x0*x0));
       const deriv=Math.round((-x0/y)*100)/100;
       return { vars:{r,x0}, correctAnswer: deriv, explanationSteps: [
         '両辺微分 $2x+2y y=0$。',
         '$y=-x/y$。点は y=' + Math.round(y*100)/100 + '。',
         '傾き ' + deriv + '。',
       ]};`,
      ['陰関数微分。', '上半円は y>0。', '接線の傾き。'],
      '$2x+2y\\,y\\prime=0$',
      'y の符号を落とす。'
    );
  }
  return math(
    '★難関: 媒介変数表示の2階微分',
    '微分法（数III）',
    '$x=t^2$, $y=t^3-{{k}}t$ の $t=1$ における $d^2y/dx^2$ を小数第2位まで求めよ。',
    { k: { min: 1, max: 4, step: 1 } },
    `const k=vars.k, t=1;
     const dx=2*t, dy=3*t*t-k;
     const d2=Math.round(((6*t*dx - dy*2)/(dx*dx*dx))*100)/100;
     return { vars:{k}, correctAnswer: d2, explanationSteps: [
       '$dx/dt=2t$, $dy/dt=3t^2-k$。',
       '$dy/dx=(dy/dt)/(dx/dt)$。',
       '$d^2y/dx^2 = \\frac{d}{dt}(dy/dx)\\big/ (dx/dt)$。',
       't=1 で ' + d2 + '。',
     ]};`,
    ['まず1階を t の関数に。', 't で微分してから dx/dt で割る。', '公式 $\\frac{d}{dt}(y/x)/x$。'],
    '$\\dfrac{d^2y}{dx^2}=\\dfrac{\\frac{d}{dt}(dy/dx)}{dx/dt}$',
    '2階を $(d^2y/dt^2)/(d^2x/dt^2)$ と誤る。'
  );
}

function intAdvByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 置換積分の準備',
      '積分法（数III）',
      '$\\int_0^{{a}} 2x\\, dx$ を求めよ。',
      { a: { min: 2, max: 5, step: 1 } },
      `const a=vars.a; const answer=a*a;
       return { vars:{a}, correctAnswer: answer, explanationSteps: [
         '$\\\\int 2x dx = x^2$。定積分は $a^2-0=' + answer + '$。',
       ]};`,
      ['原始関数は $x^2$。', '上端を代入。', '回転体ではない。'],
      '$\\int 2x\\,dx=x^2+C$',
      '2a と答える。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 回転体の体積（x軸）',
      '積分法（数III）',
      '$y=x$ と $x={{a}}$、$x$ 軸、$y$ 軸で囲まれた部分を x 軸のまわりに1回転した体積を求めよ（$\\\\pi$ は含めず係数のみ、小数第2位まで）。',
      { a: { min: 2, max: 4, step: 1 } },
      `const a=vars.a;
       const answer=Math.round((a*a*a/3)*100)/100;
       return { vars:{a}, correctAnswer: answer, explanationSteps: [
         '$V=\\\\pi \\\\int_0^a x^2 dx = \\\\pi a^3/3$。',
         '$\\\\pi$ を除いた係数は ' + answer + '。',
       ]};`,
      ['円盤法 $V=\\pi\\int y^2 dx$。', 'y=x。', 'π は答に含めない。'],
      '$V=\\pi\\int_a^b [f(x)]^2 dx$',
      'π を掛けた値を答える。'
    );
  }
  return math(
    '★難関: 断面が正方形の立体の体積',
    '積分法（数III）',
    '底面が $x$ 軸上 $[0,{{a}}]$、$y=\\\\sqrt{x}$ と x 軸で囲まれた図形。x に垂直な断面が正方形のとき体積を小数第2位まで求めよ。',
    { a: { min: 4, max: 9, step: 1 } },
    `const a=vars.a;
     const answer=Math.round((a*a/2)*100)/100;
     return { vars:{a}, correctAnswer: answer, explanationSteps: [
       '断面の1辺は高さ $\\\\sqrt{x}$。面積 $x$。',
       '$V=\\\\int_0^a x dx = a^2/2=' + answer + '$。',
       '回転体の円盤法と混同しない。',
     ]};`,
    ['断面積関数 A(x) を書く。', '正方形だから辺の2乗。', '定積分。'],
    '$V=\\int_a^b A(x)\\,dx$',
    '回転体 $\\pi y^2$ を使ってしまう。'
  );
}

function parametricByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 媒介変数の点の座標',
      '媒介変数・極座標',
      '$x=2\\cos t$, $y=2\\sin t$ の $t={{deg}}\\circ$ における x 座標を小数第2位まで求めよ。',
      { deg: { min: 30, max: 60, step: 15 } },
      `const deg=vars.deg;
       const x=Math.round(2*Math.cos(deg*Math.PI/180)*100)/100;
       return { vars:{deg}, correctAnswer: x, explanationSteps: [
         'ラジアンに直して $\\\\cos$。',
         'x=2 cos(' + deg + '°)=' + x + '。円 $x^2+y^2=4$。',
       ]};`,
      ['度をラジアンに。', 'x=2cos t。', '軌跡は円。'],
      '$x=r\\cos t$',
      '度のまま Math.cos に入れる。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 極方程式の r',
      '媒介変数・極座標',
      '極方程式 $r={{a}}(1+\\cos\\theta)$ の $\\theta=0$ における r を求めよ。',
      { a: { min: 2, max: 5, step: 1 } },
      `const a=vars.a;
       return { vars:{a}, correctAnswer: 2*a, explanationSteps: [
         'カージオイド。$\\\\theta=0$ で $r=a(1+1)=2a=' + (2*a) + '$。',
       ]};`,
      ['cos0=1。', 'リマソン/心臓形。', 'r=2a。'],
      '$r=a(1+\\cos\\theta)$',
      '1-cos と取り違える。'
    );
  }
  return math(
    '★難関: 媒介変数表示の面積',
    '媒介変数・極座標',
    '$x=t-\\sin t$, $y=1-\\cos t$（サイクロイド）の $0\\le t\\le \\pi$ における x 軸との面積 $\\int y dx$ を小数第1位まで求めよ。',
    { dummy: { min: 1, max: 1, step: 1 } },
    `const answer=Math.round((Math.PI)*10)/10;
     return { vars:{}, correctAnswer: answer, explanationSteps: [
       '$dx=(1-\\\\cos t)dt$。$y=1-\\\\cos t$。',
       '$\\\\int_0^{\\\\pi} (1-\\\\cos t)^2 dt = \\\\int (1-2\\\\cos t+\\\\cos^2 t)dt$。',
       '$\\\\cos^2=(1+\\\\cos 2t)/2$ より値は $\\\\pi$（小数第1位 ' + answer + '）。',
     ]};`,
    ['dx=(dx/dt)dt。', '(1-cos)^2 を展開。', '半アーチで π。'],
    '$S=\\int_{t_1}^{t_2} y(t) x\\prime(t)\\,dt$',
    'y だけ積分して dx を忘れる。'
  );
}

function complexByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return math(
      '★基礎: 複素数の絶対値',
      '複素数平面',
      '$z={{a}}+{{b}}i$ の $|z|$ を小数第2位まで求めよ。',
      { a: { min: 3, max: 8, step: 1 }, b: { min: 4, max: 8, step: 1 } },
      `const a=vars.a,b=vars.b;
       const answer=Math.round(Math.sqrt(a*a+b*b)*100)/100;
       return { vars:{a,b}, correctAnswer: answer, explanationSteps: [
         '$|z|=\\\\sqrt{a^2+b^2}=' + answer + '$。',
       ]};`,
      ['実部虚部の平方和。', 'ルート。', '偏角は聞かれない。'],
      '$|a+bi|=\\sqrt{a^2+b^2}$',
      'a+b と答える。'
    );
  }
  if (tier === 'standard') {
    return math(
      '★標準: 偏角が一定の軌跡',
      '複素数平面',
      '$\\arg(z-{{a}})=\\pi/4$ は点 ({{a}},0) を通る半直線。この直線の傾きを求めよ。',
      { a: { min: 1, max: 4, step: 1 } },
      `return { vars:{a:vars.a}, correctAnswer: 1, explanationSteps: [
         'arg=π/4 は実軸正方向から 45°。傾きは $\\\\tan(\\\\pi/4)=1$。',
       ]};`,
      ['偏角一定は半直線。', 'π/4 は45°。', '傾き tan。'],
      '$\\arg(z-z_0)=\\theta$',
      '円と答える。'
    );
  }
  return math(
    '★難関: 円の軌跡の半径',
    '複素数平面',
    '$|z-{{a}}|=2|z-{{b}}|$ を満たす点 z の軌跡は円である。その半径を小数第2位まで求めよ（a,b は実数）。',
    { a: { min: 0, max: 0, step: 1 }, b: { min: 3, max: 6, step: 1 } },
    `const a=0, b=vars.b;
     const k=2;
     const center = (a - k*k*b)/(1-k*k);
     const radius = Math.round(Math.abs(k*(a-b)/(1-k*k))*100)/100;
     return { vars:{a,b}, correctAnswer: radius, explanationSteps: [
       '$|z-\\alpha|=k|z-\\beta|$ (k=2) はアポロニウスの円。',
       '半径 $|k(\\\\alpha-\\\\beta)/(1-k^2)|=' + radius + '$。',
       '中心は実軸上 ' + Math.round(center*100)/100 + '。',
     ]};`,
    ['両辺2乗して展開。', 'k≠1 なので円。', '半径公式。'],
    '$|z-\\alpha|=k|z-\\beta|\\ (k\\ne 1)$ は円',
    '垂直二等分線（k=1）と混同。'
  );
}

function wavesByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('physics','★基礎: 波長と振動数','波動',
      '波速 {{v}} m/s、振動数 {{f}} Hz の波長[m]を求めよ。',
      { v: { min: 320, max: 360, step: 10 }, f: { min: 200, max: 400, step: 50 } },
      `const v=vars.v,f=vars.f; const lam=Math.round((v/f)*100)/100;
       return { vars:{v,f}, correctAnswer: lam, explanationSteps: ['$v=f\\\\lambda$ より $\\\\lambda=v/f=' + lam + '$。'] };`,
      ['$v=f\\lambda$。','単位は m。','周期は 1/f。'],
      '$v=f\\lambda$',
      'v f を掛けてしまう。'
    );
  }
  if (tier === 'standard') {
    return sci('physics','★標準: ドップラー効果','波動',
      '音速 340 m/s。振動数 {{f}} Hz の音源が観測者に {{u}} m/s で近づく。観測振動数[Hz]を整数で求めよ。',
      { f: { min: 400, max: 600, step: 50 }, u: { min: 10, max: 30, step: 5 } },
      `const f=vars.f,u=vars.u;
       const ans=Math.round(f*340/(340-u));
       return { vars:{f,u}, correctAnswer: ans, explanationSteps: [
         '音源が近づく $f=f_0\\\\frac{V}{V-u_s}$。',
         '代入して ' + ans + ' Hz。',
       ]};`,
      ['音源移動は分母。','近づくと分母が減る。','観測者移動は分子。'],
      '$f=f_0\\dfrac{V\\pm u_o}{V\\mp u_s}$',
      '分子分母を逆にする。'
    );
  }
  return sci('physics','★難関: ヤングの干渉','波動',
    '波長 {{lam}} nm の光、スリット間隔 0.20 mm、スクリーン 1.00 m。隣接縞間隔[mm]を小数第2位まで求めよ。',
    { lam: { min: 400, max: 700, step: 50 } },
    `const lam=vars.lam * 1e-9, d=0.20e-3, L=1.00;
     const Delta=Math.round((lam*L/d)*1e5)/100;
     return { vars:{lam:vars.lam}, correctAnswer: Delta, explanationSteps: [
       '縞間隔 $\\\\Delta x=\\\\lambda L/d$。',
       '単位を m にそろえてから mm へ。',
       '答え ' + Delta + ' mm。',
     ]};`,
    ['暗線間隔も同じ公式。','単位換算が本体。','スクリーン距離 L。'],
    '$\\Delta x=\\dfrac{\\lambda L}{d}$',
    'nm のまま代入する。'
  );
}

function circuitByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('physics','★基礎: オームの法則','電磁気',
      '電圧 {{V}} V、抵抗 {{R}} Ω の電流[A]を求めよ。',
      { V: { min: 6, max: 24, step: 3 }, R: { min: 2, max: 8, step: 1 } },
      `const V=vars.V,R=vars.R; const I=Math.round((V/R)*100)/100;
       return { vars:{V,R}, correctAnswer: I, explanationSteps: ['$V=RI$ より $I=V/R=' + I + '$。'] };`,
      ['$V=RI$。','直列ではない。','単位 A。'],
      '$V=RI$',
      'V R を掛ける。'
    );
  }
  if (tier === 'standard') {
    return sci('physics','★標準: 直並列の合成','電磁気',
      '{{R}} Ω が2本並列、それに {{r}} Ω が直列。合成抵抗[Ω]を小数第1位まで求めよ。',
      { R: { min: 4, max: 10, step: 2 }, r: { min: 2, max: 6, step: 1 } },
      `const R=vars.R,r=vars.r;
       const ans=Math.round((R/2 + r)*10)/10;
       return { vars:{R,r}, correctAnswer: ans, explanationSteps: [
         '並列 $R/2$。直列で足すと ' + ans + '。',
       ]};`,
      ['並列は逆数和。','同じ R なら半分。','直列は和。'],
      '$\\dfrac{1}{R_p}=\\dfrac{1}{R}+\\dfrac{1}{R}$',
      '全部直列に足す。'
    );
  }
  return sci('physics','★難関: 導体棒の終端速度','電磁気',
    '磁束密度 {{B}} T の一様磁場（紙面裏向き）、抵抗 {{R}} Ω、棒の長さ {{ell}} m、質量 {{m}} kg。重力と磁場が直交するレールを、棒が鉛直に落ちて終端速度[m/s]に達する。g=9.8 として小数第2位まで求めよ。',
    { B: { min: 1, max: 2, step: 1 }, R: { min: 2, max: 5, step: 1 }, ell: { min: 1, max: 2, step: 1 }, m: { min: 1, max: 3, step: 1 } },
    `const B=vars.B,R=vars.R,ell=vars.ell,m=vars.m,g=9.8;
     const v=Math.round((m*g*R)/(B*B*ell*ell)*100)/100;
     return { vars:{B,R,ell,m}, correctAnswer: v, explanationSteps: [
       '誘導起電力 $\\\\mathcal{E}=B\\\\ell v$、電流 $I=B\\\\ell v/R$。',
       '磁力 $F=BI\\\\ell=B^2\\\\ell^2 v/R$ が重力 mg と釣り合う。',
       '終端 $v=mgR/(B^2\\\\ell^2)=' + v + '$。',
     ]};`,
    ['レンツで上向き磁力。','終端は合力0。','起電力は Bℓv。'],
    '$v_{\\mathrm{t}}=\\dfrac{mgR}{B^2\\ell^2}$',
    '運動方程式を立てずに V=IR だけ使う。'
  );
}

function atomicByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('physics','★基礎: 半減期','原子',
      '半減期 {{h}} 年の試料が {{h}} 年後に残る質量の割合[%]を求めよ（初期100%）。',
      { h: { min: 2, max: 8, step: 1 } },
      `return { vars:{h:vars.h}, correctAnswer: 50, explanationSteps: ['1半減期で半分。50%。'] };`,
      ['定義どおり半分。','指数は 2^{-t/T}。','今回 t=T。'],
      '$N=N_0\\,2^{-t/T}$',
      '1/e と混同。'
    );
  }
  if (tier === 'standard') {
    return sci('physics','★標準: 光電効果の阻止電圧','原子',
      '光子エネルギー {{E}} eV、仕事関数 {{W}} eV。最大運動エネルギー[eV]を求めよ。',
      { E: { min: 4, max: 8, step: 1 }, W: { min: 2, max: 3, step: 1 } },
      `const E=vars.E,W=Math.min(vars.W, vars.E-1);
       const K=E-W;
       return { vars:{E,W}, correctAnswer: K, explanationSteps: [
         'アインシュタイン $K_{\\\\max}=h\\\\nu-W=' + K + '$ eV。阻止電圧 eV_s=K。',
       ]};`,
      ['光電効果の式。','eV のまま引ける。','閾値以下なら 0。'],
      '$K_{\\max}=h\\nu-W$',
      'W を足す。'
    );
  }
  return sci('physics','★難関: ボーア模型の光子','原子',
    '水素原子で n={{n}} から n=1 へ落ちるとき放出光子エネルギーは 13.6(1-1/n^2) eV。小数第1位まで求めよ。',
    { n: { min: 2, max: 4, step: 1 } },
    `const n=vars.n;
     const E=Math.round(13.6*(1-1/(n*n))*10)/10;
     return { vars:{n}, correctAnswer: E, explanationSteps: [
       '$E_n=-13.6/n^2$ eV。',
       '差 $13.6(1-1/n^2)=' + E + '$。ライマン系列。',
     ]};`,
    ['準位は -13.6/n^2。','放出は差。','n=1 が基底。'],
    '$h\\nu=13.6\\left(1-\\frac{1}{n^2}\\right)\\ \\mathrm{eV}$',
    '13.6/n だけ答える。'
  );
}

function moleByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 物質量','理論化学',
      '質量 {{m}} g、モル質量 {{M}} g/mol の物質量[mol]を小数第2位まで求めよ。',
      { m: { min: 18, max: 72, step: 6 }, M: { min: 18, max: 36, step: 6 } },
      `const m=vars.m,M=vars.M; const n=Math.round((m/M)*100)/100;
       return { vars:{m,M}, correctAnswer: n, explanationSteps: ['$n=m/M=' + n + '$。'] };`,
      ['定義 n=m/M。','単位 g と g/mol。','体積ではない。'],
      '$n=\\dfrac{m}{M}$',
      '掛け算する。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: 状態方程式','理論化学',
      'P={{p}} atm, V={{v}} L, T={{t}} K。n[mol]を小数第2位まで（R=0.082）。',
      { p: { min: 1, max: 3, step: 1 }, v: { min: 4, max: 12, step: 2 }, t: { min: 273, max: 323, step: 10 } },
      `const p=vars.p,v=vars.v,t=vars.t; const n=Math.round((p*v/(0.082*t))*100)/100;
       return { vars:{p,v,t}, correctAnswer: n, explanationSteps: ['$n=PV/RT=' + n + '$。'] };`,
      ['PV=nRT。','T はケルビン。','R=0.082。'],
      '$PV=nRT$',
      '℃のまま入れる。'
    );
  }
  return sci('chemistry','★難関: 蒸気圧と混合気体','理論化学',
    '水上置換で O2 を {{v}} L（27℃, 全圧 1.00 atm、水蒸気圧 0.035 atm）捕集した。乾燥 O2 の物質量[mol]を小数第3位まで（R=0.082）。',
    { v: { min: 2, max: 8, step: 1 } },
    `const v=vars.v, T=300, p=1-0.035;
     const n=Math.round((p*v/(0.082*T))*1000)/1000;
     return { vars:{v}, correctAnswer: n, explanationSteps: [
       '分圧 $P_{O_2}=P_{\\\\mathrm{tot}}-P_{\\\\mathrm{H_2O}}=0.965$ atm。',
       '27℃=300 K。$n=PV/RT=' + n + '$。',
     ]};`,
    ['水上置換は水蒸気を引く。','温度を K に。','乾燥気体の分圧。'],
    '$P_{\\mathrm{gas}}=P_{\\mathrm{total}}-P_{\\mathrm{H_2O}}$',
    '全圧のまま n を出す。'
  );
}

function acidBaseByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 中和の物質量','酸と塩基',
      '{{a}}/10 mol/L の HCl {{v}} mL を中和する 0.10 mol/L NaOH の体積[mL]を求めよ。',
      { a: { min: 1, max: 3, step: 1 }, v: { min: 10, max: 25, step: 5 } },
      `const a=vars.a/10, v=vars.v;
       const n=a*v/1000;
       const ans=Math.round(n/0.10*1000);
       return { vars:{a:vars.a,v}, correctAnswer: ans, explanationSteps: [
         'HCl は a を 10 で割った mol/L。n=CV。',
         'NaOH も 1:1。体積 ' + ans + ' mL。',
       ]};`,
      ['n=CV（Vは L）。','1価どうし。','mL に戻す。'],
      '$n=CV$',
      '濃度を足す。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: 滴定の終点','酸と塩基',
      '0.10 mol/L 酢酸 {{v}} mL を 0.10 mol/L NaOH で滴定。半中和点の体積[mL]を求めよ。',
      { v: { min: 20, max: 40, step: 5 } },
      `const v=vars.v; return { vars:{v}, correctAnswer: v/2, explanationSteps: [
         '半中和は当量の半分。同濃度なら ' + (v/2) + ' mL。緩衝域。',
       ]};`,
      ['半中和点は緩衝液。','同濃度なら半分。','pH=pKa。'],
      '$\\mathrm{pH}=\\mathrm{p}K_a$ （半中和）',
      '当量点と混同。'
    );
  }
  return sci('chemistry','★難関: 緩衝液の pH','酸と塩基',
    '酢酸 (Ka=1.8e-5, pKa=4.74) 0.20 mol/L と酢酸ナトリウム {{s}}/10 mol/L を等体積混合。pH を小数第2位まで（Henderson–Hasselbalch）。',
    { s: { min: 1, max: 4, step: 1 } },
    `const s=vars.s/10;
     const pH=Math.round((4.74+Math.log10(s/0.20))*100)/100;
     return { vars:{s:vars.s}, correctAnswer: pH, explanationSteps: [
       '等体積混合でも濃度比 [A^-]/[HA] は仕込み比 (' + s + ')/0.20 のまま。',
       '$\\\\mathrm{pH}=\\\\mathrm{p}K_a+\\\\log_{10}([A^-]/[HA])=4.74+\\\\log_{10}(' + (s/0.20) + ')$。',
       'pH=' + pH + '。',
     ]};`,
    ['HH 式。','等体積は両方 1/2。','log10 の真数は比。'],
    '$\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\dfrac{[\\mathrm{A}^-]}{[\\mathrm{HA}]}$',
    '濃度を足して平均 pH にする。'
  );
}

function redoxByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 酸化数','酸化還元',
      'H2SO4 中の S の酸化数を求めよ。',
      { dummy: { min: 1, max: 1, step: 1 } },
      `return { vars:{}, correctAnswer: 6, explanationSteps: ['H=+1, O=-2。4つのOと2つのHより S=+6。'] };`,
      ['O は通常 -2。','中性分子は和0。','過酸化水素は例外。'],
      '酸化数の和 = 電荷',
      'S を -2 にする。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: 電子の物質量','酸化還元',
      'MnO4- が酸性で Mn2+ になるとき受け取る電子は 5e-。KMnO4 {{n}}/10 mol が受け取る電子[mol]を小数第1位まで求めよ。',
      { n: { min: 1, max: 5, step: 1 } },
      `const n=vars.n/10; const e=Math.round(5*n*10)/10;
       return { vars:{n:vars.n}, correctAnswer: e, explanationSteps: ['1 mol あたり 5 mol e-。今回 ' + e + ' mol。'] };`,
      ['酸性過マンガン酸は5電子。','塩基性は3電子。','滴定係数。'],
      '$\\mathrm{MnO_4^-}+8\\mathrm{H^+}+5e^-\\to\\mathrm{Mn^{2+}}+4\\mathrm{H_2O}$',
      '7電子と覚える。'
    );
  }
  return sci('chemistry','★難関: 過マンガン酸滴定','酸化還元',
    '0.020 mol/L KMnO4 {{v}} mL が酸性下でシュウ酸を完全酸化した。シュウ酸 (2e- 供与) の物質量[mmol]を小数第2位まで求めよ。',
    { v: { min: 10, max: 25, step: 1 } },
    `const v=vars.v;
     const nMn=0.020*v/1000;
     const nOx=nMn*5/2;
     const mmol=Math.round(nOx*1e5)/100;
     return { vars:{v}, correctAnswer: mmol, explanationSteps: [
       '電子保存: 5 n(MnO4-)=2 n(H2C2O4)。',
       'n(シュウ酸)= (5/2) n(KMnO4)。',
       'mmol で ' + mmol + '。',
     ]};`,
    ['半反応の電子数を揃える。','モル比 2:5。','mL を L に。'],
    '$2\\mathrm{MnO_4^-}+5\\mathrm{H_2C_2O_4}+6\\mathrm{H^+}\\to\\cdots$',
    '1:1 で計算する。'
  );
}

function equilibriumByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 平衡定数の形','化学平衡',
      '$aA+bB\\rightleftharpoons cC$ で K の分子の C の指数は。係数 c={{c}} のとき指数を答えよ。',
      { c: { min: 1, max: 3, step: 1 } },
      `return { vars:{c:vars.c}, correctAnswer: vars.c, explanationSteps: ['質量作用: 生成物の濃度の係数乗。'] };`,
      ['生成物が分子。','係数が指数。','固体は1。'],
      '$K=\\dfrac{[C]^c}{[A]^a[B]^b}$',
      '係数を掛け算する。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: Kp と Kc','化学平衡',
      '気体反応で Δn={{dn}}、T=300 K、R=0.082。Kc=1.00 のとき Kp を小数第1位まで（Kp=Kc(RT)^{Δn}）。',
      { dn: { min: 1, max: 2, step: 1 } },
      `const dn=vars.dn; const Kp=Math.round(Math.pow(0.082*300, dn)*10)/10;
       return { vars:{dn}, correctAnswer: Kp, explanationSteps: ['$K_p=K_c(RT)^{\\\\Delta n}$。RT=24.6。' + dn + ' 乗で ' + Kp + '。'] };`,
      ['Δn は気体係数差。','温度は K。','固体は数えない。'],
      '$K_p=K_c(RT)^{\\Delta n}$',
      '割ってしまう。'
    );
  }
  return sci('chemistry','★難関: 溶解度積と沈殿判定','化学平衡',
    'AgCl の Ksp=1.8e-10。Ag+ が {{a}}e-5 mol/L, Cl- が {{c}}e-5 mol/L のとき、沈殿するなら 1、しないなら 0。',
    { a: { min: 1, max: 9, step: 1 }, c: { min: 1, max: 9, step: 1 } },
    `const Q=(vars.a*1e-5)*(vars.c*1e-5);
     const answer = Q > 1.8e-10 ? 1 : 0;
     return { vars:{a:vars.a,c:vars.c}, correctAnswer: answer, explanationSteps: [
       'イオン積 $Q=[\\\\mathrm{Ag}^+][\\\\mathrm{Cl}^-]=' + Q + '$。',
       'Q>Ksp なら沈殿。判定 ' + answer + '。',
     ]};`,
    ['まず Q を計算。','Ksp と比較。','等号は飽和で沈殿なしとすることが多い。'],
    '$Q>K_{\\mathrm{sp}}$ なら沈殿',
    '各濃度を Ksp と直接比べる。'
  );
}

function inorganicByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 陽イオンの炎色','無機化学',
      'Na の炎色は黄色。次のうち炎色が黄色の金属の酸化数を Na 化合物で答えよ（NaCl の Na）。',
      { dummy: { min: 1, max: 1, step: 1 } },
      `return { vars:{}, correctAnswer: 1, explanationSteps: ['Na は常に +1。炎色は定性。'] };`,
      ['アルカリ金属は +1。','炎色は波長。','酸化数は電荷。'],
      '$\\mathrm{Na}^+$',
      'Na を +2 にする。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: アンモニア沈殿','無機化学',
      '過剰 NH3 で水酸化物沈殿が再溶解する代表イオンは [Cu(NH3)4]2+。配位数を答えよ。',
      { dummy: { min: 1, max: 1, step: 1 } },
      `return { vars:{}, correctAnswer: 4, explanationSteps: ['テトラアンミン銅(II) の配位数 4。'] };`,
      ['過剰アンモニア。','Cu2+ は深青。','配位数は 4。'],
      '$[\\mathrm{Cu}(\\mathrm{NH_3})_4]^{2+}$',
      '6 配位と混同。'
    );
  }
  return sci('chemistry','★難関: 系統分離で沈殿するイオン数','無機化学',
    'Ag+, Pb2+, Cu2+, Fe3+, Na+ の混合水溶液に希 HCl を加える。塩化物沈殿する金属イオンの種類数を求めよ。',
    { dummy: { min: 1, max: 1, step: 1 } },
    `return { vars:{}, correctAnswer: 2, explanationSteps: [
       '第1属: AgCl, PbCl2 が沈殿。Cu, Fe, Na は残る。',
       '種類数は 2。PbCl2 は熱水に溶けやすい点も二次で問われる。',
     ]};`,
    ['HCl で沈むのは Ag, Pb, Hg2。','Cu は硫化物属。','Na はどの属でも沈殿しない。'],
    '$\\mathrm{Ag^+,\\ Pb^{2+},\\ Hg_2^{2+}}$ が塩化物沈殿',
    'Fe(OH)3 をここで数える。'
  );
}

function organicByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 不飽和度','有機化学',
      '分子式 C{{n}}H{{h}} の不飽和度（IHD）を求めよ。',
      { n: { min: 3, max: 6, step: 1 }, h: { min: 4, max: 10, step: 2 } },
      `const n=vars.n, h=vars.h;
       const ihd=Math.max(0, (2*n+2-h)/2);
       return { vars:{n,h}, correctAnswer: ihd, explanationSteps: [
         '$\\\\mathrm{IHD}=(2n+2-H)/2=' + ihd + '$。二重結合または環が1つで IHD=1。',
       ]};`,
      ['CnH2n+2 が飽和。','不足水素/2。','O は無視、N は +1H。'],
      '$\\mathrm{IHD}=\\dfrac{2n+2-H}{2}$',
      '炭素数をそのまま答える。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: アルコールの酸化','有機化学',
      '2-プロパノールは酸化でケトンになる。ケトンのカルボニル炭素の酸化数変化は（2級炭素が -1 から +2 になるとき差）。差を求めよ。',
      { dummy: { min: 1, max: 1, step: 1 } },
      `return { vars:{}, correctAnswer: 3, explanationSteps: ['2級アルコール炭素は酸化で酸化数が 3 増える（典型）。アセトンの C=O 炭素は +2。'] };`,
      ['2級はケトン。','1級はアルデヒド→酸。','3級は酸化されにくい。'],
      '$\\mathrm{R_2CHOH}\\to\\mathrm{R_2C=O}$',
      '3級が酸化されると覚える。'
    );
  }
  return sci('chemistry','★難関: オゾン分解のカルボニル数','有機化学',
    '分子 C{{n}}H{{n}}（IHD={{ihd}} 相当のアルケン）がすべて内部二重結合の鎖状ジエンだとする。完全オゾン分解（還元的）で生じるカルボニル化合物の分子数は二重結合数に等しい。二重結合数を IHD が {{n}}-2 のとき求めよ。',
    { n: { min: 6, max: 8, step: 1 } },
    `const n=vars.n;
     const ihd=n-2;
     return { vars:{n,ihd}, correctAnswer: ihd, explanationSteps: [
       '鎖状ジエンなら IHD=2 が典型だが、設問の IHD=n-2=' + ihd + ' を二重結合数とみなす（環なし）。',
       '還元的オゾン分解では C=C 1つにつきカルボニル2断片、分子数は結合数に依存。ここでは結合数 ' + ihd + ' を答える。',
     ]};`,
    ['IHD から π 結合数。','オゾンは二重結合を切る。','還元的ならアルデヒド/ケトン。'],
    'オゾン分解: 各 $C=C$ が2つのカルボニルへ',
    '芳香環も切れると誤る。'
  );
}

function polymerByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return sci('chemistry','★基礎: 付加重合の炭素','高分子',
      'エチレン {{n}} 分子が付加重合したときの炭素原子数を求めよ。',
      { n: { min: 3, max: 8, step: 1 } },
      `const n=vars.n; return { vars:{n}, correctAnswer: 2*n, explanationSteps: ['モノマー C2H4。炭素 2n。水は出ない。'] };`,
      ['付加重合は原子の増減なし。','エチレンは C2。','縮合と区別。'],
      '$-(\\mathrm{CH_2CH_2})_n-$',
      '水分子を引く。'
    );
  }
  if (tier === 'standard') {
    return sci('chemistry','★標準: 縮合で出る水','高分子',
      'アミノ酸 {{n}} 個が直鎖ペプチドになったとき生じる水分子数を求めよ。',
      { n: { min: 3, max: 8, step: 1 } },
      `const n=vars.n; return { vars:{n}, correctAnswer: n-1, explanationSteps: ['ペプチド結合 n-1 本。各1分子の水。'] };`,
      ['直鎖は結合が残基-1。','環状なら n 本。','エステルも同様。'],
      '直鎖ポリマーの縮合水 $=n-1$',
      'n 分子の水と答える。'
    );
  }
  return sci('chemistry','★難関: ペプチド部分配列','高分子',
    'テトラペプチドを部分加水分解し、断片が A-B, B-C, C-D のみ得られた。可能な配列は1通り。アミノ酸残基数を答えよ。',
    { dummy: { min: 1, max: 1, step: 1 } },
    `return { vars:{}, correctAnswer: 4, explanationSteps: [
       'オーバーラップ A-B, B-C, C-D より A-B-C-D。残基 4。',
       'N 末端決定（Sanger）と組み合わせるのが二次の定石。',
     ]};`,
    ['断片を重ねる。','テトラは4残基。','ジスルフィドは別問。'],
    '部分加水分解のオーバーラップで配列決定',
    '断片数を残基数と答える。'
  );
}

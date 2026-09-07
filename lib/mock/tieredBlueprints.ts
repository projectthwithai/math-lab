// ==========================================
// Apex Suite: Math Lab - Difficulty-Tiered Blueprints
// ==========================================
// 主要単元について、難易度★1-10を3段階に分岐した本格問題テンプレート。
// - basic (★1-3): 公式へ数値を直接代入する基礎計算
// - standard (★4-7): 文字定数や場合分けを含む標準入試
// - hard (★8-10): 難関大二次・融合問題。解説は論理展開を詳細に出す

import type { PatternKey, TemplateBlueprint } from '@/lib/mock/blueprintTypes';
import { difficultySpan, type DifficultyTier } from '@/lib/mock/blueprintTypes';

export function buildTieredBlueprint(
  patternKey: PatternKey,
  tier: DifficultyTier,
  difficulty: number,
  unitTitle: string
): TemplateBlueprint | null {
  switch (patternKey) {
    case 'quadratic':
      return quadraticByTier(tier, difficulty);
    case 'trigonometry':
      return trigRatioByTier(tier);
    case 'trig_composition':
      return trigCompositionByTier(tier, difficulty);
    case 'logarithm':
      return logarithmByTier(tier, difficulty);
    case 'differentiation':
      return differentiationByTier(tier, difficulty);
    case 'integration':
      return integrationByTier(tier, difficulty);
    case 'limits':
      return limitsByTier(tier, difficulty);
    case 'sequence':
      return sequenceByTier(tier, difficulty);
    case 'vector':
      return vectorByTier(tier, difficulty);
    case 'plane_geometry':
      return planeGeometryByTier(tier, difficulty);
    case 'coordinate_geometry':
      return coordinateGeometryByTier(tier, difficulty);
    case 'mechanics':
      return mechanicsByTier(tier, difficulty);
    case 'gas_law':
    case 'gas_law_physics':
      return gasLawByTier(tier, difficulty, unitTitle, patternKey === 'gas_law_physics' ? 'physics' : 'chemistry');
    default:
      return null;
  }
}

function quadraticByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const pRange = difficultySpan(difficulty, 1, 4);
    return {
      title: '★基礎: 平方完成して頂点のy座標を求める',
      unit: '2次関数',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 1, max: 3, step: 1 },
        p: { min: Math.max(1, pRange.min), max: Math.max(2, pRange.max), step: 1 },
        q: { min: -4, max: 8, step: 1 },
      },
      templateText: '2次関数 $y = {{a}}(x - {{p}})^2 + {{q}}$ の最大値または最小値を求めよ。',
      calcLogicJS: `
        const a = vars.a, p = vars.p, q = vars.q;
        const answer = q;
        return {
          vars: { a, p, q },
          correctAnswer: answer,
          explanationSteps: [
            '与えられた式はすでに平方完成されている。頂点は (' + p + ', ' + q + ')。',
            'x^2 の係数 a=' + a + ' は正なので、グラフは下に凸である。',
            'したがって最小値は頂点の y 座標 ' + q + ' である（最大値は存在しない）。',
          ],
        };
      `,
      hints: [
        '標準形 y=a(x-p)^2+q の q が頂点の y 座標。',
        'a>0 なら下に凸で最小値、a<0 なら上に凸で最大値。',
        '今回は a が正なので、答えは q そのもの。',
      ],
      keyFormula: 'y = a(x-p)^2 + q （頂点 (p, q)）',
      commonMistakes: 'a の符号を見ずに最大値と最小値を取り違える。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 軸が動く2次関数の最小値',
      unit: '2次関数',
      subject: 'math',
      format: 'input',
      variables: {
        t: { min: 1, max: 5, step: 1 },
        k: { min: 2, max: 4, step: 1 },
      },
      templateText:
        '関数 $f(x) = (x - {{t}})^2 + {{k}}$ について、$0 \\le x \\le 4$ における最小値を求めよ。',
      calcLogicJS: `
        const t = vars.t, k = vars.k;
        let xmin;
        if (t < 0) xmin = 0;
        else if (t > 4) xmin = 4;
        else xmin = t;
        const minValue = (xmin - t) * (xmin - t) + k;
        const caseLabel = t < 0 ? '軸が定義域の左外' : t > 4 ? '軸が定義域の右外' : '軸が定義域の内部';
        return {
          vars: { t, k },
          correctAnswer: minValue,
          explanationSteps: [
            '平方完成済みなので軸は x=' + t + '、定義域は 0≦x≦4。',
            '場合分け: ' + caseLabel + '。下に凸なので最小は軸に最も近い定義域内の点で取る。',
            '最小を与える x は ' + xmin + '。よって最小値は (' + xmin + '-' + t + ')^2 + ' + k + ' = ' + minValue + '。',
          ],
        };
      `,
      hints: [
        '軸 x=t と定義域 [0,4] の位置関係で場合分けする。',
        '下に凸なら、最小は「軸が中にあれば頂点、外なら近い端点」。',
        '端点の値を代入して確認すると安全。',
      ],
      keyFormula: '軸と定義域の位置関係で場合分け',
      commonMistakes: '軸が定義域の外にあるのに頂点の値を最小としてしまう。',
    };
  }

  return {
    title: '★難関: 軸が動く2次関数の最小値の不等式',
    unit: '2次関数',
    subject: 'math',
    format: 'input',
    variables: {
      k: { min: 1, max: 4, step: 1 },
    },
    templateText:
      '実数 a に対し、関数 $f(x)=(x-a)^2$ の $0 \\le x \\le 2$ における最小値を $m(a)$ とする。不等式 $m(a) \\le {{k}}$ を満たす a の範囲の長さを求めよ（小数第2位まで）。',
    calcLogicJS: `
      const k = vars.k;
      const length = Math.round((2 + 2 * Math.sqrt(k)) * 100) / 100;
      return {
        vars: { k },
        correctAnswer: length,
        explanationSteps: [
          '下に凸なので最小は軸 x=a と定義域 [0,2] の位置で3通り。',
          'a<0 のとき m(a)=a^2。a^2≦' + k + ' かつ a<0 より -√' + k + '≦a<0。長さ √' + k + '。',
          '0≦a≦2 のとき m(a)=0≦' + k + ' は常に成立。長さ 2。',
          'a>2 のとき m(a)=(2-a)^2。2<a≦2+√' + k + '。長さ √' + k + '。',
          '3つの場合の長さを足すと 2+2√' + k + ' ≈ ' + length + '。',
          '境界 a=0,2 は両側の式が一致するので、長さに二重加算しない。',
        ],
      };
    `,
    hints: [
      '軸が定義域の左外・内部・右外の3通りで m(a) を書き換える。',
      '内部では m=0 なので、k>0 なら区間 [0,2] はすべて適する。',
      '左右の外側は平方根で切り、3区間の長さを足す。',
    ],
    keyFormula: 'm(a)= a^2 (a<0), 0 (0≦a≦2), (2-a)^2 (a>2)',
    commonMistakes: '3通りの場合分けをせず頂点だけ見る。境界を二重に数えて長さを伸ばす。',
  };
}

function trigRatioByTier(tier: DifficultyTier): TemplateBlueprint {
  if (tier === 'basic') {
    return {
      title: '★基礎: 三角比の相互関係',
      unit: '図形と計量（三角比）',
      subject: 'math',
      format: 'input',
      variables: {
        s: { min: 3, max: 5, step: 1 },
      },
      templateText: '$\\sin\\theta = {{sDisplay}}$，$0^\\circ < \\theta < 90^\\circ$ のとき $\\cos\\theta$ の値を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const s = vars.s / 10;
        const sDisplay = (vars.s / 10).toFixed(1);
        const c = Math.round(Math.sqrt(1 - s * s) * 100) / 100;
        return {
          vars: { sDisplay },
          correctAnswer: c,
          explanationSteps: [
            '相互関係 sin^2θ + cos^2θ = 1 を使う。',
            'cos^2θ = 1 - (' + sDisplay + ')^2 を計算する。',
            '鋭角なので cosθ>0。よって cosθ ≈ ' + c + '。',
          ],
        };
      `,
      hints: ['sin^2+cos^2=1 に代入する。', '平方根の符号は θ の範囲で決める。', '今回は鋭角なので正。'],
      keyFormula: 'sin^2θ + cos^2θ = 1',
      commonMistakes: '平方根の符号を落とす。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: sinθ+cosθ から積を求める',
      unit: '図形と計量（三角比）',
      subject: 'math',
      format: 'input',
      variables: {
        num: { min: -4, max: 4, step: 1 },
      },
      templateText: '$\\sin\\theta + \\cos\\theta = {{kDisplay}}$ のとき、$\\sin\\theta\\cos\\theta$ の値を求めよ。',
      calcLogicJS: `
        const rawNum = vars.num === 0 ? 1 : vars.num;
        const den = 3;
        function gcd(x, y) {
          let a = Math.abs(x), b = Math.abs(y);
          while (b !== 0) { const t = a % b; a = b; b = t; }
          return a || 1;
        }
        const g = gcd(rawNum, den);
        const num = rawNum / g;
        const denReduced = den / g;
        const kDisplay = denReduced === 1 ? String(num) : (num + '/' + denReduced);
        const result = Math.round(((rawNum*rawNum - den*den) / (2*den*den)) * 10000) / 10000;
        return {
          vars: { kDisplay },
          correctAnswer: result,
          explanationSteps: [
            '両辺を2乗する: (sinθ+cosθ)^2 = (' + kDisplay + ')^2。',
            '左辺 = 1 + 2sinθcosθ。',
            'よって sinθcosθ = ((' + kDisplay + ')^2 - 1)/2 = ' + result + '。',
          ],
        };
      `,
      hints: ['両辺2乗して交差項 2sinθcosθ を出す。', 'sin^2+cos^2=1 を使う。', '定義域 |sin+cos|≦√2 も意識する。'],
      keyFormula: '(sinθ+cosθ)^2 = 1 + 2sinθcosθ',
      commonMistakes: '2乗の交差項を忘れる。',
    };
  }

  return {
    title: '★難関: 余弦定理と三角形の形状判定の融合',
    unit: '図形と計量（三角比）',
    subject: 'math',
    format: 'input',
    variables: {
      b: { min: 5, max: 8, step: 1 },
      c: { min: 5, max: 8, step: 1 },
      extra: { min: 0, max: 2, step: 1 },
    },
    templateText:
      '三角形 ABC で $AB={{c}}$，$AC={{b}}$，$BC={{a}}$ とする。∠A が鋭角なら 1、直角なら 2、鈍角なら 3 を答えよ。',
    calcLogicJS: `
      const b = vars.b, c = vars.c, extra = vars.extra;
      const a = extra === 0 ? Math.abs(b - c) + 1 : extra === 1 ? Math.round(Math.sqrt(b*b + c*c)) : b + c - 1;
      const cosA = (b*b + c*c - a*a) / (2*b*c);
      const kind = cosA > 1e-9 ? 1 : Math.abs(cosA) <= 1e-9 ? 2 : 3;
      return {
        vars: { a, b, c },
        correctAnswer: kind,
        explanationSteps: [
          '3辺が与えられているので余弦定理 cosA=(b^2+c^2-a^2)/(2bc) を使う。',
          '分子の符号だけで鋭・直・鈍が決まる（分母 2bc>0）。',
          'b^2+c^2-a^2 = ' + (b*b + c*c - a*a) + ' なので cosA ' + (kind === 1 ? '>0（鋭角）' : kind === 2 ? '=0（直角）' : '<0（鈍角）') + '。',
          '答えは ' + kind + '。三角形不等式 ' + b + '+' + c + '>' + a + ' も満たすことを確認する。',
          '続く融合では sinA=√(1-cos^2A)>0 を取り、正弦定理で 2R に進む。',
          '面積は (1/2)bc sinA。鈍角でも sin は正なので面積公式の符号を落とさない。',
        ],
      };
    `,
    hints: [
      '余弦定理の分子 b^2+c^2-a^2 の符号を見る。',
      '正なら鋭角、0なら直角、負なら鈍角。',
      '三角形不等式を満たす辺の組になっているかも検算する。',
    ],
    keyFormula: 'cosA の符号 ⇔ ∠A の鋭・直・鈍',
    commonMistakes: '余弦定理の辺の対応を取り違える。鈍角なのに正弦定理で鈍角解を落とす。',
  };
}

function trigCompositionByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const aRange = difficultySpan(difficulty, 1, 3);
    return {
      title: '★基礎: 合成後の振幅',
      unit: '三角関数',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: Math.max(1, aRange.min), max: Math.max(2, aRange.max), step: 1 },
        b: { min: 1, max: 3, step: 1 },
      },
      templateText: '${{a}}\\sin\\theta + {{b}}\\cos\\theta$ の最大値を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a, b = vars.b;
        const maxValue = Math.round(Math.sqrt(a*a+b*b) * 100) / 100;
        return {
          vars: { a, b },
          correctAnswer: maxValue,
          explanationSteps: [
            'asinθ+bcosθ = √(a^2+b^2) sin(θ+α) に合成する。',
            '振幅 √(' + a + '^2+' + b + '^2) が最大値。',
            '最大値 ≈ ' + maxValue + '。',
          ],
        };
      `,
      hints: ['合成の振幅は √(a^2+b^2)。', 'sin の最大は 1。', 'a+b と間違えない。'],
      keyFormula: 'a sinθ + b cosθ = √(a^2+b^2) sin(θ+α)',
      commonMistakes: '振幅を a+b にしてしまう。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 合成して方程式を解く',
      unit: '三角関数',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 3, max: 5, step: 1 },
        b: { min: 4, max: 4, step: 1 },
      },
      templateText:
        '${{a}}\\sin\\theta + {{b}}\\cos\\theta = {{rhs}}$ を満たす $\\theta$ のうち、$0^\\circ \\le \\theta \\le 180^\\circ$ における解の個数を求めよ。',
      calcLogicJS: `
        const a = vars.a, b = 4;
        const r = Math.sqrt(a*a + b*b);
        const rhs = Math.round(r);
        const k = rhs / r;
        const count = Math.abs(k) > 1 + 1e-9 ? 0 : Math.abs(Math.abs(k) - 1) < 1e-9 ? 1 : 2;
        return {
          vars: { a, b, rhs },
          correctAnswer: count,
          explanationSteps: [
            '合成すると √(' + a + '^2+16) sin(θ+α) = ' + rhs + '。',
            'sin(θ+α) = ' + rhs + '/√(' + (a*a+16) + ') ≈ ' + (Math.round(k*1000)/1000) + '。',
            '0°≦θ≦180° での解の個数は ' + count + '（単位円上で水平線との交点を数える）。',
          ],
        };
      `,
      hints: ['先に合成して sin(θ+α)=k の形にする。', '|k|>1 なら解なし。', '範囲が半周なので交点は最大2つ。'],
      keyFormula: '√(a^2+b^2) sin(θ+α) = k',
      commonMistakes: 'θ の範囲を α のずれごと変換し忘れる。',
    };
  }

  return {
    title: '★難関: 合成と2倍角の融合（最大値）',
    unit: '三角関数',
    subject: 'math',
    format: 'input',
    variables: {
      p: { min: 1, max: 3, step: 1 },
    },
    templateText:
      '$f(\\theta) = {{p}}\\sin 2\\theta + {{p}}\\cos 2\\theta + 1$ の最大値を求めよ（小数第2位まで）。',
    calcLogicJS: `
      const p = vars.p;
      const amp = Math.round(Math.sqrt(2) * p * 100) / 100;
      const maxValue = Math.round((amp + 1) * 100) / 100;
      return {
        vars: { p },
        correctAnswer: maxValue,
        explanationSteps: [
          'sin2θ と cos2θ の係数が同じなので、√2 p · sin(2θ+π/4) + 1 と合成できる。',
          '振幅は √(p^2+p^2)=p√2 ≈ ' + amp + '。',
          'sin の最大は 1 なので、最大値は p√2+1 ≈ ' + maxValue + '。',
          '2θ の値域は実数全体を動くので、制限なしの最大最小でよい。',
          '検算: (sin2θ+cos2θ)^2 = 1+sin4θ ≦ 2 より |sin2θ+cos2θ|≦√2 でも同じ結論。',
        ],
      };
    `,
    hints: ['2倍角を1つの角 φ=2θ と見て合成する。', '振幅は p√2。', '定数項 +1 を最後に足す。'],
    keyFormula: 'p(sinφ+cosφ)+1 = p√2 sin(φ+π/4)+1',
    commonMistakes: '2θ の振幅を θ のまま合成してしまう。',
  };
}

function logarithmByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const nRange = difficultySpan(difficulty, 1, 5);
    return {
      title: '★基礎: 対数の定義',
      unit: '指数関数・対数関数',
      subject: 'math',
      format: 'input',
      variables: {
        n: { min: Math.max(1, nRange.min), max: Math.max(3, nRange.max), step: 1 },
      },
      templateText: '$\\log_2 {{x}}$ の値を求めよ。',
      calcLogicJS: `
        const n = vars.n;
        const x = Math.pow(2, n);
        return {
          vars: { n, x },
          correctAnswer: n,
          explanationSteps: [
            'log_2 x = n ⇔ x = 2^n。',
            '2^' + n + ' = ' + x + ' なので答えは ' + n + '。',
          ],
        };
      `,
      hints: ['対数は「底を何乗すると真数になるか」。', '真数を 2 の累乗に直す。', '指数がそのまま答え。'],
      keyFormula: 'log_a x = n ⇔ x = a^n',
      commonMistakes: '底と真数を取り違える。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 底の変換と方程式',
      unit: '指数関数・対数関数',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 2, max: 4, step: 1 },
      },
      templateText: '$\\log_{{a}} x + \\log_{{a}} (x-{{a}}) = 1$ を満たす x を求めよ。',
      calcLogicJS: `
        const a = vars.a;
        const disc = a * a + 4 * a;
        const x = Math.round(((a + Math.sqrt(disc)) / 2) * 100) / 100;
        return {
          vars: { a },
          correctAnswer: x,
          explanationSteps: [
            '真数条件 x>0 かつ x-a>0、すなわち x>a。',
            '和の公式で log_a {x(x-a)} = 1 ⇔ x(x-a)=a。',
            'x^2 - a x - a = 0。正で x>a の解は (a+√(a^2+4a))/2 ≈ ' + x + '。',
          ],
        };
      `,
      hints: ['真数条件を先に書く。', 'log A + log B = log(AB)。', 'log_a M=1 ⇔ M=a。'],
      keyFormula: 'log_a A + log_a B = log_a (AB)',
      commonMistakes: '真数条件を確認せず不適解を残す。',
    };
  }

  return {
    title: '★難関: 置換して2次方程式に帰着',
    unit: '指数関数・対数関数',
    subject: 'math',
    format: 'input',
    variables: {
      k: { min: 2, max: 4, step: 1 },
    },
    templateText:
      '$4^x - {{k}}\\cdot 2^{x+1} + {{constTerm}} = 0$ を満たす実数 x のうち、大きい方を求めよ。',
    calcLogicJS: `
      const k = vars.k;
      const constTerm = k * k;
      const tPlus = k + Math.sqrt(k * k);
      const t = 2 * k;
      const x = Math.round(Math.log2(t) * 100) / 100;
      return {
        vars: { k, constTerm },
        correctAnswer: x,
        explanationSteps: [
          '4^x=(2^x)^2、2^{x+1}=2·2^x と見て t=2^x (t>0) と置換する。',
          't^2 - ' + (2*k) + ' t + ' + constTerm + ' = 0。',
          '解 t=' + k + '（重解、または大きい方 t=' + t + '）。t=2^x>0 は満たす。',
          'x = log_2 t ≈ ' + x + '。',
          '指数方程式は置換後に t>0 を忘れず、対数で戻す。',
        ],
      };
    `,
    hints: ['4^x を (2^x)^2 に直す。', 't=2^x>0 で2次方程式にする。', '最後に log で x に戻す。'],
    keyFormula: '4^x = (2^x)^2， t=2^x > 0',
    commonMistakes: '置換後の t>0 を忘れる。2^{x+1} を 2^x+1 と誤る。',
  };
}

function differentiationByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    return {
      title: '★基礎: 多項式の微分の代入',
      unit: '微分法（数II）',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 1, max: Math.max(3, Math.round(difficulty)), step: 1 },
        t: { min: 1, max: 3, step: 1 },
      },
      templateText: "$f(x)=x^3-{{a}}x$ について $f'({{t}})$ を求めよ。",
      calcLogicJS: `
        const a = vars.a, t = vars.t;
        const ans = 3 * t * t - a;
        return {
          vars: { a, t },
          correctAnswer: ans,
          explanationSteps: [
            "f'(x)=3x^2-" + a + "。",
            "x=" + t + " を代入して " + ans + "。",
          ],
        };
      `,
      hints: ['x^n の微分は n x^{n-1}。', '求めた導関数に数値を代入。', '定数項の微分は 0。'],
      keyFormula: "(x^n)' = n x^{n-1}",
      commonMistakes: '代入と微分の順番を逆にする。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 接線の傾きと切片',
      unit: '微分法（数II）',
      subject: 'math',
      format: 'input',
      variables: {
        t: { min: 1, max: 3, step: 1 },
      },
      templateText: "$f(x)=x^3-3x$ の $x={{t}}$ における接線が y 軸と交わる点の y 座標を求めよ。",
      calcLogicJS: `
        const t = vars.t;
        const ft = t*t*t - 3*t;
        const fp = 3*t*t - 3;
        const intercept = ft - fp * t;
        return {
          vars: { t },
          correctAnswer: intercept,
          explanationSteps: [
            "f'(x)=3x^2-3 より傾き f'(" + t + ")=" + fp + "。",
            '接点は (' + t + ', ' + ft + ')。',
            '接線 y-' + ft + '=' + fp + '(x-' + t + ')。x=0 を代入して y=' + intercept + '。',
          ],
        };
      `,
      hints: ['まず f\'(t) と f(t) を求める。', '接線の公式 y-f(t)=f\'(t)(x-t)。', 'y 切片は x=0 を代入。'],
      keyFormula: "y - f(t) = f'(t)(x - t)",
      commonMistakes: '傾きに f(t) を使ってしまう。',
    };
  }

  return {
    title: '★難関: 3次関数と水平線の共有点（3場合分け）',
    unit: '微分法（数II）',
    subject: 'math',
    format: 'input',
    variables: {
      k: { min: -3, max: 3, step: 1 },
    },
    templateText:
      '方程式 $x^3-3x = {{k}}$ の異なる実数解の個数を求めよ。',
    calcLogicJS: `
      const k = vars.k;
      let count;
      if (k > 2 || k < -2) count = 1;
      else if (k === 2 || k === -2) count = 2;
      else count = 3;
      return {
        vars: { k },
        correctAnswer: count,
        explanationSteps: [
          "f(x)=x^3-3x とすると f'(x)=3(x-1)(x+1)。臨界点は x=±1。",
          '増減表: x=-1 で極大値 2、x=1 で極小値 -2。',
          'y=k との共有点数は3つの場合に分かれる。',
          'k>2 または k<-2 なら 1個、k=±2 なら重解を含めて 2個、|k|<2 なら 3個。',
          '今回 k=' + k + ' なので個数は ' + count + '。',
          '「異なる実数解」とあるので k=±2 は接点を1つと横断を1つで 2 と数える。',
        ],
      };
    `,
    hints: [
      'まず導関数から極値を出してグラフ概形を描く。',
      '直線 y=k を上下に動かして交点の個数を3通りに分ける。',
      'k=±2 は重解（接点）なので「異なる」個数は 2。',
    ],
    keyFormula: '極値 ±2 と k の大小で実数解の個数が3通りに変わる',
    commonMistakes: '極値 ±2 を境に場合分けし忘れる。重解を3個と数える。',
  };
}

function integrationByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    return {
      title: '★基礎: 定積分の直接計算',
      unit: '積分法（数II）',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 2, max: 5, step: 1 },
      },
      templateText: '$\\displaystyle\\int_0^{{a}} (2x+1)\\,dx$ の値を求めよ。',
      calcLogicJS: `
        const a = vars.a;
        const ans = a * a + a;
        return {
          vars: { a },
          correctAnswer: ans,
          explanationSteps: [
            '原始関数は x^2+x。',
            '[x^2+x]_0^' + a + ' = (' + a + '^2+' + a + ')-0 = ' + ans + '。',
          ],
        };
      `,
      hints: ['∫x^n = x^{n+1}/(n+1)。', 'F(上端)-F(下端)。', '下端 0 なので F(a) だけ。'],
      keyFormula: '∫[a,b] f = F(b)-F(a)',
      commonMistakes: '上端・下端の引き算を逆にする。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 放物線と x 軸の面積（1/6公式）',
      unit: '積分法（数II）',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: Math.max(2, difficultySpan(difficulty, 2, 6).min), max: Math.max(4, difficultySpan(difficulty, 2, 6).max), step: 1 },
      },
      templateText: '曲線 $y={{a}}x-x^2$ と x 軸で囲まれた面積を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a;
        const area = Math.round((Math.pow(a, 3) / 6) * 100) / 100;
        return {
          vars: { a },
          correctAnswer: area,
          explanationSteps: [
            '交点は x=0, ' + a + '。',
            'S=∫[0,a](ax-x^2)dx = a^3/6 ≈ ' + area + '。',
            '1/6公式 S=|係数|/6·(交点差)^3 でも検算できる。',
          ],
        };
      `,
      hints: ['まず x 軸との交点を求める。', '上側が正ならそのまま積分。', '1/6公式が使える形。'],
      keyFormula: 'S = |a|/6 · (β-α)^3',
      commonMistakes: '積分区間を間違える。',
    };
  }

  return {
    title: '★難関: 2曲線に囲まれた面積',
    unit: '積分法（数II）',
    subject: 'math',
    format: 'input',
    variables: {
      m: { min: 1, max: 3, step: 1 },
    },
    templateText:
      '曲線 $y=x^2$ と直線 $y={{m}}x+{{b}}$ で囲まれた面積を求めよ（小数第2位まで）。ただし交点の差は整数になるように係数を選んである。',
    calcLogicJS: `
      const m = vars.m;
      const b = 0;
      const disc = m * m;
      const x1 = 0;
      const x2 = m;
      const area = Math.round(Math.abs((m * m * m) / 6) * 100) / 100;
      return {
        vars: { m, b },
        correctAnswer: area,
        explanationSteps: [
          '交点: x^2 = ' + m + 'x より x(x-' + m + ')=0。交点 x=0, ' + m + '。',
          '区間内では直線が上: S=∫[0,' + m + ']((' + m + 'x)-x^2)dx。',
          '1/6公式より S=' + m + '^3/6 ≈ ' + area + '。',
          '一般に放物線と直線の面積は「交点の差の3乗 / 6」に帰着する。',
          '上下が途中で入れ替わる場合は交点で区間を分割する。',
        ],
      };
    `,
    hints: ['交点を求めて積分区間にする。', '上の関数 − 下の関数。', '放物線と直線なら 1/6 公式。'],
    keyFormula: 'S = ∫(上-下) dx = |α-β|^3 / 6',
    commonMistakes: '上下を逆にして負の面積のまま答える。',
  };
}

function limitsByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const aRange = difficultySpan(difficulty, 2, 5);
    return {
      title: '★基礎: 約分してから極限',
      unit: '極限',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: Math.max(2, aRange.min), max: Math.max(3, aRange.max), step: 1 },
      },
      templateText: '$\\displaystyle\\lim_{x \\to {{a}}} \\dfrac{x^2-{{a2}}}{x-{{a}}}$ を求めよ。',
      calcLogicJS: `
        const a = vars.a;
        return {
          vars: { a, a2: a * a },
          correctAnswer: 2 * a,
          explanationSteps: [
            '分子は (x-a)(x+a)。',
            '約分して x+a。x→' + a + ' で ' + (2*a) + '。',
          ],
        };
      `,
      hints: ['0/0 型は因数分解。', 'x^2-a^2=(x-a)(x+a)。', '約分してから代入。'],
      keyFormula: 'x^2-a^2=(x-a)(x+a)',
      commonMistakes: '約分せず 0/0 のまま諦める。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 無理式の有理化',
      unit: '極限',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 2, max: 5, step: 1 },
      },
      templateText: '$\\displaystyle\\lim_{x \\to {{a}}} \\dfrac{x-{{a}}}{\\sqrt{x}-\\sqrt{{{a}}}}$ を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a;
        const ans = Math.round(2 * Math.sqrt(a) * 100) / 100;
        return {
          vars: { a },
          correctAnswer: ans,
          explanationSteps: [
            '分母を有理化する。共役 √x+√a を掛ける。',
            '(x-a)=(√x-√a)(√x+√a) なので約分して √x+√a。',
            'x→' + a + ' で 2√' + a + ' ≈ ' + ans + '。',
          ],
        };
      `,
      hints: ['無理式は共役を掛ける。', '分子が差の形なら公式が使える。', '約分後に代入。'],
      keyFormula: 'x-a = (√x-√a)(√x+√a)',
      commonMistakes: '共役を分子に掛け忘れる。',
    };
  }

  return {
    title: '★難関: 三角関数の基本極限との融合',
    unit: '極限',
    subject: 'math',
    format: 'input',
    variables: {
      k: { min: 2, max: 5, step: 1 },
    },
    templateText:
      '$\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin {{k}}x}{x}$ の値を求めよ。',
    calcLogicJS: `
      const k = vars.k;
      return {
        vars: { k },
        correctAnswer: k,
        explanationSteps: [
          '基本公式 lim(θ→0) sinθ/θ = 1 に形を合わせる。',
          'sin(kx)/x = k · sin(kx)/(kx)。',
          'x→0 なら kx→0 なので k·1 = ' + k + '。',
          '融合問題では分母に 1-cos や tan が混ざる。1-cosθ=2sin^2(θ/2) で同じ型に帰着させる。',
          '無限大の比較では次数（または三角関数の係数）が勝敗を決める。',
        ],
      };
    `,
    hints: ['sinθ/θ→1 の θ を kx にする。', '係数 k をくくり出す。', 'kx→0 を確認する。'],
    keyFormula: 'lim_{θ→0} sinθ/θ = 1',
    commonMistakes: '係数 k を出し忘れる。',
  };
}

function sequenceByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const a1Range = difficultySpan(difficulty, 1, 8);
    return {
      title: '★基礎: 等差数列の一般項',
      unit: '数列',
      subject: 'math',
      format: 'input',
      variables: {
        a1: { min: Math.max(1, a1Range.min), max: Math.max(3, a1Range.max), step: 1 },
        d: { min: 2, max: 5, step: 1 },
        n: { min: 5, max: 10, step: 1 },
      },
      templateText: '初項 {{a1}}、公差 {{d}} の等差数列の第 {{n}} 項を求めよ。',
      calcLogicJS: `
        const a1 = vars.a1, d = vars.d, n = vars.n;
        const an = a1 + (n - 1) * d;
        return {
          vars: { a1, d, n },
          correctAnswer: an,
          explanationSteps: [
            'a_n = a1+(n-1)d。',
            'a_n = ' + a1 + '+(' + n + '-1)×' + d + ' = ' + an + '。',
          ],
        };
      `,
      hints: ['一般項は a1+(n-1)d。', '(n-1) を n と間違えない。', '代入するだけ。'],
      keyFormula: 'a_n = a_1 + (n-1)d',
      commonMistakes: '(n-1) を n にする。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 等差数列の和',
      unit: '数列',
      subject: 'math',
      format: 'input',
      variables: {
        a1: { min: 2, max: 6, step: 1 },
        d: { min: 2, max: 4, step: 1 },
        n: { min: 8, max: 15, step: 1 },
      },
      templateText: '初項 {{a1}}、公差 {{d}} の等差数列の初項から第 {{n}} 項までの和 $S_{{n}}$ を求めよ。',
      calcLogicJS: `
        const a1 = vars.a1, d = vars.d, n = vars.n;
        const an = a1 + (n - 1) * d;
        const sn = n * (a1 + an) / 2;
        return {
          vars: { a1, d, n },
          correctAnswer: sn,
          explanationSteps: [
            'まず a_n = ' + a1 + '+(' + n + '-1)×' + d + ' = ' + an + '。',
            'S_n = n(a1+a_n)/2 = ' + n + '×(' + a1 + '+' + an + ')/2 = ' + sn + '。',
          ],
        };
      `,
      hints: ['先に第 n 項を出す。', '和は n(初項+末項)/2。', '公式 S=n{2a+(n-1)d}/2 でもよい。'],
      keyFormula: 'S_n = n(a_1 + a_n)/2',
      commonMistakes: '項数 n と末項を混同する。',
    };
  }

  return {
    title: '★難関: 線形漸化式から一般項',
    unit: '数列',
    subject: 'math',
    format: 'input',
    variables: {
      a1: { min: 1, max: 4, step: 1 },
      p: { min: 2, max: 3, step: 1 },
      q: { min: 2, max: 6, step: 2 },
      n: { min: 4, max: 6, step: 1 },
    },
    templateText:
      '$a_1={{a1}}$，$a_{n+1}={{p}}a_n+{{q}}$ で定まる数列の第 {{n}} 項 $a_{{n}}$ を求めよ。',
    calcLogicJS: `
      const a1 = vars.a1, p = vars.p, q = vars.q, n = vars.n;
      const alpha = q / (1 - p);
      let an = a1;
      for (let i = 1; i < n; i++) an = p * an + q;
      return {
        vars: { a1, p, q, n },
        correctAnswer: an,
        explanationSteps: [
          '特性方程式 x=' + p + 'x+' + q + ' の解 α=' + alpha + '。',
          'b_n = a_n - α とおくと b_{n+1}=' + p + ' b_n（等比数列）。',
          'a_n = α + (a1-α)·' + p + '^{n-1}。',
          'n=' + n + ' を代入すると a_n=' + an + '。',
          '検算: 漸化式を ' + (n-1) + ' 回手で辿っても同じ値になる。',
        ],
      };
    `,
    hints: ['x=px+q を解いて定点 α を出す。', 'a_n-α を等比にする。', '初項から等比の一般項に戻す。'],
    keyFormula: 'a_{n+1}-α = p(a_n-α)， α=q/(1-p)',
    commonMistakes: 'α の符号を間違える。n 乗と (n-1) 乗を混同する。',
  };
}

function vectorByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const range = difficultySpan(difficulty, 1, 5);
    return {
      title: '★基礎: 内積の成分計算',
      unit: 'ベクトル',
      subject: 'math',
      format: 'input',
      variables: {
        x1: { min: 1, max: Math.max(2, range.max), step: 1 },
        y1: { min: 1, max: 4, step: 1 },
        x2: { min: 1, max: 4, step: 1 },
        y2: { min: 1, max: 4, step: 1 },
      },
      templateText: '$\\vec{a}=({{x1}},{{y1}})$，$\\vec{b}=({{x2}},{{y2}})$ のとき $\\vec{a}\\cdot\\vec{b}$ を求めよ。',
      calcLogicJS: `
        const x1 = vars.x1, y1 = vars.y1, x2 = vars.x2, y2 = vars.y2;
        const dot = x1*x2 + y1*y2;
        return {
          vars: { x1, y1, x2, y2 },
          correctAnswer: dot,
          explanationSteps: [
            '内積は成分の積の和。',
            'a·b = ' + x1 + '×' + x2 + '+' + y1 + '×' + y2 + ' = ' + dot,
          ],
        };
      `,
      hints: ['a·b = x1x2+y1y2。', '掛けて足すだけ。', '外積と混同しない。'],
      keyFormula: '\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2',
      commonMistakes: '成分の組み合わせをクロスする。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 内積からなす角',
      unit: 'ベクトル',
      subject: 'math',
      format: 'input',
      variables: {
        x1: { min: 2, max: 4, step: 1 },
        y1: { min: 0, max: 0, step: 1 },
        x2: { min: 2, max: 4, step: 1 },
        y2: { min: 2, max: 4, step: 1 },
      },
      templateText:
        '$\\vec{a}=({{x1}},{{y1}})$，$\\vec{b}=({{x2}},{{y2}})$ のなす角の余弦 $\\cos\\theta$ を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const x1 = vars.x1, y1 = vars.y1, x2 = vars.x2, y2 = vars.y2;
        const dot = x1*x2 + y1*y2;
        const n1 = Math.sqrt(x1*x1 + y1*y1);
        const n2 = Math.sqrt(x2*x2 + y2*y2);
        const cos = Math.round((dot / (n1 * n2)) * 100) / 100;
        return {
          vars: { x1, y1, x2, y2 },
          correctAnswer: cos,
          explanationSteps: [
            'a·b=' + dot + '，|a|=' + (Math.round(n1*100)/100) + '，|b|=' + (Math.round(n2*100)/100) + '。',
            'cosθ = (a·b)/(|a||b|) ≈ ' + cos + '。',
          ],
        };
      `,
      hints: ['まず内積と大きさを出す。', 'cosθ = 内積 / (積の大きさ)。', '鋭角なら cos>0。'],
      keyFormula: '\\cos\\theta = (\\vec{a}\\cdot\\vec{b}) / (|a||b|)',
      commonMistakes: '大きさを成分の和で求めてしまう。',
    };
  }

  return {
    title: '★難関: 円と接線・中点の融合',
    unit: 'ベクトル',
    subject: 'math',
    format: 'input',
    variables: {
      s: { min: 2, max: 4, step: 1 },
      t: { min: 2, max: 5, step: 1 },
    },
    templateText:
      '$\\overrightarrow{OA}=({{s}},0)$，$\\overrightarrow{OB}=(0,{{t}})$ とする。線分 AB 上の点 P で $\\overrightarrow{OP}\\cdot\\overrightarrow{AB}=0$ となるとき、比 $AP:PB$ の $AP$ 側を求めよ（整数）。',
    calcLogicJS: `
      const s = vars.s, t = vars.t;
      const ratioA = s * s;
      const ratioB = t * t;
      return {
        vars: { s, t },
        correctAnswer: ratioA,
        explanationSteps: [
          'P は AB 上なので OP = (1-λ)OA + λOB = ((1-λ)' + s + ', λ' + t + ') と置く。',
          'AB = (-' + s + ', ' + t + ')。垂直条件 OP·AB=0 を立式する。',
          '-' + ratioA + '(1-λ) + ' + ratioB + 'λ = 0 より λ = ' + ratioA + '/(' + (ratioA + ratioB) + ')。',
          'AP:PB = λ:(1-λ) = ' + ratioA + ':' + ratioB + '。AP 側は ' + ratioA + '。',
          'これは O から AB へ下ろした垂線の足であり、円の直径の定理のベクトル版。',
          '検算: λ が 0 と 1 の間にあること（' + ratioA + ' と ' + ratioB + ' は正）を確認する。',
        ],
      };
    `,
    hints: [
      'P を内分比で置いて OP を文字で表す。',
      '垂直 ⇔ 内積 0 を先に立式する。',
      '得られた比の AP 側（整数）を答える。',
    ],
    keyFormula: '\\vec{OP}\\cdot\\vec{AB}=0 （垂線の足）',
    commonMistakes: '内分のパラメータと AP:PB の対応を逆にする。AB の向きを A-B にして符号を間違える。',
  };
}

function planeGeometryByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const bRange = difficultySpan(difficulty, 3, 6);
    return {
      title: '★基礎: 角の二等分線定理',
      unit: '図形の性質',
      subject: 'math',
      format: 'input',
      variables: {
        b: { min: Math.max(3, bRange.min), max: Math.max(5, bRange.max), step: 1 },
        c: { min: 3, max: 6, step: 1 },
        a: { min: 6, max: 10, step: 1 },
      },
      templateText:
        '三角形ABCで AB={{c}}, AC={{b}}, BC={{a}}。∠Aの二等分線とBCの交点をDとするとき、BDの長さを求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a, b = vars.b, c = vars.c;
        const bd = Math.round((a * c / (b + c)) * 100) / 100;
        return {
          vars: { a, b, c },
          correctAnswer: bd,
          explanationSteps: [
            '角の二等分線定理より BD:DC = AB:AC = ' + c + ':' + b + '。',
            'BD = a · c/(b+c) ≈ ' + bd + '。',
          ],
        };
      `,
      hints: ['BD:DC=AB:AC。', 'BCをその比で内分する。', 'BD=a·c/(b+c)。'],
      keyFormula: 'BD:DC = AB:AC',
      commonMistakes: '比の対応を逆にする。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 外接円の半径',
      unit: '図形の性質',
      subject: 'math',
      format: 'input',
      variables: {
        b: { min: 5, max: 8, step: 1 },
        c: { min: 5, max: 8, step: 1 },
        a: { min: 6, max: 10, step: 1 },
      },
      templateText:
        '三角形ABCで AB={{c}}, AC={{b}}, BC={{a}} のとき、外接円の半径 R を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a, b = vars.b, c = vars.c;
        const cosA = (b*b + c*c - a*a) / (2*b*c);
        const sinA = Math.sqrt(Math.max(0, 1 - cosA*cosA));
        const R = Math.round((a / (2 * sinA)) * 100) / 100;
        return {
          vars: { a, b, c },
          correctAnswer: R,
          explanationSteps: [
            '余弦定理で cosA を出し、sinA=√(1-cos^2A) を取る。',
            '正弦定理 a/sinA=2R より R=a/(2sinA) ≈ ' + R + '。',
          ],
        };
      `,
      hints: ['まず余弦定理。', 'sin は正の平方根。', '正弦定理で 2R。'],
      keyFormula: 'a / sinA = 2R',
      commonMistakes: '鈍角のとき sin の符号を負にする。',
    };
  }

  return {
    title: '★難関: 二等分線と外接円の融合',
    unit: '図形の性質',
    subject: 'math',
    format: 'input',
    variables: {
      b: { min: 6, max: 9, step: 1 },
      c: { min: 5, max: 8, step: 1 },
      a: { min: 7, max: 11, step: 1 },
    },
    templateText:
      '三角形ABCで AB={{c}}, AC={{b}}, BC={{a}}。∠Aの二等分線と辺BCの交点をD、外接円と直線ADの交点（Aと異なる方）をEとする。BDの長さを求めよ（小数第2位まで）。',
    calcLogicJS: `
      const a = vars.a, b = vars.b, c = vars.c;
      const bd = Math.round((a * c / (b + c)) * 100) / 100;
      return {
        vars: { a, b, c },
        correctAnswer: bd,
        explanationSteps: [
          '角の二等分線定理より BD:DC=c:b。これが第一の場合分け不要の核心。',
          'BD = a·c/(b+c) ≈ ' + bd + '。',
          '点Eは「角の二等分線と外接円」の交点なので、弧BE=弧CE（円周角）。',
          'よって三角形の形状（鋭・直・鈍）で E の位置は3通りに変わるが、BD の比そのものは変わらない。',
          '鈍角△では E が辺の延長側に出ることがある。円周角の位置だけ場合分けする。',
          '検算: b=c の二等辺なら D は中点で BD=a/2。',
        ],
      };
    `,
    hints: [
      'BD は二等分線定理だけで決まる。円が出ても焦らない。',
      'E は弧の相等から来る補助点で、BD の計算には直接使わない。',
      '鋭角・直角・鈍角で E の位置だけ3通りに変わる。',
    ],
    keyFormula: 'BD:DC=AB:AC（円との交点Eは弧の相等）',
    commonMistakes: '円が出た瞬間に正弦定理へ逃げて、二等分線定理を使わない。',
  };
}

function coordinateGeometryByTier(tier: DifficultyTier, _difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    return {
      title: '★基礎: 点と直線の距離',
      unit: '図形と方程式',
      subject: 'math',
      format: 'input',
      variables: {
        a: { min: 1, max: 4, step: 1 },
        b: { min: 1, max: 4, step: 1 },
        c: { min: -6, max: 6, step: 1 },
        x0: { min: -3, max: 3, step: 1 },
        y0: { min: -3, max: 3, step: 1 },
      },
      templateText:
        '点({{x0}}, {{y0}}) と直線 {{a}}x + {{b}}y + {{c}} = 0 との距離を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const a = vars.a, b = vars.b, c = vars.c, x0 = vars.x0, y0 = vars.y0;
        const distance = Math.round((Math.abs(a*x0+b*y0+c) / Math.sqrt(a*a+b*b)) * 100) / 100;
        return { vars: { a, b, c, x0, y0 }, correctAnswer: distance,
          explanationSteps: ['d=|ax0+by0+c|/√(a²+b²) ≈ ' + distance + '。'] };
      `,
      hints: ['公式に代入する。', '絶対値を先につける。', '分母は √(a²+b²)。'],
      keyFormula: 'd = |ax0+by0+c| / √(a²+b²)',
      commonMistakes: '絶対値を忘れる。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 円と直線の交点の個数',
      unit: '図形と方程式',
      subject: 'math',
      format: 'input',
      variables: {
        r: { min: 2, max: 5, step: 1 },
        c: { min: 1, max: 6, step: 1 },
      },
      templateText:
        '円 x^2+y^2={{r2}} と直線 x+y={{c}} の共有点の個数を求めよ。',
      calcLogicJS: `
        const r = vars.r, c = vars.c;
        const r2 = r * r;
        const d = Math.abs(c) / Math.sqrt(2);
        const count = Math.abs(d - r) < 1e-9 ? 1 : d < r ? 2 : 0;
        return {
          vars: { r2, c },
          correctAnswer: count,
          explanationSteps: [
            '中心から直線までの距離 d=|c|/√2 ≈ ' + (Math.round(d*100)/100) + '、半径 ' + r + '。',
            'd<r なら2個、d=r なら1個（接する）、d>r なら0個。',
            '今回の個数は ' + count + '。',
          ],
        };
      `,
      hints: ['点と直線の距離と半径を比較する。', '等しいとき接する。', '交点を連立しなくても個数は出る。'],
      keyFormula: '円と直線: 距離と半径の大小',
      commonMistakes: '距離公式の分母 √2 を落とす。',
    };
  }

  return {
    title: '★難関: 円と直線の位置関係の3場合分け',
    unit: '図形と方程式',
    subject: 'math',
    format: 'input',
    variables: {
      r: { min: 3, max: 6, step: 1 },
      k: { min: 1, max: 8, step: 1 },
    },
    templateText:
      '円 x^2+y^2={{r2}} と直線 x={{k}} の共有点の個数を求めよ。',
    calcLogicJS: `
      const r = vars.r, k = vars.k;
      const r2 = r * r;
      let count;
      if (Math.abs(k) < r) count = 2;
      else if (Math.abs(k) === r) count = 1;
      else count = 0;
      return {
        vars: { r2, k },
        correctAnswer: count,
        explanationSteps: [
          '直線 x=k と原点中心半径 r の円。距離は |k|。',
          '|k|<r なら弦（2交点）、|k|=r なら接線（1点）、|k|>r なら共有点なし。',
          '今回 |k|=' + Math.abs(k) + '、r=' + r + ' なので個数は ' + count + '。',
          '接するときは接点が (±r,0) となり、接線は円の半径に垂直。',
          '一般の ax+by+c=0 でも「距離 vs 半径」の3場合分けに帰着する。',
          '判別式 D で解いても同じ結論（D>0,=0,<0）。',
        ],
      };
    `,
    hints: [
      '中心から直線までの距離と半径を比較する。',
      '小さい・等しい・大きいの3通りで個数が決まる。',
      '連立して判別式を見てもよい。',
    ],
    keyFormula: '|k|<r → 2， |k|=r → 1， |k|>r → 0',
    commonMistakes: '接する場合を2個と数える。半径の2乗と k を直接比べる。',
  };
}

function mechanicsByTier(tier: DifficultyTier, difficulty: number): TemplateBlueprint {
  if (tier === 'basic') {
    const vRange = difficultySpan(difficulty, 5, 15);
    return {
      title: '★基礎: 等加速度運動 v=v0+at',
      unit: '力学',
      subject: 'physics',
      format: 'input',
      variables: {
        v0: { min: Math.max(8, vRange.min), max: Math.max(12, vRange.max), step: 1 },
        t: { min: 1, max: 3, step: 1 },
      },
      templateText:
        '初速度 {{v0}} m/s で真上に投げた物体の {{t}} 秒後の速度 [m/s] を求めよ（上向き正、g=9.8、$1$ 桁）。',
      calcLogicJS: `
        const v0 = vars.v0, t = vars.t;
        const v = Math.round((v0 - 9.8 * t) * 10) / 10;
        return {
          vars: { v0, t },
          correctAnswer: v,
          explanationSteps: [
            '上向き正なので a=-9.8 m/s^2。',
            'v=v0+at=' + v0 + '-9.8×' + t + '=' + v + '。',
          ],
        };
      `,
      hints: ['v=v0+at。', '重力は上向き正なら負。', '負の速度は下降中。'],
      keyFormula: 'v = v_0 + at',
      commonMistakes: 'g の符号を正のまま使う。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: 力学的エネルギー保存',
      unit: '力学',
      subject: 'physics',
      format: 'input',
      variables: {
        h: { min: 5, max: 20, step: 1 },
        v0: { min: 0, max: 6, step: 2 },
      },
      templateText:
        '高さ {{h}} m から初速 {{v0}} m/s で真下に投げた物体が地面に達する速さ [m/s] を求めよ（g=10、小数第1位まで、空気抵抗なし）。',
      calcLogicJS: `
        const h = vars.h, v0 = vars.v0;
        const v = Math.round(Math.sqrt(v0 * v0 + 2 * 10 * h) * 10) / 10;
        return {
          vars: { h, v0 },
          correctAnswer: v,
          explanationSteps: [
            '力学的エネルギー保存: (1/2)mv0^2 + mgh = (1/2)mv^2。',
            'v=√(v0^2+2gh)=√(' + v0 + '^2+20×' + h + ') ≈ ' + v + '。',
            '時間を追う必要はない（エネルギーは速さだけを与える）。',
          ],
        };
      `,
      hints: ['摩擦なしならエネルギー保存。', '(1/2)mv^2 + mgh が一定。', 'g=10 で計算。'],
      keyFormula: '\\tfrac{1}{2}mv^2 + mgh = \\text{一定}',
      commonMistakes: '位置エネルギーの基準点を途中で変える。',
    };
  }

  return {
    title: '★難関: 衝突とエネルギー・運動量の融合',
    unit: '力学',
    subject: 'physics',
    format: 'input',
    variables: {
      m1: { min: 1, max: 3, step: 1 },
      m2: { min: 1, max: 3, step: 1 },
      v1: { min: 4, max: 8, step: 1 },
    },
    templateText:
      '質量 {{m1}} kg の物体が速さ {{v1}} m/s で、静止した質量 {{m2}} kg の物体に完全弾性衝突した。衝突後の入射側の速度 [m/s] を求めよ（一直線、小数第2位まで）。',
    calcLogicJS: `
      const m1 = vars.m1, m2 = vars.m2, v1 = vars.v1;
      const v1after = Math.round(((m1 - m2) / (m1 + m2) * v1) * 100) / 100;
      return {
        vars: { m1, m2, v1 },
        correctAnswer: v1after,
        explanationSteps: [
          "外力なしなら運動量保存: m1 v1 = m1 v1after + m2 v2after。",
          "完全弾性 e=1 なら v1after - v2after = -(v1 - 0)。",
          "連立すると v1after = (m1-m2)/(m1+m2) * v1 = " + v1after + "。",
          "m1=m2 なら速度が入れ替わり v1after=0。m1<m2 なら跳ね返りで負。",
          "エネルギー保存 (1/2)m1 v1^2 = (1/2)m1 v1after^2 + (1/2)m2 v2after^2 で検算できる。",
        ],
      };
    `,
    hints: ['運動量保存と反発係数の2式。', 'e=1 は接近速度=分離速度。', '公式 v1after=(m1-m2)/(m1+m2)v1。'],
    keyFormula: 'm_1v_1=m_1v_1\'+m_2v_2\'， e=1',
    commonMistakes: 'エネルギー保存だけ（または運動量だけ）で解こうとする。',
  };
}

function gasLawByTier(
  tier: DifficultyTier,
  difficulty: number,
  unitTitle: string,
  subject: 'physics' | 'chemistry'
): TemplateBlueprint {
  if (tier === 'basic') {
    return {
      title: '★基礎: 状態方程式で n を求める',
      unit: unitTitle,
      subject,
      format: 'input',
      variables: {
        p: { min: 1, max: 3, step: 1 },
        v: { min: 2, max: 8, step: 1 },
        t: { min: 270, max: 310, step: 10 },
      },
      templateText:
        '圧力 {{p}} atm、体積 {{v}} L、温度 {{t}} K の理想気体の物質量 n [mol] を求めよ（R=0.082、小数第2位まで）。',
      calcLogicJS: `
        const p = vars.p, v = vars.v, t = vars.t;
        const n = Math.round((p * v / (0.082 * t)) * 100) / 100;
        return {
          vars: { p, v, t },
          correctAnswer: n,
          explanationSteps: [
            'PV=nRT より n=PV/RT。',
            'n=' + p + '×' + v + '/(0.082×' + t + ') ≈ ' + n + '。',
          ],
        };
      `,
      hints: ['n=PV/RT。', 'T は絶対温度。', 'R=0.082 を使う。'],
      keyFormula: 'PV = nRT',
      commonMistakes: '℃のまま T に入れる。',
    };
  }

  if (tier === 'standard') {
    return {
      title: '★標準: ボイル・シャルルの法則',
      unit: unitTitle,
      subject,
      format: 'input',
      variables: {
        p1: { min: 1, max: 4, step: 1 },
        v1: { min: 2, max: 8, step: 1 },
        t1: { min: 250, max: 310, step: 10 },
        v2: { min: 2, max: 8, step: 1 },
        t2: { min: 280, max: 350, step: 10 },
      },
      templateText:
        'P1={{p1}} atm, V1={{v1}} L, T1={{t1}} K の気体を V2={{v2}} L, T2={{t2}} K にした。P2 [atm] を求めよ（小数第2位まで）。',
      calcLogicJS: `
        const p1 = vars.p1, v1 = vars.v1, t1 = vars.t1, v2 = vars.v2, t2 = vars.t2;
        const p2 = Math.round(((p1 * v1 * t2) / (t1 * v2)) * 100) / 100;
        return {
          vars: { p1, v1, t1, v2, t2 },
          correctAnswer: p2,
          explanationSteps: [
            'P1V1/T1 = P2V2/T2。',
            'P2=P1V1T2/(T1V2) ≈ ' + p2 + '。',
          ],
        };
      `,
      hints: ['一定量なら P1V1/T1=P2V2/T2。', '求めたい量について先に解く。', '温度は K。'],
      keyFormula: 'P_1V_1/T_1 = P_2V_2/T_2',
      commonMistakes: '分子分母を逆にする。',
    };
  }

  return {
    title: '★難関: 反応で物質量が変わる気体',
    unit: unitTitle,
    subject,
    format: 'input',
    variables: {
      mass: { min: 8, max: 24, step: 2 },
    },
    templateText:
      '炭酸カルシウム {{mass}} g に十分な塩酸を加えたとき発生する CO2 の、27℃・1.0 atm における体積 [L] を求めよ（CaCO3=100 g/mol、R=0.082、小数第2位まで）。',
    calcLogicJS: `
      const mass = vars.mass;
      const n = mass / 100;
      const T = 300;
      const V = Math.round((n * 0.082 * T / 1.0) * 100) / 100;
      return {
        vars: { mass },
        correctAnswer: V,
        explanationSteps: [
          'CaCO3 + 2HCl → CaCl2 + H2O + CO2 より n(CO2)=n(CaCO3)=' + mass + '/100=' + n + ' mol。',
          '標準状態ではなく 27℃=300 K、1 atm なので PV=nRT を使う。',
          'V=nRT/P=' + n + '×0.082×300 ≈ ' + V + ' L。',
          '22.4 L/mol をそのまま使うと温度・圧力条件が違うので誤り。',
          '融合: 水上置換なら全圧から水蒸気圧を引いた分圧で V または n を出す。',
        ],
      };
    `,
    hints: ['先に反応式で CO2 の mol を出す。', '条件が標準状態か確認。', '非標準なら PV=nRT。'],
    keyFormula: 'V = nRT/P （反応の係数比で n を決定）',
    commonMistakes: '条件無視で ×22.4 してしまう。',
  };
}

// ==========================================
// Apex Suite: Math Lab - Mock Problem Generator
// ==========================================
// `OPENAI_API_KEY` が未設定の場合の高品質フォールバック問題生成。
// 全34単元（数I・数A・数II・数B・数III・数C・物理・化学）それぞれに
// 本格的な高校レベルの専用テンプレートを用意しており、
// 「足し算・掛け算だけのダミー処理」には一切フォールバックしない。
// `difficulty`(1-10) に応じて数値の範囲や複雑さをスケールさせる。
// 生成された問題は `templateConfig` を持ち、`regenerateProblemLocally` で
// 「数字を変えて再生成（APIコスト0）」が可能。
//
// NOTE: KaTeXでの二重エスケープ地雷を避けるため、このファイルのテンプレートは
// バックスラッシュ系LaTeXコマンド（\sin, \frac 等）を使わず、Unicode数学記号
// （θ, π, °, ², √, ・ 等）とASCII表記（^, /, ()）のみで数式を表現する。

import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { getUnitById } from '@/data/unitsData';
import { SOLUTION_PATTERNS } from '@/data/patternsData';
import { clampDifficulty } from '@/lib/engine/adaptiveEngine';
import {
  difficultySpan,
  getDifficultyTier,
  type PatternKey,
  type TemplateBlueprint,
} from '@/lib/mock/blueprintTypes';
import { buildTieredBlueprint } from '@/lib/mock/tieredBlueprints';
import { createVariantSeed, pickBlueprint } from '@/lib/mock/variantPools';
import { getExtraBlueprints } from '@/lib/mock/extraUnitVariants';

export type { PatternKey };

const UNIT_ID_PATTERN_MAP: Partial<Record<string, PatternKey>> = {
  // 数I
  'math-1a-numbers-and-expressions': 'numbers',
  'math-1a-quadratic-functions': 'quadratic',
  'math-1a-trigonometric-ratios': 'trigonometry',
  'math-1a-data-analysis': 'data_analysis',
  // 数A
  'math-1a-combinatorics-probability': 'combinatorics',
  'mathA-plane-geometry': 'plane_geometry',
  'mathA-integers': 'integers',
  // 数II
  'math2-expressions-and-proof': 'remainder_theorem',
  'math2-coordinate-geometry': 'coordinate_geometry',
  'math-2bc-trigonometric-functions': 'trig_composition',
  'math-2bc-exponential-logarithmic': 'logarithm',
  'math-2bc-differentiation': 'differentiation',
  'math-2bc-integration': 'integration',
  // 数B
  'math-2bc-sequences': 'sequence',
  'mathB-statistics': 'statistics',
  // 数III
  'math-3-limits': 'limits',
  'math-3-differentiation': 'differentiation_advanced',
  'math-3-integration': 'integration_advanced',
  'math3-parametric-polar': 'parametric',
  // 数C
  'math-2bc-vectors': 'vector',
  'mathC-complex-plane-conics': 'complex_plane',
  // 物理
  'physics-mechanics': 'mechanics',
  'physics-thermodynamics': 'gas_law_physics',
  'physics-waves': 'wave_speed',
  'physics-electromagnetism': 'ohms_law',
  'physics-atomic': 'half_life',
  // 化学
  'chemistry-composition': 'mole_calculation',
  'chemistry-reactions': 'gas_law',
  'chemistry-acid-base': 'neutralization',
  'chemistry-redox': 'redox',
  'chemistry-equilibrium': 'equilibrium',
  'chemistry-inorganic': 'inorganic_stoichiometry',
  'chemistry-organic': 'organic_ihd',
  'chemistry-polymer': 'polymer',
};

function genericKeyForSubject(subject: Subject): PatternKey {
  if (subject === 'physics') return 'generic_physics';
  if (subject === 'chemistry') return 'generic_chemistry';
  return 'generic_math';
}

function buildBlueprint(patternKey: PatternKey, difficulty: number, unitTitle: string): TemplateBlueprint {
  const tiered = buildTieredBlueprint(patternKey, getDifficultyTier(difficulty), difficulty, unitTitle);
  if (tiered) return tiered;

  switch (patternKey) {
    // ============================================================
    // 数I
    // ============================================================
    case 'quadratic': {
      const pRange = difficultySpan(difficulty, -3, 3);
      const qRange = difficultySpan(difficulty, -5, 10);
      return {
        title: '2次関数の頂点と最大値',
        unit: '2次関数',
        subject: 'math',
        format: 'input',
        variables: {
          p: { min: pRange.min, max: pRange.max, step: 1 },
          q: { min: qRange.min, max: qRange.max, step: 1 },
          k: { min: 1, max: Math.max(1, Math.round(1 + difficulty / 4)), step: 1 },
        },
        templateText:
          '2次関数 $y = {{poly}}$ の最大値を求めよ（頂点の座標も考えてみよう）。',
        calcLogicJS: `
          const p = vars.p, q = vars.q, k = vars.k;
          const a = k;
          const b = 2 * k * p;
          const c = q - k * p * p;
          function term(coeff, label) {
            if (coeff === 0) return '';
            const sign = coeff > 0 ? ' + ' : ' - ';
            const abs = Math.abs(coeff);
            const num = abs === 1 && label ? '' : String(abs);
            return sign + num + label;
          }
          const poly = '-' + a + 'x^2' + term(b, 'x') + term(c, '');
          return {
            vars: { poly, a: -a, b, c, p, q },
            correctAnswer: q,
            explanationSteps: [
              'y = ' + poly + ' を平方完成する。',
              'y = -' + a + '(x - (' + p + '))^2 + ' + q + ' の形になるので、頂点は (' + p + ', ' + q + ')。',
              '係数が負の2次の項なので上に凸の放物線であり、x = ' + p + ' のとき最大値 ' + q + ' をとる。',
            ],
          };
        `,
        hints: [
          'まず与えられた式を平方完成の形 y = a(x-p)^2 + q に変形してみよう。',
          'x^2の係数の符号に注目すると、放物線が上に凸か下に凸かが分かる。',
          '頂点のx座標を代入するとそのままそこでの最大値（または最小値）が分かる。',
        ],
        keyFormula: 'y = a(x - p)^2 + q （頂点(p, q)の標準形）',
        commonMistakes: '平方完成の際、定数項の符号を反転させ忘れるミスが多い。b/(2a)の計算も慎重に。',
      };
    }

    case 'trigonometry': {
      const numRange = difficultySpan(difficulty, -3, 3);
      return {
        title: 'sinθ+cosθからsinθcosθを求める',
        unit: '図形と計量（三角比）',
        subject: 'math',
        format: 'input',
        variables: {
          // sinθ+cosθ = num/3 は定義域より必ず [-√2, √2](≈±1.414) に収まる必要があるため、
          // den=3 のとき |num| は 4 以下（3√2≈4.24）に固定し、数学的に解が存在しない
          // 問題（例: sinθ+cosθ=5/3）が生成されないようにする。
          num: { min: Math.max(-4, numRange.min), max: Math.min(4, Math.max(numRange.max, numRange.min + 1)), step: 1 },
        },
        templateText:
          'sinθ + cosθ = {{kDisplay}} のとき、sinθ・cosθ の値を求めよ。',
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
              '与式の両辺を2乗する: (sinθ+cosθ)^2 = ' + kDisplay + '^2',
              '左辺を展開: sin^2θ + 2sinθcosθ + cos^2θ = ' + kDisplay + '^2',
              'sin^2θ+cos^2θ=1 を使うと 1 + 2sinθcosθ = ' + kDisplay + '^2 となり、sinθcosθ = ' + result + ' が求まる。',
            ],
          };
        `,
        hints: [
          '与えられた等式の両辺を2乗してみよう。',
          'sin^2θ + cos^2θ = 1 の関係式を使って式を整理する。',
          '2sinθcosθ = (2乗した式) - 1 という形に持ち込めば、sinθcosθが求まる。',
        ],
        keyFormula: 'sin^2θ + cos^2θ = 1',
        commonMistakes: '2乗する際に交差項2sinθcosθを書き忘れる、符号の計算ミスが多い。',
      };
    }

    case 'data_analysis': {
      return {
        title: 'データの分散',
        unit: 'データの分析',
        subject: 'math',
        format: 'input',
        variables: {
          x1: { min: 1, max: 10, step: 1 },
          x2: { min: 1, max: 10, step: 1 },
          x3: { min: 1, max: 10, step: 1 },
          x4: { min: 1, max: 10, step: 1 },
        },
        templateText:
          '4つのデータ {{x1}}, {{x2}}, {{x3}}, {{x4}} の分散を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const values = [vars.x1, vars.x2, vars.x3, vars.x4];
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const meanOfSquares = values.reduce((sum, v) => sum + v * v, 0) / values.length;
          const variance = Math.round((meanOfSquares - mean * mean) * 100) / 100;
          return {
            vars: { x1: values[0], x2: values[1], x3: values[2], x4: values[3] },
            correctAnswer: variance,
            explanationSteps: [
              '平均値を求める: 平均 = (' + values.join('+') + ') / 4 = ' + (Math.round(mean*100)/100) + '。',
              '(2乗の平均) - (平均の2乗) の公式で分散を計算する。',
              '分散 = ' + (Math.round(meanOfSquares*100)/100) + ' - ' + (Math.round(mean*mean*100)/100) + ' = ' + variance + '。',
            ],
          };
        `,
        hints: [
          'まず平均値を求める。',
          '分散は「(各データの2乗の平均) - (平均の2乗)」で計算できる。',
          '偏差(各データ-平均)を先に2乗してから平均する方法でも同じ結果になる。',
        ],
        keyFormula: '分散 V = (x²の平均) - (xの平均)²',
        commonMistakes: '平均の2乗と2乗の平均を混同してしまうミスが多い。',
      };
    }

    case 'numbers': {
      const range = difficultySpan(difficulty, -6, 6);
      return {
        title: '展開と定数項',
        unit: '数と式',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: range.min, max: range.max, step: 1 },
          b: { min: range.min, max: range.max, step: 1 },
        },
        templateText:
          '(x{{aTerm}})(x{{bTerm}}) を展開したときの定数項を求めよ。',
        calcLogicJS: `
          const a = vars.a === 0 ? 1 : vars.a, b = vars.b === 0 ? -1 : vars.b;
          function term(v) { return v >= 0 ? ('+' + v) : String(v); }
          const aTerm = term(a), bTerm = term(b);
          const constantTerm = a * b;
          const middleTerm = a + b;
          return {
            vars: { aTerm, bTerm },
            correctAnswer: constantTerm,
            explanationSteps: [
              '(x+a)(x+b) = x^2 + (a+b)x + ab の公式を使う。',
              '定数項は a×b = (' + a + ')×(' + b + ') = ' + constantTerm + '。',
              '参考: xの係数（a+b）は ' + middleTerm + '。',
            ],
          };
        `,
        hints: [
          '(x+a)(x+b)を展開すると x^2+(a+b)x+ab になる公式を使おう。',
          '定数項はaとbを掛けた値になる。',
          '符号（負の数どうしの積は正になる等）に注意する。',
        ],
        keyFormula: '(x+a)(x+b) = x^2 + (a+b)x + ab',
        commonMistakes: '負の数同士の掛け算の符号を誤るミスが多い。',
      };
    }

    // ============================================================
    // 数A
    // ============================================================
    case 'combinatorics': {
      const nRange = difficultySpan(difficulty, 5, 10);
      return {
        title: '組合せの数 nCr',
        unit: '場合の数と確率',
        subject: 'math',
        format: 'input',
        variables: {
          n: { min: Math.max(4, nRange.min), max: Math.max(6, nRange.max), step: 1 },
          r: { min: 2, max: 4, step: 1 },
        },
        templateText:
          '{{n}}人の中から{{r}}人を選ぶ組合せの数 {{n}}C{{r}} を求めよ。',
        calcLogicJS: `
          const n = vars.n, r = Math.min(vars.r, n - 1);
          function combination(n, r) {
            let result = 1;
            for (let i = 0; i < r; i++) {
              result = result * (n - i) / (i + 1);
            }
            return Math.round(result);
          }
          const answer = combination(n, r);
          return {
            vars: { n, r },
            correctAnswer: answer,
            explanationSteps: [
              'nCr = n! / (r!(n-r)!) の公式を使う。',
              n + 'C' + r + ' = (' + n + '×(' + n + '-1)×...) / ' + r + '! を計算する。',
              '計算結果は ' + answer + ' 通り。',
            ],
          };
        `,
        hints: [
          '「選ぶだけ（順序を区別しない）」なので組合せnCrを使う。',
          'nCr = n! / (r!(n-r)!) の公式に当てはめる。',
          '分子はnから始めてr個の連続する数の積、分母はr!。',
        ],
        keyFormula: 'nCr = n! / (r!(n-r)!)',
        commonMistakes: '順列nPrと組合せnCrを混同してしまうミスが最も多い。',
      };
    }

    case 'plane_geometry': {
      const bRange = difficultySpan(difficulty, 3, 8);
      const cRange = difficultySpan(difficulty, 3, 8);
      return {
        title: '角の二等分線定理',
        unit: '図形の性質',
        subject: 'math',
        format: 'input',
        variables: {
          b: { min: Math.max(2, bRange.min), max: Math.max(4, bRange.max), step: 1 },
          c: { min: Math.max(2, cRange.min), max: Math.max(4, cRange.max), step: 1 },
          a: { min: 6, max: 12, step: 1 },
        },
        templateText:
          '三角形ABCにおいて AB={{c}}, AC={{b}}, BC={{a}} とする。∠Aの二等分線と辺BCの交点をDとするとき、線分BDの長さを求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a, b = vars.b, c = vars.c;
          const bd = Math.round((a * c / (b + c)) * 100) / 100;
          return {
            vars: { a, b, c },
            correctAnswer: bd,
            explanationSteps: [
              '角の二等分線定理より BD:DC = AB:AC = ' + c + ':' + b + '。',
              'BD = BC × (AB / (AB+AC)) = ' + a + ' × ' + c + ' / (' + c + '+' + b + ')。',
              '計算すると BD ≈ ' + bd + ' となる。',
            ],
          };
        `,
        hints: [
          '角の二等分線は対辺を「隣り合う2辺の比」に分割する（BD:DC=AB:AC）。',
          'BD = BC全体を AB:AC の比で内分した長さとして計算する。',
          'BD = a・c/(b+c) の形にあてはめる。',
        ],
        keyFormula: 'BD:DC = AB:AC',
        commonMistakes: '比の対応（どちらがAB、どちらがACか）を逆にしてしまうミスが多い。',
      };
    }

    case 'integers': {
      const mRange = difficultySpan(difficulty, 40, 150);
      return {
        title: 'ユークリッドの互除法で最大公約数を求める',
        unit: '整数の性質',
        subject: 'math',
        format: 'input',
        variables: {
          m: { min: Math.max(20, mRange.min), max: Math.max(60, mRange.max), step: 1 },
          n: { min: 10, max: 40, step: 1 },
        },
        templateText:
          '2つの整数 {{m}} と {{n}} の最大公約数を、ユークリッドの互除法を用いて求めよ。',
        calcLogicJS: `
          let x = Math.max(vars.m, vars.n), y = Math.min(vars.m, vars.n);
          const steps = [];
          while (y !== 0) {
            const q = Math.floor(x / y);
            const r = x % y;
            steps.push(x + ' = ' + y + '×' + q + ' + ' + r);
            x = y; y = r;
          }
          const gcd = x;
          return {
            vars: { m: vars.m, n: vars.n },
            correctAnswer: gcd,
            explanationSteps: steps.concat(['余りが0になったので、最大公約数は ' + gcd + '。']),
          };
        `,
        hints: [
          '大きい方を小さい方で割り、商と余りを求める。',
          '割る数と余りの組を使って、同じ操作を余りが0になるまで繰り返す。',
          '最後に割った数（余りが0になる直前の割る数）が最大公約数。',
        ],
        keyFormula: 'gcd(a, b) = gcd(b, a mod b)',
        commonMistakes: '割り算の商と余りを混同する、余りが0になった時点で止めずに続けてしまうミスが多い。',
      };
    }

    // ============================================================
    // 数II
    // ============================================================
    case 'remainder_theorem': {
      const aRange = difficultySpan(difficulty, -5, 5);
      const bRange = difficultySpan(difficulty, -8, 8);
      const cRange = difficultySpan(difficulty, -3, 3);
      return {
        title: '剰余の定理',
        unit: 'いろいろな式（式と証明・複素数と方程式）',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: aRange.min, max: aRange.max, step: 1 },
          b: { min: bRange.min, max: bRange.max, step: 1 },
          c: { min: Math.max(-4, cRange.min), max: Math.max(4, cRange.max), step: 1 },
        },
        templateText:
          '整式 P(x) = x^3 + {{a}}x + {{b}} を (x-{{c}}) で割ったときの余りを求めよ。',
        calcLogicJS: `
          const a = vars.a, b = vars.b, c = vars.c;
          const remainder = c*c*c + a*c + b;
          return {
            vars: { a, b, c },
            correctAnswer: remainder,
            explanationSteps: [
              '剰余の定理より、P(x)を(x-c)で割った余りはP(c)に等しい。',
              'P(' + c + ') = ' + c + '^3 + ' + a + '×' + c + ' + ' + b + ' を計算する。',
              '計算すると余りは ' + remainder + '。',
            ],
          };
        `,
        hints: [
          '実際に割り算をしなくても、剰余の定理でP(c)を計算するだけで余りが求まる。',
          'P(x)にx=cを代入する。',
          '符号の計算（負の数の3乗など）に注意する。',
        ],
        keyFormula: 'P(x)を(x-c)で割った余り = P(c)',
        commonMistakes: '負の数の奇数乗の符号を落とす、代入する値の符号を逆にするミスが多い。',
      };
    }

    case 'coordinate_geometry': {
      const aRange = difficultySpan(difficulty, 1, 5);
      const bRange = difficultySpan(difficulty, 1, 5);
      return {
        title: '点と直線の距離',
        unit: '図形と方程式',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(1, aRange.min), max: Math.max(3, aRange.max), step: 1 },
          b: { min: Math.max(1, bRange.min), max: Math.max(3, bRange.max), step: 1 },
          c: { min: -10, max: 10, step: 1 },
          x0: { min: -6, max: 6, step: 1 },
          y0: { min: -6, max: 6, step: 1 },
        },
        templateText:
          '点({{x0}}, {{y0}}) と直線 {{a}}x + {{b}}y + {{c}} = 0 との距離を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a, b = vars.b, c = vars.c, x0 = vars.x0, y0 = vars.y0;
          const distance = Math.round((Math.abs(a*x0+b*y0+c) / Math.sqrt(a*a+b*b)) * 100) / 100;
          return {
            vars: { a, b, c, x0, y0 },
            correctAnswer: distance,
            explanationSteps: [
              '点と直線の距離公式 d=|ax0+by0+c|/√(a²+b²) を使う。',
              'd = |' + a + '×' + x0 + '+' + b + '×' + y0 + '+(' + c + ')| / √(' + a + '²+' + b + '²)。',
              '計算すると d ≈ ' + distance + '。',
            ],
          };
        `,
        hints: [
          '直線の式をax+by+c=0の形に整理する。',
          '距離公式 d=|ax0+by0+c|/√(a²+b²) に座標と係数を代入する。',
          '絶対値を先につけてから計算し、最後にルートで割る。',
        ],
        keyFormula: 'd = |ax0+by0+c| / √(a²+b²)',
        commonMistakes: '絶対値をつけ忘れる、√の中の計算(a²+b²)を間違えるミスが多い。',
      };
    }

    case 'trig_composition': {
      const aRange = difficultySpan(difficulty, 1, 4);
      const bRange = difficultySpan(difficulty, 1, 4);
      return {
        title: '三角関数の合成',
        unit: '三角関数',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(1, aRange.min), max: Math.max(3, aRange.max), step: 1 },
          b: { min: Math.max(1, bRange.min), max: Math.max(3, bRange.max), step: 1 },
        },
        templateText:
          '{{a}}sinθ + {{b}}cosθ の最大値を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a, b = vars.b;
          const maxValue = Math.round(Math.sqrt(a*a+b*b) * 100) / 100;
          return {
            vars: { a, b },
            correctAnswer: maxValue,
            explanationSteps: [
              'asinθ+bcosθ = √(a²+b²)・sin(θ+α) の形に合成する。',
              '√(a²+b²) = √(' + a + '²+' + b + '²) を計算する。',
              'sin(θ+α)の最大値は1なので、全体の最大値は √(a²+b²) ≈ ' + maxValue + '。',
            ],
          };
        `,
        hints: [
          'asinθ+bcosθの形を見たら三角関数の合成を疑おう。',
          '合成後の振幅は√(a²+b²)になる。',
          'sin(θ+α)の値域は-1から1なので、最大値はそのまま振幅の値になる。',
        ],
        keyFormula: 'a・sinθ + b・cosθ = √(a²+b²)・sin(θ+α)',
        commonMistakes: '√(a²+b²)の計算を a+b としてしまうミスが多い。',
      };
    }

    case 'logarithm': {
      const nRange = difficultySpan(difficulty, 1, 6);
      return {
        title: '対数の値を求める',
        unit: '指数関数・対数関数',
        subject: 'math',
        format: 'input',
        variables: {
          n: { min: Math.max(1, nRange.min), max: Math.max(3, nRange.max), step: 1 },
        },
        templateText:
          'log₂{{x}} の値を求めよ。',
        calcLogicJS: `
          const n = vars.n;
          const x = Math.pow(2, n);
          return {
            vars: { n, x },
            correctAnswer: n,
            explanationSteps: [
              'log₂x = n ⇔ x = 2^n という対数の定義を使う。',
              '2を何乗すると ' + x + ' になるかを考える。',
              '2^' + n + ' = ' + x + ' なので log₂' + x + ' = ' + n + '。',
            ],
          };
        `,
        hints: [
          '対数log_a xは「aを何乗するとxになるか」を表す。',
          '与えられた数を2の累乗の形に書き換えてみよう。',
          '2^n=xの形にできれば、答えはnそのもの。',
        ],
        keyFormula: 'log_a x = n ⇔ x = a^n',
        commonMistakes: '底と真数を取り違える、累乗の計算ミスが多い。',
      };
    }

    case 'differentiation': {
      const aRange = difficultySpan(difficulty, 1, 8);
      const tRange = difficultySpan(difficulty, -4, 4);
      return {
        title: '3次関数の導関数の値',
        unit: '微分法（数II）',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(1, aRange.min), max: Math.max(2, aRange.max), step: 1 },
          t: { min: tRange.min, max: tRange.max, step: 1 },
        },
        templateText:
          "関数 f(x) = x^3 - {{a}}x について、f'({{t}}) の値を求めよ。",
        calcLogicJS: `
          const a = vars.a, t = vars.t;
          const derivativeAtT = 3 * t * t - a;
          return {
            vars: { a, t },
            correctAnswer: derivativeAtT,
            explanationSteps: [
              "f(x) = x^3 - " + a + "x を微分すると f'(x) = 3x^2 - " + a + "。",
              "x = " + t + " を代入すると f'(" + t + ") = 3×" + t + "^2 - " + a + " = " + derivativeAtT + "。",
            ],
          };
        `,
        hints: [
          "まずf(x)を項ごとに微分してf'(x)を求めよう（x^nの微分はnx^(n-1)）。",
          "f'(x)が求まったら、指定された値をそのまま代入する。",
          '負の数を代入するときは2乗の計算に注意する。',
        ],
        keyFormula: 'd/dx(x^n) = n・x^(n-1)',
        commonMistakes: '負の数の2乗の符号を間違える、定数項の微分が0になることを忘れるミスが多い。',
      };
    }

    case 'integration': {
      const aRange = difficultySpan(difficulty, 2, 6);
      return {
        title: '定積分と面積（1/6公式）',
        unit: '積分法（数II）',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(2, aRange.min), max: Math.max(4, aRange.max), step: 1 },
        },
        templateText:
          '曲線 y = {{a}}x - x² とx軸で囲まれた部分の面積を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a;
          const area = Math.round((Math.pow(a, 3) / 6) * 100) / 100;
          return {
            vars: { a },
            correctAnswer: area,
            explanationSteps: [
              '曲線と x 軸の交点は y=x(a-x)=0 より x=0, ' + a + '。',
              'S = ∫[0,' + a + '] (' + a + 'x - x²) dx を計算する。',
              '「1/6公式」S=|係数|/6・(交点の差)^3 を使うと S = ' + a + '^3/6 ≈ ' + area + '。',
            ],
          };
        `,
        hints: [
          '曲線とx軸の交点（積分区間の端点）をまず求める。',
          '上に凸の放物線とx軸で囲まれた面積は∫(上-下)dxで計算する。',
          '交点が0とaのときは1/6公式 S=a³/6 が使える。',
        ],
        keyFormula: 'S = |a|/6・(β-α)³',
        commonMistakes: '積分区間の端点を求め間違える、符号のミス（上下を逆にする）が多い。',
      };
    }

    // ============================================================
    // 数B
    // ============================================================
    case 'sequence': {
      const a1Range = difficultySpan(difficulty, -10, 10);
      const nRange = difficultySpan(difficulty, 5, 15);
      return {
        title: '等差数列の一般項と和',
        unit: '数列',
        subject: 'math',
        format: 'input',
        variables: {
          a1: { min: a1Range.min, max: a1Range.max, step: 1 },
          d: { min: 1, max: Math.max(2, Math.round(2 + difficulty / 2)), step: 1 },
          n: { min: Math.max(3, nRange.min), max: Math.max(nRange.min + 3, nRange.max), step: 1 },
        },
        templateText:
          '初項{{a1}}、公差{{d}}の等差数列がある。第{{n}}項 a_n の値を求めよ。',
        calcLogicJS: `
          const a1 = vars.a1, d = vars.d, n = vars.n;
          const an = a1 + (n - 1) * d;
          const sn = n * (a1 + an) / 2;
          return {
            vars: { a1, d, n },
            correctAnswer: an,
            explanationSteps: [
              '等差数列の一般項の公式 a_n = a1 + (n-1)d を使う。',
              'a_n = ' + a1 + ' + (' + n + '-1)×' + d + ' = ' + an,
              '参考: 第1項から第' + n + '項までの和は Sn = n(a1+a_n)/2 = ' + sn + '。',
            ],
          };
        `,
        hints: [
          '等差数列の一般項は a_n = a1 + (n-1)d で求まる。',
          'nに具体的な値を代入する前に、式全体を整理しておくとミスが減る。',
          '和を求める場合は Sn = n(a1+a_n)/2 を使う。',
        ],
        keyFormula: 'a_n = a1 + (n-1)d',
        commonMistakes: '(n-1)の部分をnとしてしまう、d(公差)の符号を見落とすミスが多い。',
      };
    }

    case 'statistics': {
      const nRange = difficultySpan(difficulty, 10, 40);
      return {
        title: '反復試行の期待値（二項分布）',
        unit: '統計的な推測',
        subject: 'math',
        format: 'input',
        variables: {
          n: { min: Math.max(5, nRange.min), max: Math.max(10, nRange.max), step: 1 },
          k: { min: 2, max: 6, step: 1 },
        },
        templateText:
          '1回の試行で事象Aが起こる確率が {{pDisplay}} であるとき、この試行を{{n}}回行う反復試行における、事象Aが起こる回数Xの期待値E[X]を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const n = vars.n, k = vars.k;
          const p = 1 / k;
          const ex = Math.round(n * p * 100) / 100;
          const pDisplay = '1/' + k;
          return {
            vars: { n, pDisplay },
            correctAnswer: ex,
            explanationSteps: [
              '二項分布B(n,p)に従う確率変数Xの期待値はE[X]=npで計算できる。',
              'E[X] = ' + n + ' × ' + pDisplay + ' を計算する。',
              '計算すると E[X] ≈ ' + ex + '。',
            ],
          };
        `,
        hints: [
          '反復試行の回数の期待値は二項分布の期待値公式E[X]=npが使える。',
          'nは試行回数、pは1回あたりの成功確率。',
          '分数のまま計算してから最後に小数に直すとミスが減る。',
        ],
        keyFormula: 'E[X] = np （二項分布B(n,p)の期待値）',
        commonMistakes: '確率pと回数nを取り違える、分散の公式np(1-p)と混同するミスが多い。',
      };
    }

    // ============================================================
    // 数III
    // ============================================================
    case 'limits': {
      const aRange = difficultySpan(difficulty, 2, 6);
      return {
        title: '0/0型の極限',
        unit: '極限',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(2, aRange.min), max: Math.max(4, aRange.max), step: 1 },
        },
        templateText:
          'lim[x→{{a}}] (x²-{{a2}})/(x-{{a}}) の値を求めよ。',
        calcLogicJS: `
          const a = vars.a;
          const a2 = a * a;
          const limitValue = 2 * a;
          return {
            vars: { a, a2 },
            correctAnswer: limitValue,
            explanationSteps: [
              '分子 x²-a² は (x-a)(x+a) と因数分解できる。',
              '(x-a)(x+a)/(x-a) = x+a （x≠aのとき約分できる）。',
              'x→' + a + ' のとき x+a → 2×' + a + ' = ' + limitValue + '。',
            ],
          };
        `,
        hints: [
          '分母が0に近づくので、まず因数分解で約分できないか考える。',
          '分子x²-a²は「2乗の差」の公式で因数分解できる。',
          '約分してから極限の代入をする。',
        ],
        keyFormula: 'x² - a² = (x-a)(x+a)',
        commonMistakes: '約分せずにそのままx=aを代入して0/0のままにしてしまうミスが多い。',
      };
    }

    case 'differentiation_advanced': {
      const aRange = difficultySpan(difficulty, 2, 5);
      const tRange = difficultySpan(difficulty, -3, 3);
      return {
        title: '合成関数の微分（chain rule）',
        unit: '微分法（数III）',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(2, aRange.min), max: Math.max(3, aRange.max), step: 1 },
          b: { min: -4, max: 4, step: 1 },
          t: { min: tRange.min, max: tRange.max, step: 1 },
        },
        templateText:
          "関数 f(x) = ({{a}}x{{bTerm}})² について、導関数 f'({{t}}) の値を求めよ。",
        calcLogicJS: `
          const a = vars.a, b = vars.b, t = vars.t;
          function term(v) { return v >= 0 ? ('+' + v) : String(v); }
          const bTerm = term(b);
          const derivativeAtT = 2 * a * (a * t + b);
          return {
            vars: { a, bTerm, t },
            correctAnswer: derivativeAtT,
            explanationSteps: [
              "合成関数の微分（連鎖律）より f'(x) = 2(ax+b)×a = 2a(ax+b)。",
              "x=" + t + " を代入すると f'(" + t + ") = 2×" + a + "×(" + a + "×" + t + bTerm + ")。",
              '計算すると ' + derivativeAtT + '。',
            ],
          };
        `,
        hints: [
          '外側の関数（2乗）と内側の関数（ax+b）に分けて考える。',
          "{f(g(x))}' = f'(g(x))・g'(x) の連鎖律を使う。",
          '内側の関数の微分（aの部分）を掛け忘れないように。',
        ],
        keyFormula: "{f(g(x))}' = f'(g(x))・g'(x)",
        commonMistakes: '内側の関数の微分（係数a）を掛け忘れるミスが最も多い。',
      };
    }

    case 'integration_advanced': {
      const aRange = difficultySpan(difficulty, 1, 4);
      const tRange = difficultySpan(difficulty, 1, 3);
      return {
        title: '置換積分（定積分）',
        unit: '積分法（数III）',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(1, aRange.min), max: Math.max(2, aRange.max), step: 1 },
          b: { min: 0, max: 3, step: 1 },
          t: { min: Math.max(1, tRange.min), max: Math.max(2, tRange.max), step: 1 },
        },
        templateText:
          '定積分 ∫[0,{{t}}] ({{a}}x+{{b}})² dx の値を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a, b = vars.b, t = vars.t;
          const value = (Math.pow(a*t+b, 3) - Math.pow(b, 3)) / (3 * a);
          const rounded = Math.round(value * 100) / 100;
          return {
            vars: { a, b, t },
            correctAnswer: rounded,
            explanationSteps: [
              'u=' + a + 'x+' + b + ' と置換すると du=' + a + 'dx。',
              '∫u²du/' + a + ' = u³/(3×' + a + ') に置き換えて計算する。',
              '積分区間をuに変換して計算すると ≈ ' + rounded + '。',
            ],
          };
        `,
        hints: [
          '被積分関数が(ax+b)の形をしているので、u=ax+bと置換する。',
          'dx = du/a に置き換えることを忘れずに。',
          '積分区間もxからuの範囲に変換してから計算する。',
        ],
        keyFormula: '∫f(g(x))g\'(x)dx = ∫f(u)du （u=g(x)）',
        commonMistakes: 'dxをduに変換する際に係数aで割るのを忘れるミスが多い。',
      };
    }

    case 'parametric': {
      const tRange = difficultySpan(difficulty, 1, 4);
      return {
        title: '媒介変数表示の曲線の接線の傾き',
        unit: '曲線の媒介変数表示・極座標',
        subject: 'math',
        format: 'input',
        variables: {
          t: { min: Math.max(1, tRange.min), max: Math.max(2, tRange.max), step: 1 },
        },
        templateText:
          '媒介変数 x=t², y=2t で表される曲線上の t={{t}} における点での接線の傾き dy/dx の値を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const t = vars.t === 0 ? 1 : vars.t;
          const dydx = Math.round((1 / t) * 100) / 100;
          return {
            vars: { t },
            correctAnswer: dydx,
            explanationSteps: [
              'dx/dt = 2t、dy/dt = 2 をそれぞれ計算する。',
              'dy/dx = (dy/dt)/(dx/dt) = 2/(2t) = 1/t を使う。',
              't=' + t + ' を代入すると dy/dx = 1/' + t + ' ≈ ' + dydx + '。',
            ],
          };
        `,
        hints: [
          '媒介変数表示の微分は dy/dx=(dy/dt)/(dx/dt) を使う。',
          'x, yをそれぞれtで微分してから比を取る。',
          '最後にtの値を代入する。',
        ],
        keyFormula: 'dy/dx = (dy/dt) / (dx/dt)',
        commonMistakes: 'dy/dtとdx/dtの比を逆にしてしまうミスが多い。',
      };
    }

    // ============================================================
    // 数C
    // ============================================================
    case 'vector': {
      const range = difficultySpan(difficulty, -5, 5);
      return {
        title: 'ベクトルの内積となす角',
        unit: 'ベクトル',
        subject: 'math',
        format: 'input',
        variables: {
          x1: { min: range.min, max: range.max, step: 1 },
          y1: { min: range.min, max: range.max, step: 1 },
          x2: { min: range.min, max: range.max, step: 1 },
          y2: { min: range.min, max: range.max, step: 1 },
        },
        templateText:
          '2つのベクトル a=({{x1}}, {{y1}}), b=({{x2}}, {{y2}}) の内積 a・b の値を求めよ。',
        calcLogicJS: `
          const x1 = vars.x1 || 1, y1 = vars.y1 || 1, x2 = vars.x2 || 1, y2 = vars.y2 || 1;
          const dot = x1*x2 + y1*y2;
          const norm1 = Math.sqrt(x1*x1 + y1*y1) || 1;
          const norm2 = Math.sqrt(x2*x2 + y2*y2) || 1;
          const cosTheta = Math.max(-1, Math.min(1, dot / (norm1 * norm2)));
          const angleDeg = Math.round((Math.acos(cosTheta) * 180 / Math.PI) * 10) / 10;
          return {
            vars: { x1, y1, x2, y2 },
            correctAnswer: dot,
            explanationSteps: [
              '内積は a・b = x1*x2 + y1*y2 で成分から直接計算できる。',
              'a・b = ' + x1 + '×' + x2 + ' + ' + y1 + '×' + y2 + ' = ' + dot,
              '参考: このときのなす角は約 ' + angleDeg + '° になる（cosθ = a・b / (|a||b|) より）。',
            ],
          };
        `,
        hints: [
          '内積は成分ごとの積の和 a・b = x1x2 + y1y2 で計算できる。',
          '大きさ|a|, |b|が必要な場合は√(x^2+y^2)で求める。',
          'なす角を求める場合は cosθ = a・b / (|a||b|) を使う。',
        ],
        keyFormula: 'a・b = |a||b|cosθ = x1x2 + y1y2',
        commonMistakes: '成分の掛け合わせを間違えて足す組み合わせを誤る（x1y2など）ミスが多い。',
      };
    }

    case 'complex_plane': {
      const range = difficultySpan(difficulty, -6, 6);
      return {
        title: '複素数の絶対値',
        unit: '複素数平面・2次曲線',
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: range.min === 0 ? 1 : range.min, max: range.max, step: 1 },
          b: { min: range.min === 0 ? 1 : range.min, max: range.max, step: 1 },
        },
        templateText:
          '複素数 z = {{a}} + {{b}}i の絶対値|z|を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a === 0 ? 1 : vars.a, b = vars.b === 0 ? 1 : vars.b;
          const modulus = Math.round(Math.sqrt(a*a + b*b) * 100) / 100;
          return {
            vars: { a, b },
            correctAnswer: modulus,
            explanationSteps: [
              '複素数z=a+biは複素数平面上の点(a,b)とみなせる。',
              '原点からの距離を三平方の定理で計算する: |z|=√(a²+b²)。',
              '|z| = √(' + a + '²+' + b + '²) ≈ ' + modulus + '。',
            ],
          };
        `,
        hints: [
          '複素数z=a+biの絶対値は複素数平面上の原点からの距離に対応する。',
          '三平方の定理と同じ形 |z|=√(a²+b²) を使う。',
          '実部と虚部の符号は2乗するので気にしなくてよい。',
        ],
        keyFormula: '|z| = √(a²+b²) （z=a+bi）',
        commonMistakes: '虚部の符号を先に気にしてしまう、実部と虚部を取り違えるミスが多い。',
      };
    }

    // ============================================================
    // 物理
    // ============================================================
    case 'mechanics': {
      const v0Range = difficultySpan(difficulty, 10, 30);
      const tRange = difficultySpan(difficulty, 1, 3);
      return {
        title: '投げ上げ運動の速度',
        unit: '力学',
        subject: 'physics',
        format: 'input',
        variables: {
          v0: { min: Math.max(5, v0Range.min), max: Math.max(15, v0Range.max), step: 1 },
          t: { min: Math.max(1, tRange.min), max: Math.max(2, tRange.max), step: 1 },
        },
        templateText:
          '初速度{{v0}}m/sで真上に投げ上げた物体の、{{t}}秒後の速度[m/s]を求めよ（重力加速度9.8m/s²、上向きを正とする。小数第1位まで）。',
        calcLogicJS: `
          const v0 = vars.v0, t = vars.t;
          const v = Math.round((v0 - 9.8 * t) * 10) / 10;
          return {
            vars: { v0, t },
            correctAnswer: v,
            explanationSteps: [
              '上向きを正とすると、重力による加速度は-9.8m/s²。',
              'v = v0 - 9.8t = ' + v0 + ' - 9.8×' + t + ' = ' + v + ' m/s。',
              '値が負になった場合は、その時刻には物体が下向きに運動していることを意味する。',
            ],
          };
        `,
        hints: [
          '等加速度運動の式 v = v0 + at を使う。',
          '上向きを正とすると、重力加速度は-9.8m/s²になる。',
          '計算結果が負になっても構わない（下向きに運動している状態）。',
        ],
        keyFormula: 'v = v0 + at',
        commonMistakes: '重力加速度の符号を正のまま使ってしまうミスが最頻出。',
      };
    }

    case 'gas_law_physics': {
      const pRange = difficultySpan(difficulty, 1, 4);
      const vRange = difficultySpan(difficulty, 3, 10);
      return {
        title: '理想気体の状態方程式',
        unit: '熱力学',
        subject: 'physics',
        format: 'input',
        variables: {
          p: { min: Math.max(1, pRange.min), max: Math.max(2, pRange.max), step: 1 },
          v: { min: Math.max(2, vRange.min), max: Math.max(5, vRange.max), step: 1 },
          t: { min: 260, max: 320, step: 10 },
        },
        templateText:
          '圧力{{p}}atm、体積{{v}}L、温度{{t}}Kの理想気体の物質量n[mol]を求めよ（気体定数R=0.082 atm・L/(mol・K)とする。小数第2位まで）。',
        calcLogicJS: `
          const p = vars.p, v = vars.v, t = vars.t;
          const R = 0.082;
          const n = Math.round((p * v / (R * t)) * 100) / 100;
          return {
            vars: { p, v, t },
            correctAnswer: n,
            explanationSteps: [
              '状態方程式 PV=nRT をnについて解くと n=PV/(RT)。',
              'n = ' + p + '×' + v + ' / (0.082×' + t + ') を計算する。',
              '計算すると n ≈ ' + n + ' mol。',
            ],
          };
        `,
        hints: [
          '気体の状態方程式PV=nRTを、求めたい量について解く。',
          '単位（atm, L, K）をそろえてから代入する。',
          '気体定数Rの値を正しく使う。',
        ],
        keyFormula: 'PV = nRT',
        commonMistakes: '単位の変換忘れ（℃のままTに使う等）、Rの値の桁を間違えるミスが多い。',
      };
    }

    case 'wave_speed': {
      const fRange = difficultySpan(difficulty, 100, 500);
      const lambdaRange = difficultySpan(difficulty, 1, 4);
      return {
        title: '波の基本式（v=fλ）',
        unit: '波動',
        subject: 'physics',
        format: 'input',
        variables: {
          f: { min: Math.max(50, fRange.min), max: Math.max(200, fRange.max), step: 10 },
          lambda: { min: Math.max(1, lambdaRange.min), max: Math.max(2, lambdaRange.max), step: 1 },
        },
        templateText:
          '振動数{{f}}Hz、波長{{lambda}}mの波が伝わる速さv[m/s]を求めよ。',
        calcLogicJS: `
          const f = vars.f, lambda = vars.lambda;
          const v = f * lambda;
          return {
            vars: { f, lambda },
            correctAnswer: v,
            explanationSteps: [
              '波の基本式 v=fλ を使う。',
              'v = ' + f + ' × ' + lambda + ' を計算する。',
              '計算すると v = ' + v + ' m/s。',
            ],
          };
        `,
        hints: [
          '波の速さ・振動数・波長の関係 v=fλ を使う。',
          '振動数fは1秒間の振動回数、波長λは1つの波の長さ。',
          '単位（Hz, m）を確認してから掛け算する。',
        ],
        keyFormula: 'v = fλ',
        commonMistakes: '振動数と周期（f=1/T）を混同してしまうミスが多い。',
      };
    }

    case 'ohms_law': {
      const r1Range = difficultySpan(difficulty, 5, 20);
      const r2Range = difficultySpan(difficulty, 5, 20);
      return {
        title: 'オームの法則と直列抵抗',
        unit: '電磁気',
        subject: 'physics',
        format: 'input',
        variables: {
          r1: { min: Math.max(2, r1Range.min), max: Math.max(10, r1Range.max), step: 1 },
          r2: { min: Math.max(2, r2Range.min), max: Math.max(10, r2Range.max), step: 1 },
          v: { min: 3, max: 20, step: 1 },
        },
        templateText:
          '抵抗{{r1}}Ωと{{r2}}Ωを直列に接続し、{{v}}Vの電圧をかけた。回路に流れる電流I[A]を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const r1 = vars.r1, r2 = vars.r2, v = vars.v;
          const current = Math.round((v / (r1 + r2)) * 100) / 100;
          return {
            vars: { r1, r2, v },
            correctAnswer: current,
            explanationSteps: [
              '直列接続なので合成抵抗はR=R1+R2 = ' + r1 + '+' + r2 + ' = ' + (r1+r2) + 'Ω。',
              'オームの法則 V=IR を I について解くと I=V/R。',
              'I = ' + v + ' / ' + (r1+r2) + ' ≈ ' + current + ' A。',
            ],
          };
        `,
        hints: [
          'まず直列抵抗の合成抵抗R=R1+R2を計算する。',
          'オームの法則V=IRを電流Iについて解く。',
          '合成抵抗と電圧を代入して電流を求める。',
        ],
        keyFormula: 'V = IR',
        commonMistakes: '直列と並列の合成抵抗の公式を混同してしまうミスが多い。',
      };
    }

    case 'half_life': {
      const halfLifeRange = difficultySpan(difficulty, 5, 20);
      return {
        title: '放射性崩壊と半減期',
        unit: '原子',
        subject: 'physics',
        format: 'input',
        variables: {
          halfLife: { min: Math.max(2, halfLifeRange.min), max: Math.max(10, halfLifeRange.max), step: 1 },
          n0: { min: 40, max: 200, step: 10 },
          k: { min: 1, max: 3, step: 1 },
        },
        templateText:
          '半減期{{halfLife}}年の放射性同位体が初め{{n0}}gあった。{{elapsed}}年後に残っている質量[g]を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const halfLife = vars.halfLife, n0 = vars.n0, k = vars.k;
          const elapsed = halfLife * k;
          const remaining = Math.round(n0 * Math.pow(0.5, k) * 100) / 100;
          return {
            vars: { halfLife, n0, elapsed },
            correctAnswer: remaining,
            explanationSteps: [
              '経過時間' + elapsed + '年は半減期' + halfLife + '年の' + k + '回分に当たる。',
              '半減期ごとに質量は半分になるので N=N0×(1/2)^' + k + '。',
              'N = ' + n0 + ' × (1/2)^' + k + ' ≈ ' + remaining + ' g。',
            ],
          };
        `,
        hints: [
          '経過時間が半減期の何倍かをまず計算する。',
          '半減期を1回経過するごとに質量は半分になる。',
          'N=N0×(1/2)^(t/T) の公式に当てはめる。',
        ],
        keyFormula: 'N = N0×(1/2)^(t/T)',
        commonMistakes: '経過時間をそのまま指数に使ってしまう（半減期で割るのを忘れる）ミスが多い。',
      };
    }

    // ============================================================
    // 化学
    // ============================================================
    case 'gas_law': {
      return {
        title: 'ボイル・シャルルの法則',
        unit: '物質の変化（理論化学）',
        subject: 'chemistry',
        format: 'input',
        variables: {
          p1: { min: 1, max: 5, step: 1 },
          v1: { min: 2, max: 10, step: 1 },
          t1: { min: 250, max: 320, step: 10 },
          v2: { min: 2, max: 10, step: 1 },
          t2: { min: 250, max: 350, step: 10 },
        },
        templateText:
          '圧力{{p1}}atm、体積{{v1}}L、温度{{t1}}Kの気体を、体積{{v2}}L、温度{{t2}}Kに変化させた。このときの圧力P2[atm]を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const p1 = vars.p1, v1 = vars.v1, t1 = vars.t1, v2 = vars.v2, t2 = vars.t2;
          const p2 = Math.round(((p1 * v1 * t2) / (t1 * v2)) * 100) / 100;
          return {
            vars: { p1, v1, t1, v2, t2 },
            correctAnswer: p2,
            explanationSteps: [
              'ボイル・シャルルの法則 P1V1/T1 = P2V2/T2 を使う。',
              'P2 = P1V1T2 / (T1V2) = (' + p1 + '×' + v1 + '×' + t2 + ') / (' + t1 + '×' + v2 + ')',
              '計算すると P2 ≈ ' + p2 + ' atm となる。',
            ],
          };
        `,
        hints: [
          '一定量の気体では P1V1/T1 = P2V2/T2 が成り立つ。',
          '温度は必ず絶対温度K（℃+273）で計算する。',
          '式を P2 について解いてから数値を代入する。',
        ],
        keyFormula: 'P1V1/T1 = P2V2/T2',
        commonMistakes: '℃のまま計算してしまう、比の取り方（分子分母）を逆にしてしまうミスが多い。',
      };
    }

    case 'mole_calculation': {
      return {
        title: `${unitTitle}: 物質量(mol)の計算`,
        unit: unitTitle,
        subject: 'chemistry',
        format: 'input',
        variables: {
          mass: { min: 4, max: 40, step: 2 },
          molarMass: { min: 10, max: 60, step: 2 },
        },
        templateText: `質量{{mass}}gの物質（モル質量{{molarMass}}g/mol）の物質量[mol]を求めよ（小数第2位まで）。`,
        calcLogicJS: `
          const mass = vars.mass, molarMass = vars.molarMass;
          const mol = Math.round((mass / molarMass) * 100) / 100;
          return {
            vars: { mass, molarMass },
            correctAnswer: mol,
            explanationSteps: [
              '物質量 n[mol] = 質量w[g] / モル質量M[g/mol] の関係を使う。',
              'n = ' + mass + ' / ' + molarMass + ' = ' + mol + ' mol。',
            ],
          };
        `,
        hints: [
          '物質量n(mol) = 質量w(g) / モル質量M(g/mol) の関係式を使う。',
          '与えられた数値をそのまま代入する。',
          '割り算の結果を四捨五入して整える。',
        ],
        keyFormula: 'n(mol) = w(g) / M(g/mol)',
        commonMistakes: '質量とモル質量を逆に代入してしまうミスに注意。',
      };
    }

    case 'neutralization': {
      const c1Range = difficultySpan(difficulty, 0.1, 2);
      return {
        title: '中和滴定の量的関係',
        unit: '酸と塩基・中和',
        subject: 'chemistry',
        format: 'input',
        variables: {
          c1x100: { min: Math.round(Math.max(10, c1Range.min * 100)), max: Math.round(Math.max(50, c1Range.max * 100)), step: 10 },
          v1: { min: 10, max: 50, step: 5 },
          c2x100: { min: 10, max: 50, step: 10 },
        },
        templateText:
          '{{c1}}mol/Lの塩酸{{v1}}mLを中和するのに必要な{{c2}}mol/Lの水酸化ナトリウム水溶液の体積[mL]を求めよ（小数第1位まで）。',
        calcLogicJS: `
          const c1 = vars.c1x100 / 100, v1 = vars.v1, c2 = vars.c2x100 / 100;
          const v2 = Math.round((c1 * v1 / c2) * 10) / 10;
          return {
            vars: { c1, v1, c2 },
            correctAnswer: v2,
            explanationSteps: [
              '塩酸・水酸化ナトリウムはともに1価なので c1v1 = c2v2 が成り立つ。',
              'v2 = c1v1/c2 = ' + c1 + '×' + v1 + ' / ' + c2 + ' を計算する。',
              '計算すると v2 ≈ ' + v2 + ' mL。',
            ],
          };
        `,
        hints: [
          '中和では、酸が出すH+の物質量と塩基が出すOH-の物質量が等しくなる。',
          '1価の酸・塩基なら c1v1 = c2v2 の関係が使える。',
          '体積の単位(mL)はそのまま比の計算に使ってよい（両辺で同じ単位なら約分される）。',
        ],
        keyFormula: 'c1v1n1 = c2v2n2 （nは価数）',
        commonMistakes: '価数（2価の酸・塩基）を考慮し忘れるミスが多い。',
      };
    }

    case 'redox': {
      const n1Range = difficultySpan(difficulty, 0.1, 1);
      return {
        title: '酸化還元反応の電子moleq',
        unit: '酸化還元反応',
        subject: 'chemistry',
        format: 'input',
        variables: {
          n1x100: { min: Math.round(Math.max(10, n1Range.min * 100)), max: Math.round(Math.max(50, n1Range.max * 100)), step: 10 },
          e1: { min: 1, max: 5, step: 1 },
          e2: { min: 1, max: 3, step: 1 },
        },
        templateText:
          '電子{{e1}}個を受け取る酸化剤{{n1}}molと過不足なく反応する、電子{{e2}}個を放出する還元剤の物質量[mol]を求めよ（小数第2位まで）。',
        calcLogicJS: `
          const n1 = vars.n1x100 / 100, e1 = vars.e1, e2 = vars.e2;
          const n2 = Math.round((n1 * e1 / e2) * 100) / 100;
          return {
            vars: { n1, e1, e2 },
            correctAnswer: n2,
            explanationSteps: [
              '酸化剤が受け取る電子の総量と、還元剤が放出する電子の総量は等しい。',
              'n1×e1 = n2×e2 より n2 = n1e1/e2 = ' + n1 + '×' + e1 + '/' + e2 + '。',
              '計算すると n2 ≈ ' + n2 + ' mol。',
            ],
          };
        `,
        hints: [
          '酸化還元反応では、やり取りされる電子の総数が酸化剤側と還元剤側で等しくなる。',
          '(酸化剤のmol)×(電子の数) = (還元剤のmol)×(電子の数) の関係を使う。',
          '式をn2について解いてから数値を代入する。',
        ],
        keyFormula: '(酸化剤のmol)×(受け取る電子数) = (還元剤のmol)×(放出する電子数)',
        commonMistakes: '電子の数（価数変化）を反応式から正しく読み取れないミスが多い。',
      };
    }

    case 'equilibrium': {
      return {
        title: '化学平衡の平衡定数',
        unit: '化学平衡',
        subject: 'chemistry',
        format: 'input',
        variables: {
          a: { min: 1, max: 4, step: 1 },
          b: { min: 1, max: 4, step: 1 },
          c: { min: 1, max: 4, step: 1 },
          d: { min: 1, max: 4, step: 1 },
        },
        templateText:
          '反応 A+B⇌C+D が平衡状態にあり、[A]={{a}}mol/L, [B]={{b}}mol/L, [C]={{c}}mol/L, [D]={{d}}mol/L であった。この反応の平衡定数Kを求めよ（小数第2位まで）。',
        calcLogicJS: `
          const a = vars.a, b = vars.b, c = vars.c, d = vars.d;
          const k = Math.round(((c * d) / (a * b)) * 100) / 100;
          return {
            vars: { a, b, c, d },
            correctAnswer: k,
            explanationSteps: [
              '平衡定数の定義 K=[C][D]/([A][B]) を使う。',
              'K = (' + c + '×' + d + ') / (' + a + '×' + b + ') を計算する。',
              '計算すると K ≈ ' + k + '。',
            ],
          };
        `,
        hints: [
          '平衡定数は「生成物の濃度の積／反応物の濃度の積」で計算する。',
          '反応式の係数がすべて1なので、そのまま各濃度を代入すればよい。',
          '単位はmol/Lのまま代入してよい。',
        ],
        keyFormula: 'K = [C][D] / ([A][B])',
        commonMistakes: '分子・分母（生成物と反応物）を逆にしてしまうミスが多い。',
      };
    }

    case 'inorganic_stoichiometry': {
      const massRange = difficultySpan(difficulty, 5, 30);
      return {
        title: '気体発生反応の量的関係',
        unit: '無機化学',
        subject: 'chemistry',
        format: 'input',
        variables: {
          mass: { min: Math.max(2, massRange.min), max: Math.max(10, massRange.max), step: 1 },
        },
        templateText:
          '炭酸カルシウム{{mass}}gに十分な量の塩酸を加えたとき発生する二酸化炭素の、標準状態における体積[L]を求めよ（CaCO3のモル質量は100g/mol、標準状態で気体1molは22.4Lとする。小数第2位まで）。',
        calcLogicJS: `
          const mass = vars.mass;
          const molCaCO3 = mass / 100;
          const volume = Math.round(molCaCO3 * 22.4 * 100) / 100;
          return {
            vars: { mass },
            correctAnswer: volume,
            explanationSteps: [
              'CaCO3 + 2HCl → CaCl2 + H2O + CO2 の反応式より、CaCO3とCO2は1:1で反応する。',
              'CaCO3の物質量 = ' + mass + '/100 = ' + molCaCO3 + ' mol なので、生成するCO2も同じ物質量。',
              '標準状態の気体の体積 = mol×22.4L を計算すると ≈ ' + volume + ' L。',
            ],
          };
        `,
        hints: [
          'まず化学反応式の係数比から、CaCO3とCO2の物質量の関係をつかむ。',
          'CaCO3の質量から物質量(mol)を求める。',
          '標準状態の気体はn(mol)×22.4Lで体積に変換できる。',
        ],
        keyFormula: 'V(L) = n(mol) × 22.4(L/mol) （標準状態）',
        commonMistakes: '反応式の係数比を確認せずに1:1で計算してしまう（この反応はたまたま1:1だが一般には要確認）ミスが多い。',
      };
    }

    case 'organic_ihd': {
      return {
        title: '不飽和度（水素不足度）',
        unit: '有機化学',
        subject: 'chemistry',
        format: 'input',
        variables: {
          c: { min: 3, max: 8, step: 1 },
          hHalf: { min: 1, max: 4, step: 1 },
        },
        templateText:
          '分子式 C{{c}}H{{h}} で表される炭化水素の不飽和度（水素不足度）を求めよ。',
        calcLogicJS: `
          const c = vars.c;
          const maxH = 2 * c + 2;
          const h = Math.max(2, maxH - vars.hHalf * 2);
          const ihd = (2 * c + 2 - h) / 2;
          return {
            vars: { c, h },
            correctAnswer: ihd,
            explanationSteps: [
              '炭素数Cの飽和炭化水素（アルカン）はC_nH_(2n+2)、今回は水素が' + maxH + '個が基準になる。',
              '不飽和度 IHD = (2C+2-H)/2 = (' + maxH + '-' + h + ')/2 を計算する。',
              '計算すると不飽和度は ' + ihd + '（二重結合・環の数の合計）。',
            ],
          };
        `,
        hints: [
          '炭素数Cの飽和アルカンの水素数は2C+2個になることを基準にする。',
          '実際の水素数との差を2で割ると、二重結合や環の数（不飽和度）が分かる。',
          '三重結合は不飽和度2分に相当することも覚えておこう。',
        ],
        keyFormula: 'IHD = (2C+2-H) / 2',
        commonMistakes: '飽和炭化水素の水素数の基準(2C+2)を間違えるミスが多い。',
      };
    }

    case 'polymer': {
      const monomerRange = difficultySpan(difficulty, 26, 104);
      return {
        title: '高分子化合物の平均重合度',
        unit: '高分子化合物',
        subject: 'chemistry',
        format: 'input',
        variables: {
          monomerMw: { min: Math.max(26, monomerRange.min), max: Math.max(60, monomerRange.max), step: 2 },
          n0: { min: 500, max: 3000, step: 100 },
        },
        templateText:
          '分子量{{monomerMw}}の単量体が重合してできた、平均分子量{{polymerMw}}の高分子化合物の平均重合度nを求めよ（小数第1位まで）。',
        calcLogicJS: `
          const monomerMw = vars.monomerMw, n0 = vars.n0;
          const polymerMw = monomerMw * n0;
          const n = Math.round((polymerMw / monomerMw) * 10) / 10;
          return {
            vars: { monomerMw, polymerMw },
            correctAnswer: n,
            explanationSteps: [
              '高分子は単量体がn個つながってできているので M高分子 ≈ n×M単量体。',
              'n = M高分子/M単量体 = ' + polymerMw + '/' + monomerMw + ' を計算する。',
              '計算すると平均重合度は n ≈ ' + n + '。',
            ],
          };
        `,
        hints: [
          '高分子の分子量は、単量体の分子量のおよそn倍になる。',
          '重合度n = 高分子の平均分子量 / 単量体の分子量。',
          '割り算するだけなので、単位を揃えて代入する。',
        ],
        keyFormula: 'n = M(高分子) / M(単量体)',
        commonMistakes: '高分子の分子量と単量体の分子量を逆に割ってしまうミスが多い。',
      };
    }

    // ============================================================
    // フォールバック（未知のunitIdでも本物の公式を使う安全網）
    // ============================================================
    case 'generic_physics': {
      const v0Range = difficultySpan(difficulty, 5, 20);
      const tRange = difficultySpan(difficulty, 2, 8);
      return {
        title: `${unitTitle}: 等速直線運動`,
        unit: unitTitle,
        subject: 'physics',
        format: 'input',
        variables: {
          v: { min: Math.max(2, v0Range.min), max: Math.max(10, v0Range.max), step: 1 },
          t: { min: Math.max(1, tRange.min), max: Math.max(3, tRange.max), step: 1 },
        },
        templateText: `速さ{{v}}m/sで等速直線運動する物体が、{{t}}秒間に進む距離[m]を求めよ。`,
        calcLogicJS: `
          const v = vars.v, t = vars.t;
          const distance = v * t;
          return {
            vars: { v, t },
            correctAnswer: distance,
            explanationSteps: [
              '等速直線運動の基本式 x=vt を使う。',
              'x = ' + v + ' × ' + t + ' を計算する。',
              '計算すると x = ' + distance + ' m。',
            ],
          };
        `,
        hints: [
          '速さが一定なら、進んだ距離は「速さ×時間」で計算できる。',
          '単位(m/s, 秒)を確認してから掛け算する。',
          '答えの単位はmになる。',
        ],
        keyFormula: 'x = vt',
        commonMistakes: '速さと時間の単位を揃え忘れるミスに注意。',
      };
    }

    case 'generic_chemistry':
      return buildBlueprint('mole_calculation', difficulty, unitTitle);

    case 'generic_math':
    default: {
      const range = difficultySpan(difficulty, -5, 5);
      return {
        title: `${unitTitle}: 2次方程式の解の公式`,
        unit: unitTitle,
        subject: 'math',
        format: 'input',
        variables: {
          b: { min: range.min === 0 ? 1 : range.min, max: range.max, step: 1 },
          c: { min: -6, max: 6, step: 1 },
        },
        templateText: `2次方程式 x² + {{bTerm}}x + {{cTerm}} = 0 の解のうち、大きい方の値を求めよ（小数第2位まで）。`,
        calcLogicJS: `
          const b = vars.b === 0 ? 2 : vars.b, c = vars.c;
          function term(v) { return v >= 0 ? ('+' + v) : String(v); }
          const bTerm = term(b), cTerm = term(c);
          const discriminant = b*b - 4*c;
          const safeD = Math.max(0, discriminant);
          const larger = Math.round(((-b + Math.sqrt(safeD)) / 2) * 100) / 100;
          return {
            vars: { bTerm, cTerm },
            correctAnswer: larger,
            explanationSteps: [
              '解の公式 x=(-b±√(b²-4ac))/2a （a=1）を使う。',
              '判別式 D=b²-4c を計算してから平方根を取る。',
              '大きい方の解 x=(-b+√D)/2 ≈ ' + larger + '。',
            ],
          };
        `,
        hints: [
          '2次方程式の解の公式 x=(-b±√(b²-4ac))/2a を使う（今回はa=1）。',
          '判別式D=b²-4acを先に計算しておくとミスが減る。',
          '±の2つの解のうち、大きい方（+の方）を答える。',
        ],
        keyFormula: 'x = (-b ± √(b²-4ac)) / 2a',
        commonMistakes: '符号のミス、2aで割るのを忘れるミスが多い。',
      };
    }
  }
}

export interface GenerateMockProblemParams {
  unitId?: string;
  patternId?: string;
  difficulty?: number;
}

export function generateMockProblem({
  unitId,
  patternId,
  difficulty,
}: GenerateMockProblemParams): GeneratedProblem {
  let resolvedUnitId = unitId;
  let resolvedDifficulty = difficulty;

  if (patternId) {
    const pattern = SOLUTION_PATTERNS.find((candidate) => candidate.id === patternId);
    if (pattern) {
      resolvedUnitId = resolvedUnitId ?? pattern.unitId;
      resolvedDifficulty =
        resolvedDifficulty ?? (pattern.level === 'basic' ? 2 : pattern.level === 'standard' ? 5 : 8);
    }
  }

  const unit = resolvedUnitId ? getUnitById(resolvedUnitId) : undefined;
  const subject: Subject = unit?.subject ?? 'math';
  const finalDifficulty = clampDifficulty(resolvedDifficulty ?? 5);

  const patternKey: PatternKey =
    (resolvedUnitId ? UNIT_ID_PATTERN_MAP[resolvedUnitId] : undefined) ?? genericKeyForSubject(subject);

  const unitTitle = unit?.title ?? '数学';
  const primary = buildBlueprint(patternKey, finalDifficulty, unitTitle);
  // 同じ単元でも毎回シード抽選。図鑑の patternId 指定時も数値は localRegenerator で変わる。
  const extras = getExtraBlueprints(resolvedUnitId, finalDifficulty, unitTitle);
  // 図鑑から patternId 指定時は主テンプレートを維持。単元指定のみのときは複数パターンから抽選。
  const pool = patternId ? [primary] : [primary, ...extras];
  const seed = createVariantSeed();
  const blueprint = pickBlueprint(pool, seed);

  const base: GeneratedProblem = {
    id: `mock-${patternKey}-${seed}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    patternId: patternId ?? resolvedUnitId,
    subject: blueprint.subject,
    unit: blueprint.unit,
    title: blueprint.title,
    difficulty: finalDifficulty,
    format: blueprint.format,
    questionText: blueprint.templateText,
    visualType: 'none',
    visualConfig: { type: 'none', params: {} },
    correctAnswer: '',
    hints: blueprint.hints,
    explanation: {
      stepByStep: [],
      keyFormula: blueprint.keyFormula,
      commonMistakes: blueprint.commonMistakes,
    },
    templateConfig: {
      variables: blueprint.variables,
      templateText: blueprint.templateText,
      calcLogicJS: blueprint.calcLogicJS,
    },
  };

  return regenerateProblemLocally(base);
}

// ==========================================
// Apex Suite: Math Lab - Mock Problem Generator
// ==========================================
// `OPENAI_API_KEY` が未設定の場合の高品質フォールバック問題生成。
// `unitId` / `patternId` に応じて専用テンプレートを撃ち分け、`difficulty`(1-10)
// に応じて数値の範囲や複雑さをスケールさせる。
// 生成された問題は `templateConfig` を持ち、`regenerateProblemLocally` で
// 「数字を変えて再生成（APIコスト0）」が可能。
//
// NOTE: KaTeXでの二重エスケープ地雷を避けるため、このファイルのテンプレートは
// バックスラッシュ系LaTeXコマンド（\sin, \frac 等）を使わず、Unicode数学記号
// （θ, π, °, ², √, ・ 等）とASCII表記（^, /, ()）のみで数式を表現する。

import type { GeneratedProblem, ProblemFormat, Subject } from '@/types/mathLab';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { getUnitById } from '@/data/unitsData';
import { SOLUTION_PATTERNS } from '@/data/patternsData';
import { clampDifficulty } from '@/lib/engine/adaptiveEngine';

export type PatternKey =
  | 'quadratic'
  | 'trigonometry'
  | 'vector'
  | 'gas_law'
  | 'sequence'
  | 'differentiation'
  | 'mechanics'
  | 'combinatorics'
  | 'numbers'
  | 'data_analysis'
  | 'generic_math'
  | 'generic_physics'
  | 'generic_chemistry';

const UNIT_ID_PATTERN_MAP: Partial<Record<string, PatternKey>> = {
  'math-1a-quadratic-functions': 'quadratic',
  'math-1a-trigonometric-ratios': 'trigonometry',
  'math-2bc-vectors': 'vector',
  'chemistry-reactions': 'gas_law',
  'math-2bc-sequences': 'sequence',
  'math-2bc-differentiation': 'differentiation',
  'physics-mechanics': 'mechanics',
  'math-1a-combinatorics-probability': 'combinatorics',
  'math-1a-numbers-and-expressions': 'numbers',
  'math-1a-data-analysis': 'data_analysis',
};

function genericKeyForSubject(subject: Subject): PatternKey {
  if (subject === 'physics') return 'generic_physics';
  if (subject === 'chemistry') return 'generic_chemistry';
  return 'generic_math';
}

interface TemplateBlueprint {
  title: string;
  unit: string;
  subject: Subject;
  format: ProblemFormat;
  variables: Record<string, { min: number; max: number; step: number }>;
  templateText: string;
  calcLogicJS: string;
  hints: [string, string, string];
  keyFormula: string;
  commonMistakes: string;
}

/** 難易度(1-10)を3段階の緩やかなスケール係数に変換する（1→0.6倍 〜 10→1.6倍） */
function difficultySpan(difficulty: number, baseMin: number, baseMax: number): { min: number; max: number } {
  const factor = 0.6 + (clampDifficulty(difficulty) - 1) * (1.0 / 9);
  const center = (baseMin + baseMax) / 2;
  const halfSpan = ((baseMax - baseMin) / 2) * factor;
  return { min: Math.round(center - halfSpan), max: Math.round(center + halfSpan) };
}

function buildBlueprint(patternKey: PatternKey, difficulty: number, unitTitle: string): TemplateBlueprint {
  switch (patternKey) {
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
            vars: { poly },
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
          num: { min: Math.max(-6, numRange.min), max: Math.min(6, Math.max(numRange.max, numRange.min + 1)), step: 1 },
        },
        templateText:
          'sinθ + cosθ = {{kDisplay}} のとき、sinθ・cosθ の値を求めよ。',
        calcLogicJS: `
          const num = vars.num === 0 ? 1 : vars.num;
          const den = 3;
          const kDisplay = num + '/' + den;
          const result = Math.round(((num*num - den*den) / (2*den*den)) * 10000) / 10000;
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
          '関数 f(x) = x^3 - {{a}}x について、f\'({{t}}) の値を求めよ。',
        calcLogicJS: `
          const a = vars.a, t = vars.t;
          const derivativeAtT = 3 * t * t - a;
          return {
            vars: { a, t },
            correctAnswer: derivativeAtT,
            explanationSteps: [
              'f(x) = x^3 - ' + a + 'x を微分すると f\\'(x) = 3x^2 - ' + a + '。',
              'x = ' + t + ' を代入すると f\\'(' + t + ') = 3×' + t + '^2 - ' + a + ' = ' + derivativeAtT + '。',
            ],
          };
        `,
        hints: [
          'まずf(x)を項ごとに微分してf\'(x)を求めよう（x^nの微分はnx^(n-1)）。',
          'f\'(x)が求まったら、指定された値をそのまま代入する。',
          '負の数を代入するときは2乗の計算に注意する。',
        ],
        keyFormula: "d/dx(x^n) = n・x^(n-1)",
        commonMistakes: '負の数の2乗の符号を間違える、定数項の微分が0になることを忘れるミスが多い。',
      };
    }

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

    case 'generic_physics': {
      const v0Range = difficultySpan(difficulty, 5, 20);
      return {
        title: `${unitTitle}の基本計算`,
        unit: unitTitle,
        subject: 'physics',
        format: 'input',
        variables: {
          a: { min: Math.max(2, v0Range.min), max: Math.max(4, v0Range.max), step: 1 },
          b: { min: 2, max: 8, step: 1 },
        },
        templateText: `【${unitTitle}】基本量A={{a}}、基本量B={{b}}のとき、A×Bの値を求めよ。`,
        calcLogicJS: `
          const a = vars.a, b = vars.b;
          const result = a * b;
          return {
            vars: { a, b },
            correctAnswer: result,
            explanationSteps: [
              'この単元の基本公式に、与えられた値をそのまま代入する。',
              'A×B = ' + a + '×' + b + ' = ' + result + '。',
            ],
          };
        `,
        hints: [
          `${unitTitle}の基本公式を確認しよう。`,
          '与えられた値を単位に注意して代入する。',
          '計算結果の桁数・単位を確認する。',
        ],
        keyFormula: `${unitTitle}の基本公式`,
        commonMistakes: '単位の変換忘れ、公式の適用条件の見落としに注意。',
      };
    }

    case 'generic_chemistry': {
      return {
        title: `${unitTitle}の物質量計算`,
        unit: unitTitle,
        subject: 'chemistry',
        format: 'input',
        variables: {
          mass: { min: 4, max: 40, step: 2 },
          molarMass: { min: 10, max: 60, step: 2 },
        },
        templateText: `【${unitTitle}】質量{{mass}}gの物質（モル質量{{molarMass}}g/mol）の物質量[mol]を求めよ（小数第2位まで）。`,
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

    case 'generic_math':
    default: {
      const range = difficultySpan(difficulty, 2, 12);
      return {
        title: `${unitTitle}の基本問題`,
        unit: unitTitle,
        subject: 'math',
        format: 'input',
        variables: {
          a: { min: Math.max(1, range.min), max: Math.max(3, range.max), step: 1 },
          b: { min: 1, max: 9, step: 1 },
        },
        templateText: `【${unitTitle}】A={{a}}、B={{b}}のとき、A+Bの値を求めよ。`,
        calcLogicJS: `
          const a = vars.a, b = vars.b;
          const result = a + b;
          return {
            vars: { a, b },
            correctAnswer: result,
            explanationSteps: [
              'この単元の基本的な計算手順に従って値を求める。',
              'A+B = ' + a + '+' + b + ' = ' + result + '。',
            ],
          };
        `,
        hints: [
          `${unitTitle}の基本公式・定義を確認しよう。`,
          '与えられた値を式に代入する。',
          '計算結果を見直す。',
        ],
        keyFormula: `${unitTitle}の基本公式`,
        commonMistakes: '公式の適用条件や定義域の確認不足に注意。',
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

  const blueprint = buildBlueprint(patternKey, finalDifficulty, unit?.title ?? '数学');

  const base: GeneratedProblem = {
    id: `mock-${patternKey}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
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

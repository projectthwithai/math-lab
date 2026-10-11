// ==========================================
// Apex Suite: Math Lab - Pattern-locked mock blueprints
// ==========================================
// 図鑑の patternId / subtopicId に紐づく問題だけを出す。
// 数列単元で「漸化式」を選んだのに等差の和が出る事故を防ぐ。

import type { SolutionPattern } from '@/types/mathLab';
import { difficultySpan, type TemplateBlueprint } from '@/lib/mock/blueprintTypes';
import { clampDifficulty } from '@/lib/engine/difficultyScale';

type SequenceKind =
  | 'recurrence'
  | 'arith_sum'
  | 'arith_term'
  | 'geom'
  | 'sigma'
  | 'sum_term'
  | 'induct';

function blobOf(pattern: Pick<SolutionPattern, 'subtopicId' | 'patternName' | 'strategyText' | 'exampleQuestion'>): string {
  return `${pattern.subtopicId ?? ''} ${pattern.patternName} ${pattern.strategyText} ${pattern.exampleQuestion}`;
}

export function resolveSequenceKind(
  pattern: Pick<SolutionPattern, 'subtopicId' | 'patternName' | 'strategyText' | 'exampleQuestion'>
): SequenceKind | null {
  const subtopicId = pattern.subtopicId ?? '';
  if (subtopicId === 'st-seq-rec') return 'recurrence';
  if (subtopicId === 'st-seq-arith-sum') return 'arith_sum';
  if (subtopicId === 'st-seq-arith-term') return 'arith_term';
  if (subtopicId === 'st-seq-geom') return 'geom';
  if (subtopicId === 'st-seq-sigma') return 'sigma';
  if (subtopicId === 'st-seq-sum-term') return 'sum_term';
  if (subtopicId === 'st-seq-induct') return 'induct';

  const blob = blobOf(pattern);
  if (/漸化/.test(blob) || /a_\{\s*n\s*\+\s*1\s*\}/.test(blob) || /a_\{n\+1\}/.test(blob)) {
    return 'recurrence';
  }
  if (/帰納/.test(blob)) return 'induct';
  if (/等比/.test(blob)) return 'geom';
  if (/Σ|シグマ/.test(blob)) return 'sigma';
  if (/S_n\s*-\s*S|和と一般/.test(blob)) return 'sum_term';
  if (/等差/.test(blob) && /和/.test(blob)) return 'arith_sum';
  if (/等差/.test(blob)) return 'arith_term';
  return null;
}

function recurrenceBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  const nMax = difficulty >= 4 ? 6 : difficulty >= 2 ? 5 : 4;
  return {
    title: '線形漸化式の一般項',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      a1: { min: 1, max: 4, step: 1 },
      p: { min: 2, max: 3, step: 1 },
      q: { min: 1, max: 6, step: 1 },
      n: { min: 3, max: nMax, step: 1 },
    },
    templateText:
      '$a_1={{a1}}$，$a_{n+1}={{p}}a_n+{{q}}$ で定まる数列について、第 {{n}} 項 $a_{{{n}}}$ を求めよ。',
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
          'b_n = a_n - α とおくと b_{n+1}=' + p + ' b_n（等比）。',
          'a_n = α + (a1-α)·' + p + '^{n-1}。',
          'n=' + n + ' を代入すると a_n=' + an + '。',
        ],
      };
    `,
    hints: [
      '特性方程式 $x=px+q$ を解いて定点 α を出す。',
      '$a_n-α$ を等比数列にする。',
      '初項から $p^{n-1}$ を掛けて戻す。',
    ],
    keyFormula: '$a_{n+1}-α = p(a_n-α)$，$α=q/(1-p)$',
    commonMistakes: 'α の符号を間違える。$p^n$ と $p^{n-1}$ を混同する。',
  };
}

function arithTermBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  const a1Range = difficultySpan(difficulty, -8, 10);
  return {
    title: '等差数列の一般項',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      a1: { min: a1Range.min, max: a1Range.max, step: 1 },
      d: { min: 2, max: 5, step: 1 },
      n: { min: 4, max: 10, step: 1 },
    },
    templateText: '初項 ${{a1}}$、公差 ${{d}}$ の等差数列の第 {{n}} 項 $a_{{{n}}}$ を求めよ。',
    calcLogicJS: `
      const a1 = vars.a1, d = vars.d, n = vars.n;
      const an = a1 + (n - 1) * d;
      return { vars: { a1, d, n }, correctAnswer: an,
        explanationSteps: ['a_n = a1+(n-1)d = ' + an + '。'] };
    `,
    hints: ['一般項は $a_n=a_1+(n-1)d$。', '$(n-1)$ 回公差を足す。', 'n と項数を混同しない。'],
    keyFormula: '$a_n = a_1+(n-1)d$',
    commonMistakes: '$(n-1)d$ を $nd$ にする。',
  };
}

function arithSumBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  return {
    title: '等差数列の和',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      a1: { min: 1, max: 6, step: 1 },
      d: { min: 2, max: 4, step: 1 },
      n: { min: 6, max: 12, step: 1 },
    },
    templateText: '初項 ${{a1}}$、公差 ${{d}}$ の等差数列の初項から第 {{n}} 項までの和 $S_{{{n}}}$ を求めよ。',
    calcLogicJS: `
      const a1 = vars.a1, d = vars.d, n = vars.n;
      const an = a1 + (n - 1) * d;
      const sn = n * (a1 + an) / 2;
      return { vars: { a1, d, n }, correctAnswer: sn,
        explanationSteps: ['a_n=' + an + '。S_n=n(a1+a_n)/2=' + sn + '。'] };
    `,
    hints: ['先に第 n 項を出す。', '和は $n(初項+末項)/2$。', '公式 $n\\{2a+(n-1)d\\}/2$ でもよい。'],
    keyFormula: '$S_n = n(a_1+a_n)/2$',
    commonMistakes: '項数 n と末項を混同する。',
  };
}

function geomBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  return {
    title: '等比数列の一般項',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      a1: { min: 1, max: 4, step: 1 },
      r: { min: 2, max: 3, step: 1 },
      n: { min: 3, max: Math.min(6, 2 + clampDifficulty(difficulty)), step: 1 },
    },
    templateText: '初項 ${{a1}}$、公比 ${{r}}$ の等比数列の第 {{n}} 項 $a_{{{n}}}$ を求めよ。',
    calcLogicJS: `
      const a1 = vars.a1, r = vars.r, n = vars.n;
      const an = a1 * Math.pow(r, n - 1);
      return { vars: { a1, r, n }, correctAnswer: an,
        explanationSteps: ['a_n = a1·r^{n-1} = ' + an + '。'] };
    `,
    hints: ['一般項は $a_n=a_1 r^{n-1}$。', '指数は $n-1$。', '公比の符号に注意。'],
    keyFormula: '$a_n = a_1 r^{n-1}$',
    commonMistakes: '$r^n$ にしてしまう。',
  };
}

function sigmaBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  return {
    title: 'Σの公式',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      n: { min: 5, max: 8 + clampDifficulty(difficulty), step: 1 },
    },
    templateText: '$\\sum_{k=1}^{{{n}}} k$ の値を求めよ。',
    calcLogicJS: `
      const n = vars.n;
      const s = n * (n + 1) / 2;
      return { vars: { n }, correctAnswer: s,
        explanationSteps: ['Σk = n(n+1)/2 = ' + s + '。'] };
    `,
    hints: ['$1$ から $n$ までの和。', '公式 $n(n+1)/2$。', '項数を確認する。'],
    keyFormula: '$\\sum_{k=1}^{n} k = n(n+1)/2$',
    commonMistakes: '$n^2/2$ にしてしまう。',
  };
}

function sumTermBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  return {
    title: '部分和と一般項',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      n: { min: 3, max: 6 + clampDifficulty(difficulty), step: 1 },
    },
    templateText: '$S_n=n^2$ のとき $a_{{{n}}}$ を求めよ。ただし $n\\ge 2$ とする。',
    calcLogicJS: `
      const n = vars.n;
      const an = n * n - (n - 1) * (n - 1);
      return { vars: { n }, correctAnswer: an,
        explanationSteps: ['a_n = S_n - S_{n-1} = n^2 - (n-1)^2 = ' + an + '。'] };
    `,
    hints: ['$n\\ge 2$ では $a_n=S_n-S_{n-1}$。', '$S_{n-1}=(n-1)^2$。', '展開して差を取る。'],
    keyFormula: '$a_n = S_n - S_{n-1}$',
    commonMistakes: '$n=1$ にも差公式を使う。',
  };
}

function inductBlueprint(difficulty: number, unitTitle: string): TemplateBlueprint {
  return {
    title: '数学的帰納法',
    unit: unitTitle,
    subject: 'math',
    format: 'input',
    variables: {
      n: { min: 3, max: 4 + clampDifficulty(difficulty), step: 1 },
    },
    templateText:
      'すべての自然数 $n$ について $1+2+\\cdots+n=\\dfrac{n(n+1)}{2}$ が成り立つ。$n={{n}}$ のとき右辺の値を求めよ。',
    calcLogicJS: `
      const n = vars.n;
      const s = n * (n + 1) / 2;
      return { vars: { n }, correctAnswer: s,
        explanationSteps: ['右辺 n(n+1)/2 = ' + s + '。帰納法の結論の検算。'] };
    `,
    hints: ['$n=1$ で成り立つことを確認する形の検算。', '公式に代入する。', '帰納法の結論と一致させる。'],
    keyFormula: '$1+\\cdots+n=n(n+1)/2$',
    commonMistakes: '項数を 1 つずらす。',
  };
}

const BUILDERS: Record<SequenceKind, (difficulty: number, unitTitle: string) => TemplateBlueprint> = {
  recurrence: recurrenceBlueprint,
  arith_sum: arithSumBlueprint,
  arith_term: arithTermBlueprint,
  geom: geomBlueprint,
  sigma: sigmaBlueprint,
  sum_term: sumTermBlueprint,
  induct: inductBlueprint,
};

export function buildPatternLockedBlueprint(
  pattern: SolutionPattern | undefined,
  difficulty: number,
  unitTitle: string
): TemplateBlueprint | null {
  if (!pattern) return null;
  const kind = resolveSequenceKind(pattern);
  if (!kind) return null;
  return BUILDERS[kind](clampDifficulty(difficulty), unitTitle);
}

export function problemTextMatchesPattern(
  questionText: string,
  pattern: Pick<SolutionPattern, 'subtopicId' | 'patternName' | 'strategyText' | 'exampleQuestion'>
): boolean {
  const kind = resolveSequenceKind(pattern);
  const q = questionText;
  if (kind === 'recurrence') {
    const recurrenceMark = /漸化|a_\{\s*n\s*\+\s*1\s*\}|a_\{n\+1\}/.test(q);
    if (/等差数列/.test(q) && !recurrenceMark) return false;
    return recurrenceMark;
  }
  if (kind === 'arith_sum') return /和|S_/.test(q);
  if (kind === 'arith_term') return /等差|第.+項/.test(q);
  if (kind === 'geom') return /等比|公比/.test(q);
  if (kind === 'induct') return /帰納|自然数/.test(q);
  return true;
}

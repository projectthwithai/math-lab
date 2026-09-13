// ==========================================
// Apex Suite: Math Lab - correctAnswer 正規化
// ==========================================
// 入力問題で正解が空・未定義のまま出題されるのを防ぐ。
// 採点モーダルはここを経由して必ず表示用テキストを得る。

import type { GeneratedProblem } from '@/types/mathLab';

const DISPLAY_FALLBACK = '解説の結論を参照';

export function isPlaceholderCorrectAnswer(value: unknown): boolean {
  if (!hasUsableCorrectAnswer(value)) return true;
  return stringifyCorrectAnswer(value) === DISPLAY_FALLBACK;
}

export function hasUsableCorrectAnswer(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

export function stringifyCorrectAnswer(value: string | number): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return value.trim();
}

function extractTrailingNumericAnswer(texts: string[]): number | null {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const matches = texts[index].match(/(-?\d+(?:\.\d+)?)(?!.*\d)/);
    if (!matches) continue;
    const parsed = Number(matches[1]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function looksLikeSymmetricRadicalQuestion(questionText: string): boolean {
  const hasPair = /x\s*=/.test(questionText) && /y\s*=/.test(questionText);
  const hasTarget = /x\^2\s*\+\s*y\^2|x²\s*\+\s*y²/.test(questionText);
  const hasRoots = /\\sqrt/.test(questionText) || /√/.test(questionText);
  return hasPair && hasTarget && hasRoots;
}

function computeSymmetricRadicalAnswer(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  const sum = (2 * (a + b)) / (a - b);
  const value = sum * sum - 2;
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 1e6) / 1e6;
}

function parseRadicalPair(questionText: string): { a: number; b: number } | null {
  const latex = [...questionText.matchAll(/\\sqrt\{(\d+)\}/g)].map((match) => Number(match[1]));
  const unicode = [...questionText.matchAll(/√\s*(\d+)/g)].map((match) => Number(match[1]));
  const nums = (latex.length >= 2 ? latex : unicode).filter((value) => Number.isFinite(value));
  if (nums.length < 2) return null;
  const a = nums[0];
  const b = nums[1];
  if (a === b) return null;
  return { a, b };
}

function canonicalSymmetricSteps(a: number, b: number, answer: number): string[] {
  const sum = (2 * (a + b)) / (a - b);
  const sumText = Number.isInteger(sum) ? String(sum) : String(Math.round(sum * 1000) / 1000);
  return [
    `$x+y = ${sumText},\\ xy = 1$。分母を有理化すると互いに逆数になる。`,
    `$x^2 + y^2 = (x+y)^2 - 2xy = ${sumText}^2 - 2(1) = ${answer}$。`,
  ];
}

/** 文字 a,b のまま数値入力させる対称式・有理化問題を、a=3, b=2 の具体値へ直す */
export function concretizeSymmetricRadicalProblem(problem: GeneratedProblem): GeneratedProblem {
  const question = problem.questionText ?? '';
  if (!looksLikeSymmetricRadicalQuestion(question) && !/\\sqrt\{a\}/.test(question)) {
    return problem;
  }

  const abstract = /\\sqrt\{a\}/.test(question) || /√a/.test(question);
  let nextQuestion = question;
  if (abstract) {
    nextQuestion = question
      .replace(/\\sqrt\{a\}/g, '\\sqrt{3}')
      .replace(/\\sqrt\{b\}/g, '\\sqrt{2}')
      .replace(/√a/g, '\\sqrt{3}')
      .replace(/√b/g, '\\sqrt{2}');
  }

  const pair = parseRadicalPair(nextQuestion) ?? { a: 3, b: 2 };
  const computed = computeSymmetricRadicalAnswer(pair.a, pair.b) ?? 98;
  const existingSteps = (problem.explanation.stepByStep ?? []).filter((step) => step.trim().length > 0);
  const steps =
    existingSteps.length > 0 ? existingSteps : canonicalSymmetricSteps(pair.a, pair.b, computed);

  return {
    ...problem,
    questionText: nextQuestion,
    correctAnswer: computed,
    explanation: {
      ...problem.explanation,
      stepByStep: steps,
      keyFormula: problem.explanation.keyFormula || '$x^2+y^2=(x+y)^2-2xy$',
    },
  };
}

export function resolveCorrectAnswer(
  problem: Pick<GeneratedProblem, 'correctAnswer' | 'explanation' | 'questionText'>
): string | number {
  if (hasUsableCorrectAnswer(problem.correctAnswer)) {
    return typeof problem.correctAnswer === 'string' ? problem.correctAnswer.trim() : problem.correctAnswer;
  }

  if (looksLikeSymmetricRadicalQuestion(problem.questionText ?? '')) {
    const pair = parseRadicalPair(problem.questionText ?? '') ?? { a: 3, b: 2 };
    const computed = computeSymmetricRadicalAnswer(pair.a, pair.b);
    if (computed != null) return computed;
  }

  const fromSteps = extractTrailingNumericAnswer(problem.explanation?.stepByStep ?? []);
  if (fromSteps != null) return fromSteps;

  const fromFormula = extractTrailingNumericAnswer([problem.explanation?.keyFormula ?? '']);
  if (fromFormula != null) return fromFormula;

  return DISPLAY_FALLBACK;
}

/** 採点モーダル用。空にせず、KaTeX で太く描けるテキストにする */
export function formatCorrectAnswerForDisplay(
  problem: Pick<GeneratedProblem, 'correctAnswer' | 'explanation' | 'questionText'>
): string {
  const resolved = resolveCorrectAnswer(problem);
  const text = stringifyCorrectAnswer(resolved);
  if (!text) return `$${DISPLAY_FALLBACK}$`;
  if (/\$/.test(text)) return text;
  if (/\\[A-Za-z]|[_^]|\\pm/.test(text)) return `$${text}$`;
  return `$${text}$`;
}

export function ensureProblemHasCorrectAnswer(problem: GeneratedProblem): GeneratedProblem {
  const concretized = concretizeSymmetricRadicalProblem(problem);
  if (hasUsableCorrectAnswer(concretized.correctAnswer)) {
    if (typeof concretized.correctAnswer === 'string') {
      const trimmed = concretized.correctAnswer.trim();
      if (trimmed !== concretized.correctAnswer) {
        return { ...concretized, correctAnswer: trimmed };
      }
    }
    return concretized;
  }
  return { ...concretized, correctAnswer: resolveCorrectAnswer(concretized) };
}

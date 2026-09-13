// ==========================================
// Apex Suite: Math Lab - correctAnswer 正規化
// ==========================================
// 入力問題で正解が空・未定義のまま出題されるのを防ぐ。
// 対称式×有理化は問題文の a,b から毎回再計算し、98 などの固定値は使わない。
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

export function computeSymmetricRadicalAnswer(a: number, b: number): string | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  const value = Math.round(Math.pow((2 * (a + b)) / (a - b), 2) - 2);
  if (!Number.isFinite(value)) return null;
  return String(value);
}

export function isSymmetricRadicalQuestion(questionText: string): boolean {
  const hasPair = /x\s*=/.test(questionText) && /y\s*=/.test(questionText);
  const hasTarget = /x\^\{?2\}?\s*\+\s*y\^\{?2\}?|x²\s*\+\s*y²/.test(questionText);
  const hasRoots = /\\sqrt/.test(questionText) || /√/.test(questionText);
  return hasPair && hasTarget && hasRoots;
}

export function parseRadicalPair(questionText: string): { a: number; b: number } | null {
  const latex = [...questionText.matchAll(/\\sqrt\{(\d+)\}/g)].map((match) => Number(match[1]));
  const unicode = [...questionText.matchAll(/√\s*(\d+)/g)].map((match) => Number(match[1]));
  const nums = (latex.length >= 2 ? latex : unicode).filter((value) => Number.isFinite(value) && value > 0);
  if (nums.length < 2) return null;
  const a = nums[0];
  const b = nums[1];
  if (a === b) return null;
  return { a, b };
}

function pairFromVars(vars: Record<string, number | string> | undefined): { a: number; b: number } | null {
  if (!vars) return null;
  const a = Number(vars.a);
  const b = Number(vars.b);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  return a > b ? { a, b } : { a: b, b: a };
}

/** 解説最終行の結論（最後の = 数値）を読む。xy=1 のような途中値は捨てる */
export function extractConclusionFromExplanation(steps: string[] | undefined): string | null {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const last = steps[steps.length - 1] ?? '';
  const equals = [...last.matchAll(/=\s*(-?\d+(?:\.\d+)?)\s*(?:\$|。|\.|$)/g)];
  if (equals.length > 0) {
    return equals[equals.length - 1][1];
  }
  const nums = last.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const lastNum = nums[nums.length - 1];
  if (lastNum === '1' || lastNum === '2' || lastNum === '0') return null;
  return lastNum;
}

function canonicalSymmetricSteps(a: number, b: number, answer: string): string[] {
  const sum = (2 * (a + b)) / (a - b);
  const sumText = Number.isInteger(sum) ? String(sum) : String(Math.round(sum * 1000) / 1000);
  return [
    `$x+y = ${sumText},\\ xy = 1$。分母を有理化すると互いに逆数になる。`,
    `$x+y = ${sumText},\\ xy = 1 \\Rightarrow x^2+y^2 = ${sumText}^2 - 2(1) = ${answer}$。`,
  ];
}

function answersDisagree(left: string | number | null | undefined, right: string | number | null | undefined): boolean {
  if (!hasUsableCorrectAnswer(left) || !hasUsableCorrectAnswer(right)) return false;
  const a = stringifyCorrectAnswer(left);
  const b = stringifyCorrectAnswer(right);
  if (a === b) return false;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) >= 0.05;
  return true;
}

/**
 * 問題文の a,b → 解説最終行 → 保存済み の順で、数学的に一致する正解を返す。
 * 食い違いがあれば問題文の計算（なければ解説結論）を優先する。
 */
export function reconcileCorrectAnswer(
  problem: Pick<GeneratedProblem, 'correctAnswer' | 'explanation' | 'questionText' | 'templateConfig'>,
  vars?: Record<string, number | string>
): string {
  const question = problem.questionText ?? '';
  const radical = isSymmetricRadicalQuestion(question) || /\\sqrt\{a\}/.test(question);
  const pair = radical ? parseRadicalPair(question) ?? pairFromVars(vars) : parseRadicalPair(question);
  const fromQuestion = radical && pair ? computeSymmetricRadicalAnswer(pair.a, pair.b) : null;
  const fromSteps = extractConclusionFromExplanation(problem.explanation?.stepByStep);
  const stored = hasUsableCorrectAnswer(problem.correctAnswer)
    ? stringifyCorrectAnswer(problem.correctAnswer)
    : null;

  const lastStep = problem.explanation?.stepByStep?.at(-1) ?? '';
  const conclusionTrusted =
    radical ||
    /x\^\{?2\}?|x²/.test(lastStep) ||
    /\\Rightarrow|⇒/.test(lastStep) ||
    /値を求めよ|の値は/.test(question);

  if (fromQuestion && stored && answersDisagree(fromQuestion, stored)) return fromQuestion;
  if (fromQuestion) return fromQuestion;
  if (fromSteps && (!stored || (conclusionTrusted && answersDisagree(fromSteps, stored)))) {
    return fromSteps.trim();
  }
  if (stored) return stored.trim();
  return DISPLAY_FALLBACK;
}

/** 文字 a,b のままなら具体整数へ。数値は問題文に合わせて正解を再計算する（98 固定はしない） */
export function concretizeSymmetricRadicalProblem(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): GeneratedProblem {
  const question = problem.questionText ?? '';
  const abstract = /\\sqrt\{a\}/.test(question) || /√a(?!\d)/.test(question);
  let nextQuestion = question;
  const pairFromText = parseRadicalPair(question);
  const pairFromState = pairFromVars(vars);

  if (abstract && pairFromState) {
    nextQuestion = question
      .replace(/\\sqrt\{a\}/g, `\\sqrt{${pairFromState.a}}`)
      .replace(/\\sqrt\{b\}/g, `\\sqrt{${pairFromState.b}}`)
      .replace(/√a(?!\d)/g, `\\sqrt{${pairFromState.a}}`)
      .replace(/√b(?!\d)/g, `\\sqrt{${pairFromState.b}}`);
  }

  const pair = parseRadicalPair(nextQuestion) ?? pairFromText ?? (abstract || isSymmetricRadicalQuestion(nextQuestion) ? pairFromState : null);
  if (!isSymmetricRadicalQuestion(nextQuestion) && !abstract) {
    return problem;
  }
  if (!pair) {
    return nextQuestion === question ? problem : { ...problem, questionText: nextQuestion };
  }

  const computed = computeSymmetricRadicalAnswer(pair.a, pair.b);
  if (!computed) return nextQuestion === question ? problem : { ...problem, questionText: nextQuestion };

  const existingSteps = (problem.explanation.stepByStep ?? []).filter((step) => step.trim().length > 0);
  const lastConclusion = extractConclusionFromExplanation(existingSteps);
  const stepsNeedRewrite = existingSteps.length === 0 || (lastConclusion != null && answersDisagree(lastConclusion, computed));

  return {
    ...problem,
    questionText: nextQuestion,
    correctAnswer: computed,
    explanation: {
      ...problem.explanation,
      stepByStep: stepsNeedRewrite ? canonicalSymmetricSteps(pair.a, pair.b, computed) : existingSteps,
      keyFormula: problem.explanation.keyFormula || '$x^2+y^2=(x+y)^2-2xy$',
    },
  };
}

export function resolveCorrectAnswer(
  problem: Pick<GeneratedProblem, 'correctAnswer' | 'explanation' | 'questionText' | 'templateConfig'>
): string | number {
  return reconcileCorrectAnswer(problem);
}

/** 採点モーダル用。空にせず、KaTeX で太く描けるテキストにする */
export function formatCorrectAnswerForDisplay(
  problem: Pick<GeneratedProblem, 'correctAnswer' | 'explanation' | 'questionText' | 'templateConfig'>
): string {
  const text = reconcileCorrectAnswer(problem);
  if (!text) return `$${DISPLAY_FALLBACK}$`;
  if (/\$/.test(text)) return text;
  if (/\\[A-Za-z]|[_^]|\\pm/.test(text)) return `$${text}$`;
  return `$${text}$`;
}

export function ensureProblemHasCorrectAnswer(
  problem: GeneratedProblem,
  vars?: Record<string, number | string>
): GeneratedProblem {
  const synced = concretizeSymmetricRadicalProblem(problem, vars);
  const reconciled = reconcileCorrectAnswer(synced, vars);
  if (hasUsableCorrectAnswer(synced.correctAnswer) && stringifyCorrectAnswer(synced.correctAnswer) === reconciled) {
    if (typeof synced.correctAnswer === 'string') {
      const trimmed = synced.correctAnswer.trim();
      if (trimmed !== synced.correctAnswer) return { ...synced, correctAnswer: trimmed };
    }
    return synced;
  }
  return { ...synced, correctAnswer: reconciled };
}

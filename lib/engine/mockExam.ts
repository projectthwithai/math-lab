// ==========================================
// Apex Suite: Math Lab - 全国統一 AI実践模試
// ==========================================
// 設定・共通テスト型への整形・偏差値判定。問題生成はローカルエンジン（API 0）。

import type { GeneratedProblem, ProblemFormat } from '@/types/mathLab';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { checkAnswer } from '@/lib/engine/answerChecker';
import { cleanGeneratedProblem, cleanLatexFormula } from '@/lib/utils/mathFormatter';

export type MockExamDifficultyPreset = 'basic' | 'standard' | 'advanced' | 'hard';
export type MockExamStyle = 'common_test' | 'descriptive' | 'mixed';

export const MOCK_EXAM_STORAGE_KEY = 'math-lab.mock-exam.config';

export const MOCK_EXAM_DEFAULTS = {
  difficulty: 'standard' as MockExamDifficultyPreset,
  minutes: 60,
  questionCount: 5,
  style: 'common_test' as MockExamStyle,
};

export interface MockExamConfig {
  unitIds: string[];
  difficulty: MockExamDifficultyPreset;
  minutes: number;
  questionCount: number;
  style: MockExamStyle;
  /** 単元総復習など、特定パターンを均等に出題するとき */
  patternIds?: string[];
}

export interface MockExamQuestionResult {
  index: number;
  problem: GeneratedProblem;
  userAnswer: string;
  isCorrect: boolean;
}

export type MockExamGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface MockExamReport {
  deviation: number;
  grade: MockExamGrade;
  gradeLabel: string;
  correctCount: number;
  totalCount: number;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  questions: MockExamQuestionResult[];
  weakPatterns: Array<{ title: string; unit: string; advice: string }>;
}

export function difficultyPresetToNumber(preset: MockExamDifficultyPreset): number {
  switch (preset) {
    case 'basic':
      return 3;
    case 'standard':
      return 5;
    case 'advanced':
      return 7;
    case 'hard':
      return 9;
  }
}

export function saveMockExamConfig(config: MockExamConfig): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(MOCK_EXAM_STORAGE_KEY, JSON.stringify(config));
}

export function loadMockExamConfig(): MockExamConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(MOCK_EXAM_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MockExamConfig;
    if (!Array.isArray(parsed.unitIds) || parsed.unitIds.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function shuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatChoiceValue(value: string | number): string {
  if (typeof value === 'number') {
    const rounded = Math.round(value * 100) / 100;
    return cleanLatexFormula(String(Object.is(rounded, -0) ? 0 : rounded));
  }
  return cleanLatexFormula(value);
}

/** 共通テスト型: 正解を含む4択に整形する */
export function toCommonTestProblem(problem: GeneratedProblem): GeneratedProblem {
  const correct = formatChoiceValue(problem.correctAnswer);
  const numeric = typeof problem.correctAnswer === 'number' ? problem.correctAnswer : Number(correct);
  let options: string[];

  if (Number.isFinite(numeric)) {
    const deltas = [1, -1, 2, -2, 0.5, -0.5, numeric === 0 ? 3 : numeric];
    const unique = new Set<string>([correct]);
    for (const delta of deltas) {
      const candidate = formatChoiceValue(Math.round((numeric + delta) * 100) / 100);
      if (candidate !== correct) unique.add(candidate);
      if (unique.size >= 4) break;
    }
    let extra = numeric + 3;
    while (unique.size < 4) {
      unique.add(formatChoiceValue(Math.round(extra * 100) / 100));
      extra += 1;
    }
    options = [...unique].slice(0, 4);
  } else {
    const extras = problem.choices?.map((choice) => formatChoiceValue(choice)) ?? [
      `${correct} ではない`,
      '0',
      '存在しない',
    ];
    const unique = new Set<string>([correct, ...extras]);
    options = [...unique].slice(0, 4);
    while (options.length < 4) options.push(`選択肢${options.length + 1}`);
  }

  const shuffled = shuffle(options, problem.id);
  const stem = problem.questionText.includes('選べ')
    ? problem.questionText
    : `${problem.questionText}\n\n次の①〜④のうち、正しいものを1つ選べ。`;

  return cleanGeneratedProblem({
    ...problem,
    format: 'choice' as ProblemFormat,
    questionText: stem,
    choices: shuffled,
    correctAnswer: correct,
  });
}

export function buildMockExamProblems(config: MockExamConfig): GeneratedProblem[] {
  const difficulty = difficultyPresetToNumber(config.difficulty);
  const problems: GeneratedProblem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < config.questionCount; i += 1) {
    const unitId = config.unitIds[i % config.unitIds.length];
    const patternId = config.patternIds?.[i % config.patternIds.length];
    let problem = cleanGeneratedProblem(
      generateMockProblem({
        unitId,
        patternId,
        difficulty,
      })
    );
    if (seen.has(problem.questionText)) {
      problem = cleanGeneratedProblem(generateMockProblem({ unitId, difficulty }));
    }
    seen.add(problem.questionText);

    if (config.style === 'common_test' || (config.style === 'mixed' && i % 2 === 0)) {
      problem = toCommonTestProblem(problem);
    }

    problems.push({
      ...problem,
      id: `mock-exam-${i}-${problem.id}`,
    });
  }

  return problems;
}

function gradeFromDeviation(deviation: number): { grade: MockExamGrade; gradeLabel: string } {
  if (deviation >= 70) return { grade: 'A', gradeLabel: 'A判定（難関大合格圏）' };
  if (deviation >= 62) return { grade: 'B', gradeLabel: 'B判定（志望校チャレンジ可）' };
  if (deviation >= 54) return { grade: 'C', gradeLabel: 'C判定（標準ライン）' };
  if (deviation >= 46) return { grade: 'D', gradeLabel: 'D判定（要補強）' };
  return { grade: 'E', gradeLabel: 'E判定（基礎から徹底）' };
}

export function buildMockExamReport(params: {
  problems: GeneratedProblem[];
  answers: string[];
  elapsedSeconds: number;
  timeLimitSeconds: number;
  difficulty: MockExamDifficultyPreset;
}): MockExamReport {
  const questions: MockExamQuestionResult[] = params.problems.map((problem, index) => {
    const userAnswer = params.answers[index] ?? '';
    return {
      index,
      problem,
      userAnswer,
      isCorrect: userAnswer.length > 0 && checkAnswer(userAnswer, problem.correctAnswer),
    };
  });

  const correctCount = questions.filter((item) => item.isCorrect).length;
  const totalCount = questions.length || 1;
  const rate = correctCount / totalCount;
  const jitter = ((correctCount * 7 + totalCount * 13) % 9) / 10;
  const difficultyBoost = (difficultyPresetToNumber(params.difficulty) - 5) * 1.1;
  const deviation = Math.round((38 + rate * 40 + difficultyBoost + jitter) * 10) / 10;
  const { grade, gradeLabel } = gradeFromDeviation(deviation);

  const weakPatterns = questions
    .filter((item) => !item.isCorrect)
    .map((item) => ({
      title: item.problem.title,
      unit: item.problem.unit,
      advice:
        item.problem.explanation.commonMistakes ||
        item.problem.explanation.keyFormula ||
        '定義・公式の適用条件をもう一度確認しよう。',
    }));

  return {
    deviation,
    grade,
    gradeLabel,
    correctCount,
    totalCount: questions.length,
    elapsedSeconds: params.elapsedSeconds,
    timeLimitSeconds: params.timeLimitSeconds,
    questions,
    weakPatterns,
  };
}

export function formatExamClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

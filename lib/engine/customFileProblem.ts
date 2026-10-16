// ==========================================
// Apex Suite: Math Lab - マイファイル用スナップショット
// ==========================================

import type { CustomProblemFile, GeneratedProblem, SolutionPattern } from '@/types/mathLab';
import { getPatternStarDifficulty } from '@/data/patternsData';
import {
  ENERGY_COST_CUSTOM_FILE_NEW,
  ENERGY_COST_CUSTOM_FILE_REVIEW,
  getCustomFilePracticeEnergyCost,
} from '@/lib/engine/energyCosts';
import { getAllSolvedProblemRecords } from '@/lib/storage/solvedProblemsStore';

const PATTERN_EXAMPLE_PREFIX = 'pattern-example:';
const CHARGED_SESSION_KEY = 'math-lab:custom-file-energy-charged';

export function problemFromPatternExample(
  pattern: SolutionPattern,
  displayName: string
): GeneratedProblem {
  const strategy = pattern.strategyText.trim() || '方針を確認して解く。';
  return {
    id: `pattern-example:${pattern.id}`,
    patternId: pattern.id,
    subject: pattern.subject,
    unit: pattern.unit,
    title: displayName,
    difficulty: getPatternStarDifficulty(pattern),
    format: 'descriptive',
    questionText: pattern.exampleQuestion,
    visualType: 'none',
    visualConfig: { type: 'none', params: {} },
    correctAnswer: '',
    hints: [strategy, strategy, strategy],
    explanation: {
      stepByStep: [strategy],
      keyFormula: '',
      commonMistakes: '',
    },
  };
}

export function startCustomFilePracticePath(fileId: string, index = 0): string {
  const params = new URLSearchParams({
    source: 'custom-file',
    fileId,
    index: String(Math.max(0, index)),
  });
  return `/workspace?${params.toString()}`;
}

export function canonicalProblemId(problemId: string): string {
  return problemId.replace(/-(?:review|regen|play)-\d+$/, '');
}

export function extractPatternIdFromProblemId(problemId: string): string | undefined {
  if (problemId.startsWith(PATTERN_EXAMPLE_PREFIX)) {
    return problemId.slice(PATTERN_EXAMPLE_PREFIX.length);
  }
  return undefined;
}

function isSameProblemId(left: string, right: string): boolean {
  return canonicalProblemId(left) === canonicalProblemId(right);
}

function findSnapshotProblem(
  customFiles: CustomProblemFile[],
  problemId: string
): GeneratedProblem | undefined {
  for (const file of customFiles) {
    const found = file.problems.find((item) => isSameProblemId(item.id, problemId));
    if (found) return found;
  }
  return undefined;
}

export function isProblemPracticedFromLogs(params: {
  problemId: string;
  patternId?: string;
  customFiles?: CustomProblemFile[];
  clearedPatternIds: string[];
  masteredPatterns: string[];
}): boolean {
  const problemId = params.problemId.trim();
  if (!problemId) return false;

  const snapshot = params.customFiles ? findSnapshotProblem(params.customFiles, problemId) : undefined;
  const patternId =
    params.patternId ?? snapshot?.patternId ?? extractPatternIdFromProblemId(problemId);
  const mastered = [...params.clearedPatternIds, ...params.masteredPatterns];

  if (patternId && mastered.includes(patternId)) return true;
  if (mastered.includes(problemId)) return true;

  return getAllSolvedProblemRecords().some((record) => {
    const solvedId = record.problem.id;
    const solvedPattern = record.problem.patternId;
    return (
      isSameProblemId(solvedId, problemId) ||
      record.id === problemId ||
      (patternId ? solvedId === patternId || solvedPattern === patternId : false) ||
      solvedPattern === problemId
    );
  });
}

function readChargedProblemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(CHARGED_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function wasCustomFileEnergyCharged(problemId: string): boolean {
  return readChargedProblemIds().includes(canonicalProblemId(problemId));
}

export function markCustomFileEnergyCharged(problemId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const next = canonicalProblemId(problemId);
    const ids = readChargedProblemIds();
    if (ids.includes(next)) return;
    window.sessionStorage.setItem(CHARGED_SESSION_KEY, JSON.stringify([...ids, next].slice(-200)));
  } catch {
    // sessionStorage が使えない場合は再マウント時に再課金される
  }
}

export function summarizeCustomFileEnergy(
  problems: GeneratedProblem[],
  isPracticed: (problemId: string) => boolean,
  isDeveloper = false
): { unpracticedCount: number; totalCost: number } {
  const unpracticedCount = problems.filter((problem) => !isPracticed(problem.id)).length;
  const totalCost = isDeveloper
    ? ENERGY_COST_CUSTOM_FILE_REVIEW
    : unpracticedCount * ENERGY_COST_CUSTOM_FILE_NEW;
  return { unpracticedCount, totalCost };
}

export function resolveCustomFileProblemCost(options: {
  practiced: boolean;
  isDeveloper?: boolean;
  alreadyCharged?: boolean;
}): number {
  if (options.alreadyCharged) return ENERGY_COST_CUSTOM_FILE_REVIEW;
  return getCustomFilePracticeEnergyCost({
    practiced: options.practiced,
    isDeveloper: options.isDeveloper,
  });
}

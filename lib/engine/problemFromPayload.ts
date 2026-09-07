// ==========================================
// Apex Suite: Math Lab - Problem Payload Normalizer
// ==========================================
// Vision / LLM が返した不完全な問題JSONを GeneratedProblem に整える。

import type { GeneratedProblem, ProblemFormat, Subject } from '@/types/mathLab';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function isFormat(value: unknown): value is ProblemFormat {
  return value === 'choice' || value === 'input' || value === 'descriptive';
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function problemFromPayload(
  raw: unknown,
  fallback: { unit?: string; subject?: Subject; difficulty?: number; idPrefix?: string }
): GeneratedProblem | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const nestedConfig =
    source.templateConfig && typeof source.templateConfig === 'object'
      ? (source.templateConfig as Record<string, unknown>)
      : {};

  const questionText = readString(source.questionText) ?? readString(source.templateText) ?? readString(nestedConfig.templateText);
  if (!questionText) return null;

  const hintsRaw = Array.isArray(source.hints) ? source.hints.filter((item): item is string => typeof item === 'string') : [];
  const hints: [string, string, string] = [
    hintsRaw[0] ?? '問題文の条件を整理する。',
    hintsRaw[1] ?? '使う公式と発動条件を書く。',
    hintsRaw[2] ?? '最後に単位・符号・定義域を検算する。',
  ];

  const explanation =
    source.explanation && typeof source.explanation === 'object'
      ? (source.explanation as Record<string, unknown>)
      : {};

  const stepByStep = Array.isArray(explanation.stepByStep)
    ? explanation.stepByStep.filter((item): item is string => typeof item === 'string')
    : [];

  const variables =
    (source.variables && typeof source.variables === 'object'
      ? (source.variables as NonNullable<GeneratedProblem['templateConfig']>['variables'])
      : undefined) ??
    (nestedConfig.variables && typeof nestedConfig.variables === 'object'
      ? (nestedConfig.variables as NonNullable<GeneratedProblem['templateConfig']>['variables'])
      : undefined);

  const templateText = readString(source.templateText) ?? readString(nestedConfig.templateText) ?? questionText;
  const calcLogicJS = readString(source.calcLogicJS) ?? readString(nestedConfig.calcLogicJS);

  const base: GeneratedProblem = {
    id: `${fallback.idPrefix ?? 'vision'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    patternId: readString(source.patternId),
    subject: isSubject(source.subject) ? source.subject : fallback.subject ?? 'math',
    unit: readString(source.unit) ?? fallback.unit ?? '総合',
    title: readString(source.title) ?? '読み取った問題',
    difficulty:
      typeof source.difficulty === 'number' && Number.isFinite(source.difficulty)
        ? Math.max(1, Math.min(10, Math.round(source.difficulty)))
        : (fallback.difficulty ?? 5),
    format: isFormat(source.format) ? source.format : 'input',
    questionText,
    visualType: 'none',
    visualConfig: { type: 'none', params: {} },
    correctAnswer:
      typeof source.correctAnswer === 'string' || typeof source.correctAnswer === 'number'
        ? source.correctAnswer
        : '',
    choices: Array.isArray(source.choices)
      ? source.choices.filter((item): item is string => typeof item === 'string')
      : undefined,
    hints,
    explanation: {
      stepByStep,
      keyFormula: readString(explanation.keyFormula) ?? readString(source.keyFormula) ?? '',
      commonMistakes: readString(explanation.commonMistakes) ?? readString(source.commonMistakes) ?? '',
    },
    templateConfig:
      variables && calcLogicJS
        ? { variables, templateText, calcLogicJS }
        : undefined,
  };

  if (!base.templateConfig) return base;
  try {
    return regenerateProblemLocally(base);
  } catch {
    return base;
  }
}

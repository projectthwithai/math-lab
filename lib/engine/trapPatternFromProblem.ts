// ==========================================
// Apex Suite: Math Lab - Trap pattern registration
// ==========================================
// 反例問題をパターン図鑑の「⚠️ 罠パターン」として登録する。

import type { GeneratedProblem, SolutionPattern } from '@/types/mathLab';
import { findSolutionPatternById } from '@/data/patternsData';
import { UNITS_DATA, getUnitById } from '@/data/unitsData';

export function trapPatternName(title: string): string {
  const trimmed = title.trim();
  if (trimmed.startsWith('⚠️')) return trimmed;
  return `⚠️ 罠パターン: ${trimmed}`;
}

export function resolveTrapSourceMeta(
  source?: GeneratedProblem | null
): { unitId?: string; subtopicId?: string } {
  if (!source) return {};
  const catalog = findSolutionPatternById(source.patternId);
  if (catalog?.unitId) {
    return { unitId: catalog.unitId, subtopicId: catalog.subtopicId };
  }
  if (source.patternId && getUnitById(source.patternId)) {
    return { unitId: source.patternId };
  }
  const byTitle =
    UNITS_DATA.find((unit) => unit.title === source.unit && unit.subject === source.subject) ??
    UNITS_DATA.find((unit) => unit.title === source.unit);
  if (byTitle) return { unitId: byTitle.id };
  return {};
}

export function trapPatternFromProblem(
  problem: GeneratedProblem,
  source?: { unitId?: string; subtopicId?: string }
): SolutionPattern {
  const whyFails = problem.explanation.commonMistakes.trim();
  const howToSolve = problem.explanation.stepByStep.filter((step) => step.trim()).join('\n');
  const unitId =
    source?.unitId ??
    UNITS_DATA.find((unit) => unit.title === problem.unit && unit.subject === problem.subject)?.id ??
    UNITS_DATA.find((unit) => unit.subject === problem.subject)?.id;
  const unit = unitId ? getUnitById(unitId) : undefined;
  const subtopicId = source?.subtopicId ?? unit?.subtopics[0]?.id;

  return {
    id: problem.patternId || `trap-${problem.id}`,
    subject: problem.subject,
    unit: problem.unit,
    unitId,
    subtopicId,
    level: 'advanced',
    patternName: trapPatternName(problem.title),
    exampleQuestion: problem.questionText,
    strategyText: [
      '【なぜこの解法では通用しないか】',
      whyFails || '適用条件を外すと計算が破綻するか、解が失われる。',
      '【どう解くべきか】',
      howToSolve || problem.explanation.keyFormula,
    ].join('\n'),
    discovered: true,
    trapPattern: true,
    difficulty: problem.difficulty,
  };
}

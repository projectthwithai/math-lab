// ==========================================
// Apex Suite: Math Lab - Mistake diagnosis client
// ==========================================

import type { GeneratedProblem, MistakeDiagnosis } from '@/types/mathLab';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';
import { isMistakeTag } from '@/lib/engine/mistakeTags';

const diagnosisCache = new Map<string, MistakeDiagnosis>();

export function mistakeDiagnosisCacheKey(problemId: string, userAnswer?: string): string {
  return `${problemId}::${userAnswer ?? ''}`;
}

export function getCachedMistakeDiagnosis(problemId: string, userAnswer?: string): MistakeDiagnosis | null {
  return diagnosisCache.get(mistakeDiagnosisCacheKey(problemId, userAnswer)) ?? null;
}

export async function requestMistakeDiagnosis(params: {
  problem: GeneratedProblem;
  userAnswer?: string;
  imageBase64?: string | null;
  mimeType?: string;
  userEmail?: string | null;
}): Promise<MistakeDiagnosis> {
  const problem = params.problem;
  const response = await fetch('/api/diagnose-mistake', {
    method: 'POST',
    headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      userAnswer: params.userAnswer ?? '',
      stepByStep: problem.explanation.stepByStep,
      keyFormula: problem.explanation.keyFormula,
      commonMistakes: problem.explanation.commonMistakes,
      imageBase64: params.imageBase64 ?? undefined,
      mimeType: params.mimeType,
      userEmail: params.userEmail,
    }),
  });

  const data = (await response.json()) as MistakeDiagnosis & { error?: string };
  if (!response.ok || typeof data.mistakeAnalysisText !== 'string' || !data.mistakeAnalysisText.trim()) {
    throw new Error(data.error || `diagnose-mistake failed: ${response.status}`);
  }
  const result: MistakeDiagnosis = {
    primaryTag: isMistakeTag(data.primaryTag) ? data.primaryTag : 'approach_unknown',
    mistakeAnalysisText: data.mistakeAnalysisText.trim(),
  };
  diagnosisCache.set(mistakeDiagnosisCacheKey(problem.id, params.userAnswer), result);
  return result;
}

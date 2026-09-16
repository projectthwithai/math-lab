// ==========================================
// Apex Suite: Math Lab - Counter-example problems client
// ==========================================

import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';

export interface GenerateCounterProblemsParams {
  questionText: string;
  customNote: string;
  aiFeedback: string;
  subject?: Subject;
  unit?: string;
  unitId?: string;
  difficulty?: number;
  userEmail?: string | null;
}

export async function requestCounterProblems(
  params: GenerateCounterProblemsParams
): Promise<GeneratedProblem[]> {
  const response = await fetch('/api/generate-counter-problems', {
    method: 'POST',
    headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      questionText: params.questionText,
      customNote: params.customNote,
      aiFeedback: params.aiFeedback,
      subject: params.subject,
      unit: params.unit,
      unitId: params.unitId,
      difficulty: params.difficulty,
      userEmail: params.userEmail,
    }),
  });

  const data = (await response.json()) as { problems?: GeneratedProblem[]; error?: string };
  if (!response.ok || !Array.isArray(data.problems) || data.problems.length === 0) {
    throw new Error(data.error || `generate-counter-problems failed: ${response.status}`);
  }
  return data.problems;
}

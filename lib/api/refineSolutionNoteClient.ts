// ==========================================
// Apex Suite: Math Lab - Refine solution note client
// ==========================================

import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';

export interface RefineSolutionNoteParams {
  originalNote: string;
  aiFeedback: string;
  questionText: string;
  keyFormula: string;
  userEmail?: string | null;
}

export async function requestRefinedSolutionNote(
  params: RefineSolutionNoteParams
): Promise<string> {
  const response = await fetch('/api/refine-solution-note', {
    method: 'POST',
    headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      originalNote: params.originalNote,
      aiFeedback: params.aiFeedback,
      questionText: params.questionText,
      keyFormula: params.keyFormula,
      userEmail: params.userEmail,
    }),
  });

  const data = (await response.json()) as { refinedNote?: string; error?: string };
  if (!response.ok || typeof data.refinedNote !== 'string' || !data.refinedNote.trim()) {
    throw new Error(data.error || `refine-solution-note failed: ${response.status}`);
  }
  return data.refinedNote.trim();
}

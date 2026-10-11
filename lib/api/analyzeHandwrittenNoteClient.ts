// ==========================================
// Apex Suite: Math Lab - Handwritten note analysis client
// ==========================================

import type { GeneratedProblem, HandwrittenNoteAnalysis } from '@/types/mathLab';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';

export async function requestHandwrittenNoteAnalysis(params: {
  imageBase64: string;
  mimeType?: string;
  problem?: GeneratedProblem | null;
  userEmail?: string | null;
}): Promise<HandwrittenNoteAnalysis> {
  const problem = params.problem;
  const response = await fetch('/api/analyze-handwritten-note', {
    method: 'POST',
    headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      imageBase64: params.imageBase64,
      mimeType: params.mimeType ?? 'image/jpeg',
      userEmail: params.userEmail,
      questionText: problem?.questionText,
      title: problem?.title,
      unit: problem?.unit,
      keyFormula: problem?.explanation.keyFormula,
      commonMistakes: problem?.explanation.commonMistakes,
      explanationSteps: problem?.explanation.stepByStep,
    }),
  });

  const data = (await response.json()) as HandwrittenNoteAnalysis & { error?: string };
  if (!response.ok || typeof data.summaryNote !== 'string' || !data.summaryNote.trim()) {
    throw new Error(data.error || `analyze-handwritten-note failed: ${response.status}`);
  }
  return {
    summaryNote: data.summaryNote.trim(),
    logicAudit: typeof data.logicAudit === 'string' ? data.logicAudit.trim() : '',
    isSound: data.isSound === true,
  };
}

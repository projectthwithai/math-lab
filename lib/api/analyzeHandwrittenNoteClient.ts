// ==========================================
// Apex Suite: Math Lab - Handwritten note analysis client
// ==========================================

import type { GeneratedProblem, HandwrittenNoteAnalysis } from '@/types/mathLab';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';
import {
  HANDWRITING_IRRELEVANT_ERROR,
  HANDWRITING_SERVER_ERROR,
  isVisionBlockedResult,
  readBlockedError,
  type VisionBlockedResult,
} from '@/lib/llm/handwritingVision';

export type HandwrittenNoteAnalysisResponse = HandwrittenNoteAnalysis | VisionBlockedResult;

export async function requestHandwrittenNoteAnalysis(params: {
  imageBase64: string;
  mimeType?: string;
  problem?: GeneratedProblem | null;
  userEmail?: string | null;
}): Promise<HandwrittenNoteAnalysisResponse> {
  const problem = params.problem;
  let response: Response;
  try {
    response = await fetch('/api/analyze-handwritten-note', {
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
  } catch {
    return { isRelevant: false, error: HANDWRITING_SERVER_ERROR };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    return { isRelevant: false, error: HANDWRITING_SERVER_ERROR };
  }

  if (isVisionBlockedResult(data) || (data && typeof data === 'object' && (data as { isRelevant?: boolean }).isRelevant === false)) {
    return { isRelevant: false, error: readBlockedError(data, HANDWRITING_IRRELEVANT_ERROR) };
  }

  if (!response.ok) {
    return { isRelevant: false, error: readBlockedError(data, HANDWRITING_SERVER_ERROR) };
  }

  const result = data as HandwrittenNoteAnalysis;
  if (typeof result.summaryNote !== 'string' || !result.summaryNote.trim()) {
    return { isRelevant: false, error: HANDWRITING_SERVER_ERROR };
  }
  return {
    isRelevant: true,
    summaryNote: result.summaryNote.trim(),
    logicAudit: typeof result.logicAudit === 'string' ? result.logicAudit.trim() : '',
    isSound: result.isSound === true,
  };
}

// ==========================================
// Apex Suite: Math Lab - Scratchpad Correction Client
// ==========================================

import type { GeneratedProblem, ScratchpadCorrectionResult } from '@/types/mathLab';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';
import {
  HANDWRITING_IRRELEVANT_ERROR,
  HANDWRITING_SERVER_ERROR,
  isVisionBlockedResult,
  readBlockedError,
  type VisionBlockedResult,
} from '@/lib/llm/handwritingVision';

export type ScratchpadCaptureSource = 'canvas' | 'paper-notebook';

export type ScratchpadCorrectionResponse = ScratchpadCorrectionResult | VisionBlockedResult;

export async function requestScratchpadCorrection(params: {
  imageBase64: string;
  mimeType?: string;
  captureSource?: ScratchpadCaptureSource;
  problem?: GeneratedProblem | null;
}): Promise<ScratchpadCorrectionResponse> {
  const problem = params.problem;
  let response: Response;
  try {
    response = await fetch('/api/correct-scratchpad', {
      method: 'POST',
      headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        imageBase64: params.imageBase64,
        mimeType: params.mimeType ?? 'image/png',
        captureSource: params.captureSource ?? 'canvas',
        context: problem
          ? {
              title: problem.title,
              unit: problem.unit,
              questionText: problem.questionText,
              keyFormula: problem.explanation.keyFormula,
              commonMistakes: problem.explanation.commonMistakes,
              explanationSteps: problem.explanation.stepByStep,
            }
          : {},
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

  const result = data as ScratchpadCorrectionResult;
  if (typeof result.summary !== 'string' || !result.summary.trim()) {
    return { isRelevant: false, error: HANDWRITING_SERVER_ERROR };
  }
  return result;
}

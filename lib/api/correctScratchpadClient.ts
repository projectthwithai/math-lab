// ==========================================
// Apex Suite: Math Lab - Scratchpad Correction Client
// ==========================================

import type { GeneratedProblem, ScratchpadCorrectionResult } from '@/types/mathLab';

export type ScratchpadCaptureSource = 'canvas' | 'paper-notebook';

export async function requestScratchpadCorrection(params: {
  imageBase64: string;
  mimeType?: string;
  captureSource?: ScratchpadCaptureSource;
  problem?: GeneratedProblem | null;
}): Promise<ScratchpadCorrectionResult> {
  const problem = params.problem;
  const response = await fetch('/api/correct-scratchpad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  if (!response.ok) {
    throw new Error(`correct-scratchpad failed: ${response.status}`);
  }

  return (await response.json()) as ScratchpadCorrectionResult;
}

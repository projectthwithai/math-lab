// ==========================================
// Apex Suite: Math Lab - Verify Custom Solution Client
// ==========================================

import type {
  CustomSolutionVerifyContext,
  CustomSolutionVerifyResult,
} from '@/types/mathLab';

export async function requestCustomSolutionVerify(
  customText: string,
  context: CustomSolutionVerifyContext
): Promise<CustomSolutionVerifyResult> {
  const response = await fetch('/api/verify-custom-solution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customText, context }),
  });

  if (!response.ok) {
    throw new Error(`verify-custom-solution failed: ${response.status}`);
  }

  return (await response.json()) as CustomSolutionVerifyResult;
}

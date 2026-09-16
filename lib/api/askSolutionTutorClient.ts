// ==========================================
// Apex Suite: Math Lab - Post-solve tutor client
// ==========================================

import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';

export interface AskSolutionTutorParams {
  questionText: string;
  userAnswer: string;
  correctAnswer: string | number;
  stepByStep: string[];
  userQuestion: string;
  customNote?: string;
  history?: Array<{ role: 'user' | 'ai'; content: string }>;
  userEmail?: string | null;
}

export async function requestSolutionTutorReply(params: AskSolutionTutorParams): Promise<string> {
  const response = await fetch('/api/ask-solution-tutor', {
    method: 'POST',
    headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      questionText: params.questionText,
      userAnswer: params.userAnswer,
      correctAnswer: params.correctAnswer,
      stepByStep: params.stepByStep,
      userQuestion: params.userQuestion,
      customNote: params.customNote,
      history: params.history,
      userEmail: params.userEmail,
    }),
  });

  const data = (await response.json()) as { reply?: string; error?: string };
  if (!response.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error(data.error || `ask-solution-tutor failed: ${response.status}`);
  }
  return data.reply.trim();
}

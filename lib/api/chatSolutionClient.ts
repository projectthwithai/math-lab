// ==========================================
// Apex Suite: Math Lab - Solution Chat Client
// ==========================================

import type { GeneratedProblem } from '@/types/mathLab';

export async function requestSolutionChatReply(params: {
  message: string;
  problem: GeneratedProblem;
  history: Array<{ role: 'user' | 'ai'; content: string }>;
}): Promise<string> {
  const response = await fetch('/api/chat-solution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      problem: params.problem,
      history: params.history,
    }),
  });

  const data = (await response.json()) as { reply?: string; error?: string };
  if (!response.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error(data.error || `chat-solution failed: ${response.status}`);
  }
  return data.reply.trim();
}

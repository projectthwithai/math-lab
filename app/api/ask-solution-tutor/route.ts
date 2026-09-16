// ==========================================
// Apex Suite: Math Lab - Post-solve context tutor API
// ==========================================
// 解答後の解説を踏まえた質問に、ハイブリッドAIルーター経由で答える。

import { NextResponse } from 'next/server';
import { extractModelTextReply, resolveRouterUserEmail, routeLlmText } from '@/lib/engine/aiRouter';
import { buildAskSolutionTutorMockReply } from '@/lib/mock/askSolutionTutorMock';

export const maxDuration = 30;

interface ChatTurn {
  role: 'user' | 'ai';
  content: string;
}

const TUTOR_SYSTEM_PROMPT =
  'あなたはMath Labの親身な専属チューターです。生徒はこの問題を解き終えて解説を読んでいますが、まだ疑問があります。問題・生徒の誤答・公式解説のすべてを完全に踏まえた上で、質問に対して数式（LaTeX）を交えて噛み砕いて優しく教えてあげてください。';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readAnswer(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return readString(value);
}

function parseStepByStep(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function parseHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ChatTurn | null => {
      if (!item || typeof item !== 'object') return null;
      const source = item as Record<string, unknown>;
      const role = source.role === 'ai' || source.role === 'user' ? source.role : null;
      const content = readString(source.content);
      if (!role || !content) return null;
      return { role, content };
    })
    .filter((item): item is ChatTurn => item !== null)
    .slice(-8);
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const questionText = readString(body.questionText);
  const userAnswer = readAnswer(body.userAnswer);
  const correctAnswer = readAnswer(body.correctAnswer);
  const stepByStep = parseStepByStep(body.stepByStep);
  const userQuestion = readString(body.userQuestion);
  const customNote = readString(body.customNote);
  const history = parseHistory(body.history);
  const userEmail = await resolveRouterUserEmail(request, body.userEmail);

  if (!questionText || !userQuestion) {
    return NextResponse.json(
      { error: '問題文と質問テキストが必要です。' },
      { status: 400 }
    );
  }

  const systemPrompt = customNote
    ? `${TUTOR_SYSTEM_PROMPT}\n\n【生徒が書いた自分流の解法メモ】: ${customNote}\n生徒から自分の解法やメモについての質問があった場合は、生徒の解法メモを綿密に精査し、①数学的・科学的に正しいか、②他の類似問題でも通用する汎用性があるか、③入試で減点されないための改善点、を具体的にアドバイスしてください。`
    : TUTOR_SYSTEM_PROMPT;

  const userPrompt = [
    '以下のコンテキストを完全に踏まえて、生徒の質問に日本語で答えてください。',
    '数式は $...$ の LaTeX で書いてください。正解を突きつけるだけでなく、なぜそうなるかを噛み砕くこと。',
    '',
    `【問題文】\n${questionText}`,
    `【生徒が書いた答え】\n${userAnswer || '（未入力）'}`,
    `【正解】\n${correctAnswer || '（未記載）'}`,
    `【公式解説ステップ】\n${stepByStep.map((step, index) => `${index + 1}. ${step}`).join('\n') || '（なし）'}`,
    customNote ? `【生徒が書いた自分流の解法メモ】\n${customNote}` : '',
    history.length > 0
      ? `【直前のやり取り】\n${history.map((turn) => `${turn.role === 'user' ? '生徒' : 'チューター'}: ${turn.content}`).join('\n')}`
      : '',
    `【生徒の質問】\n${userQuestion}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const routed = await routeLlmText({
      systemPrompt,
      userPrompt,
      userEmail,
      temperature: 0.45,
      timeoutMs: 18000,
      maxGeminiAttempts: 3,
    });
    const reply = routed ? extractModelTextReply(routed.text) : '';
    if (reply) {
      return NextResponse.json({ reply, source: routed?.provider ?? 'gemini' });
    }
  } catch (error) {
    console.error('[ask-solution-tutor] AI 呼び出しに失敗', error);
  }

  return NextResponse.json({
    reply: buildAskSolutionTutorMockReply({
      userQuestion,
      questionText,
      userAnswer,
      correctAnswer,
      stepByStep,
      customNote,
    }),
    source: 'fallback',
  });
}

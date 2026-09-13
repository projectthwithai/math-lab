// ==========================================
// Apex Suite: Math Lab - Solution Chat API
// ==========================================
// 別解壁打ち。GEMINI_API_KEY で Gemini Flash 直通。
// 未設定・タイムアウト時のみローカル短文へフォールバック。

import { NextResponse } from 'next/server';
import type { GeneratedProblem } from '@/types/mathLab';
import { completeGeminiJson } from '@/lib/llm/completeJson';
import { buildChatSolutionMockReply } from '@/lib/mock/chatSolutionMock';

export const maxDuration = 30;

interface ChatTurn {
  role: 'user' | 'ai';
  content: string;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

function parseProblem(raw: unknown): GeneratedProblem | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const title = readString(source.title);
  const questionText = readString(source.questionText);
  if (!title || !questionText) return null;

  const explanation =
    source.explanation && typeof source.explanation === 'object'
      ? (source.explanation as Record<string, unknown>)
      : {};
  const hintsRaw = Array.isArray(source.hints)
    ? source.hints.filter((item): item is string => typeof item === 'string')
    : [];
  const steps = Array.isArray(explanation.stepByStep)
    ? explanation.stepByStep.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id: readString(source.id) || 'chat-problem',
    subject:
      source.subject === 'physics' || source.subject === 'chemistry' ? source.subject : 'math',
    unit: readString(source.unit) || '総合',
    title,
    difficulty: typeof source.difficulty === 'number' ? source.difficulty : 3,
    format: source.format === 'choice' || source.format === 'descriptive' ? source.format : 'input',
    questionText,
    visualType: 'none',
    visualConfig: { type: 'none', params: {} },
    correctAnswer:
      typeof source.correctAnswer === 'string' || typeof source.correctAnswer === 'number'
        ? source.correctAnswer
        : '',
    hints: [hintsRaw[0] ?? '', hintsRaw[1] ?? '', hintsRaw[2] ?? ''],
    explanation: {
      stepByStep: steps,
      keyFormula: typeof explanation.keyFormula === 'string' ? explanation.keyFormula : '',
      commonMistakes: typeof explanation.commonMistakes === 'string' ? explanation.commonMistakes : '',
    },
  };
}

function extractReply(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const source = parsed as Record<string, unknown>;
  const reply = readString(source.reply) || readString(source.advice) || readString(source.message);
  return reply.length > 0 ? reply : null;
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const message = readString(body.message);
  const problem = parseProblem(body.problem);
  const history = parseHistory(body.history);

  if (!message || !problem) {
    return NextResponse.json({ error: 'メッセージと問題コンテキストが必要です。' }, { status: 400 });
  }

  const systemPrompt =
    'あなたは高校生に寄り添う数学・物理・化学の別解コーチである。' +
    '出力はJSONのみ。キーは reply のみ。' +
    'reply は日本語で最大3文。親身だが論理は厳格。' +
    'ユーザーの別解・方針に論理的飛躍、適用条件の漏れ、反例になりうるケースがないかを本気で検証する。' +
    '正解の数値を先に教えず、考え方の可否と直すべき一点を具体的に述べる。' +
    '数式は $...$ の LaTeX で書いてよい。';

  const userPrompt = JSON.stringify({
    userMessage: message,
    recentHistory: history,
    problem: {
      title: problem.title,
      unit: problem.unit,
      subject: problem.subject,
      difficulty: problem.difficulty,
      questionText: problem.questionText,
      keyFormula: problem.explanation?.keyFormula,
      stepByStep: problem.explanation?.stepByStep,
      commonMistakes: problem.explanation?.commonMistakes,
      hints: problem.hints,
      correctAnswer: problem.correctAnswer,
    },
    outputSchema: { reply: 'string (max 3 sentences, Japanese)' },
  });

  try {
    const parsed = await completeGeminiJson({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      timeoutMs: 18000,
      maxGeminiAttempts: 3,
    });
    const reply = extractReply(parsed);
    if (reply) {
      return NextResponse.json({ reply, source: 'gemini' });
    }
  } catch (error) {
    console.error('[chat-solution] Gemini 呼び出しに失敗', error);
  }

  return NextResponse.json({
    reply: buildChatSolutionMockReply(message, problem),
    source: 'fallback',
  });
}

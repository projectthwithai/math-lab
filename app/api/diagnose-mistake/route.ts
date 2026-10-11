// ==========================================
// Apex Suite: Math Lab - Mistake diagnosis API
// ==========================================
// 不正解時に、生徒の解答（または手書きノート画像）と公式解説を突き合わせ、
// 真の失点原因を1〜2文で言語化する。指揮官は Gemini 永久固定。

import { NextResponse } from 'next/server';
import type { MistakeDiagnosis } from '@/types/mathLab';
import { diagnoseMistakeMock } from '@/lib/mock/diagnoseMistakeMock';
import { isMistakeTag } from '@/lib/engine/mistakeTags';
import { resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';
import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';

const MAX_IMAGE_CHARS = 6_000_000;

export const maxDuration = 45;

interface ParsedImage {
  base64: string;
  mimeType: string;
}

const SYSTEM_PROMPT =
  '生徒はこの問題で不正解になりました。生徒の解答や手書きノートを公式解説と突き合わせ、' +
  "生徒が『どの段階で・なぜ・どんな勘違いや計算ミス、条件見落としをして間違えたのか』という真の失点原因を、" +
  '高校生に寄り添って鋭く1~2文で言語化してください。また、最も当てはまるミス原因タグ ' +
  "('calc_error' | 'condition_overlook' | 'formula_unknown' | 'approach_unknown') を特定してください。" +
  '出力はJSONのみ。キーは primaryTag, mistakeAnalysisText。' +
  'mistakeAnalysisText は「専属ガイド: 」で始め、1〜2文の日本語にする。数式は $...$ で書いてよい。絵文字は使わない。';

function stripDataUrl(raw: string): ParsedImage {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/jpeg', base64: raw.replace(/\s/g, '') };
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeDiagnosis(raw: unknown, fallback: MistakeDiagnosis): MistakeDiagnosis {
  if (!raw || typeof raw !== 'object') return fallback;
  const source = raw as Record<string, unknown>;
  const text =
    typeof source.mistakeAnalysisText === 'string' && source.mistakeAnalysisText.trim()
      ? source.mistakeAnalysisText.trim()
      : fallback.mistakeAnalysisText;
  const stripped = stripUnicodeEmoji(text).replace(/^(AI分析|専属ガイド):\s*/, '');
  const prefixed = `専属ガイド: ${stripped}`;
  return {
    primaryTag: isMistakeTag(source.primaryTag) ? source.primaryTag : fallback.primaryTag,
    mistakeAnalysisText: prefixed,
  };
}

async function diagnoseViaLlm(params: {
  questionText?: string;
  correctAnswer?: string;
  userAnswer?: string;
  stepByStep?: string[];
  keyFormula?: string;
  commonMistakes?: string;
  image?: ParsedImage | null;
  userEmail?: string;
}): Promise<MistakeDiagnosis | null> {
  const userPrompt = JSON.stringify({
    task: '不正解の真の失点原因を1〜2文で診断し、ミス原因タグを1つ選ぶ',
    questionText: params.questionText ?? '',
    correctAnswer: params.correctAnswer ?? '',
    userAnswer: params.userAnswer ?? '',
    officialExplanation: {
      stepByStep: params.stepByStep ?? [],
      keyFormula: params.keyFormula ?? '',
      commonMistakes: params.commonMistakes ?? '',
    },
    outputSchema: {
      primaryTag: 'calc_error | condition_overlook | formula_unknown | approach_unknown',
      mistakeAnalysisText: 'string',
    },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      image: params.image
        ? { mimeType: params.image.mimeType, base64: params.image.base64 }
        : undefined,
      userEmail: params.userEmail,
      temperature: 0.25,
      timeoutMs: 18000,
      maxGeminiAttempts: 3,
    });
    if (!routed?.data) return null;
    return normalizeDiagnosis(
      routed.data,
      diagnoseMistakeMock({
        questionText: params.questionText,
        userAnswer: params.userAnswer,
        correctAnswer: params.correctAnswer,
      })
    );
  } catch (error) {
    console.error('[diagnose-mistake] 診断に失敗、モックにフォールバックします', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const userEmail = await resolveRouterUserEmail(request, body.userEmail);
  const questionText = readOptionalString(body, 'questionText');
  const userAnswer = readOptionalString(body, 'userAnswer');
  const correctAnswerRaw = body.correctAnswer;
  const correctAnswer =
    typeof correctAnswerRaw === 'string' || typeof correctAnswerRaw === 'number'
      ? String(correctAnswerRaw)
      : undefined;
  const keyFormula = readOptionalString(body, 'keyFormula');
  const commonMistakes = readOptionalString(body, 'commonMistakes');
  const stepByStep = Array.isArray(body.stepByStep)
    ? body.stepByStep.filter((step): step is string => typeof step === 'string')
    : undefined;

  const rawImage =
    typeof body.imageBase64 === 'string' ? body.imageBase64 : typeof body.image === 'string' ? body.image : '';
  let image: ParsedImage | null = rawImage.trim() ? stripDataUrl(rawImage.trim()) : null;
  if (image && typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')) {
    image.mimeType = body.mimeType;
  }
  if (image && image.base64.length > MAX_IMAGE_CHARS) {
    image = null;
  }

  const viaLlm = await diagnoseViaLlm({
    questionText,
    correctAnswer,
    userAnswer,
    stepByStep,
    keyFormula,
    commonMistakes,
    image,
    userEmail,
  });

  return NextResponse.json(
    viaLlm ??
      diagnoseMistakeMock({
        questionText,
        userAnswer,
        correctAnswer,
      })
  );
}

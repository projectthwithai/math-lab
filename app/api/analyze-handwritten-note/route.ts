// ==========================================
// Apex Suite: Math Lab - Handwritten notebook Vision API
// ==========================================
// 紙ノート写真を Gemini 1.5 Flash (Vision) で文字起こしし、論理デバッグする。
// 無関係画像は捏造せず即ブロック。通信失敗時もダミー要約は返さない。

import { NextResponse } from 'next/server';
import type { HandwrittenNoteAnalysis } from '@/types/mathLab';
import { resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';
import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';
import {
  HANDWRITING_IRRELEVANT_ERROR,
  HANDWRITING_SERVER_ERROR,
  buildHandwrittenNoteVisionSystemPrompt,
  isVisionBlockedResult,
  readBlockedError,
  visionBlockedPayload,
} from '@/lib/llm/handwritingVision';

const MAX_IMAGE_CHARS = 6_000_000;

export const maxDuration = 45;

interface ParsedImage {
  base64: string;
  mimeType: string;
}

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

async function parseIncoming(request: Request): Promise<{
  image: ParsedImage | null;
  body: Record<string, unknown>;
}> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('image') ?? form.get('file');
    let image: ParsedImage | null = null;
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      image = { base64: buffer.toString('base64'), mimeType: file.type || 'image/jpeg' };
    } else {
      const raw = form.get('imageBase64');
      if (typeof raw === 'string' && raw.trim()) image = stripDataUrl(raw.trim());
    }
    const body: Record<string, unknown> = {};
    for (const key of ['questionText', 'title', 'unit', 'keyFormula', 'commonMistakes', 'userEmail']) {
      const value = form.get(key);
      if (typeof value === 'string') body[key] = value;
    }
    return { image, body };
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const raw =
      typeof body.imageBase64 === 'string' ? body.imageBase64 : typeof body.image === 'string' ? body.image : '';
    const image = raw.trim() ? stripDataUrl(raw.trim()) : null;
    if (image && typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')) {
      image.mimeType = body.mimeType;
    }
    return { image, body };
  } catch {
    return { image: null, body: {} };
  }
}

function isValidAnalysis(raw: unknown): raw is HandwrittenNoteAnalysis {
  if (!raw || typeof raw !== 'object') return false;
  const source = raw as Record<string, unknown>;
  if (source.isRelevant === false) return false;
  return typeof source.summaryNote === 'string' && source.summaryNote.trim().length > 0;
}

function blockedResponse(error: string, status: number): Response {
  return NextResponse.json(visionBlockedPayload(error), { status });
}

async function analyzeViaVision(
  image: ParsedImage,
  context: { title?: string; unit?: string; questionText?: string; keyFormula?: string; commonMistakes?: string },
  userEmail?: string
): Promise<HandwrittenNoteAnalysis | { isRelevant: false; error: string } | null> {
  const userPrompt = JSON.stringify({
    task: '紙ノート写真を精査し、手書き数式が無ければ isRelevant:false。あれば実記述を引用して要約と論理デバッグを返す',
    problem: {
      title: context.title ?? '',
      unit: context.unit ?? '',
      questionText: context.questionText ?? '',
      keyFormula: context.keyFormula ?? '',
      commonMistakes: context.commonMistakes ?? '',
    },
    outputSchema: {
      isRelevant: 'boolean',
      error: 'string (isRelevant が false のとき必須)',
      summaryNote: 'string（引用した手書き式を含む）',
      logicAudit: 'string',
      isSound: 'boolean',
    },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt: buildHandwrittenNoteVisionSystemPrompt(),
      userPrompt,
      image: { mimeType: image.mimeType, base64: image.base64 },
      userEmail,
      temperature: 0.2,
      timeoutMs: 22000,
      maxGeminiAttempts: 3,
    });
    const parsed = routed?.data;
    if (isVisionBlockedResult(parsed)) {
      return visionBlockedPayload(readBlockedError(parsed, HANDWRITING_IRRELEVANT_ERROR));
    }
    if (!isValidAnalysis(parsed)) return null;
    return {
      isRelevant: true,
      summaryNote: stripUnicodeEmoji(parsed.summaryNote).trim(),
      logicAudit: typeof parsed.logicAudit === 'string' ? stripUnicodeEmoji(parsed.logicAudit).trim() : '',
      isSound: parsed.isSound === true,
    };
  } catch (error) {
    console.error('[analyze-handwritten-note] Vision解析に失敗しました', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { image, body } = await parseIncoming(request);
    const userEmail = await resolveRouterUserEmail(request, body.userEmail);
    const context = {
      title: readOptionalString(body, 'title'),
      unit: readOptionalString(body, 'unit'),
      questionText: readOptionalString(body, 'questionText'),
      keyFormula: readOptionalString(body, 'keyFormula'),
      commonMistakes: readOptionalString(body, 'commonMistakes'),
    };

    if (!image || !image.base64 || image.base64.length > MAX_IMAGE_CHARS) {
      return blockedResponse(HANDWRITING_IRRELEVANT_ERROR, 200);
    }

    const viaVision = await analyzeViaVision(image, context, userEmail);
    if (viaVision && 'isRelevant' in viaVision && viaVision.isRelevant === false) {
      return NextResponse.json(viaVision);
    }
    if (viaVision && 'summaryNote' in viaVision) {
      return NextResponse.json(viaVision);
    }
    return blockedResponse(HANDWRITING_SERVER_ERROR, 503);
  } catch (error) {
    console.error('[analyze-handwritten-note] 通信エラー', error);
    return blockedResponse(HANDWRITING_SERVER_ERROR, 503);
  }
}

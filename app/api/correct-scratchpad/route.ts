// ==========================================
// Apex Suite: Math Lab - Scratchpad Red-Pen API
// ==========================================
// 手書きキャンバス／紙ノート画像を Gemini Vision で OCR・赤ペン添削する。
// 無関係画像は捏造せず即ブロック。通信失敗時もダミー添削は返さない。

import { NextResponse } from 'next/server';
import type {
  ScratchpadCommentSeverity,
  ScratchpadCorrectionComment,
  ScratchpadCorrectionOverall,
  ScratchpadCorrectionResult,
} from '@/types/mathLab';
import { resolveRouterUserEmail } from '@/lib/engine/aiRouter';
import { callGeminiVisionJson } from '@/lib/engine/geminiVisionCaller';
import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';
import { formatAiAnalysisError } from '@/lib/llm/imageAnalysisVision';
import {
  HANDWRITING_IRRELEVANT_ERROR,
  buildScratchpadVisionSystemPrompt,
  isVisionBlockedResult,
  readBlockedError,
  visionBlockedPayload,
} from '@/lib/llm/handwritingVision';

const MAX_IMAGE_CHARS = 6_000_000;
const OVERALLS: ScratchpadCorrectionOverall[] = ['good', 'needs_fix', 'empty'];
const SEVERITIES: ScratchpadCommentSeverity[] = ['error', 'warning', 'ok'];

interface ParsedImage {
  base64: string;
  mimeType: string;
}

interface CorrectionContext {
  questionText?: string;
  title?: string;
  unit?: string;
  commonMistakes?: string;
  explanationSteps?: string[];
  keyFormula?: string;
  captureSource?: 'canvas' | 'paper-notebook';
}

export const maxDuration = 60; // タイムアウトを最大60秒に延長
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function stripDataUrl(rawBase64: string): ParsedImage {
  const trimmed = rawBase64.trim();
  const mimeTypeMatch = trimmed.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const cleanBase64 = trimmed
    .replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
    .replace(/\s+/g, '')
    .trim();
  return { mimeType, base64: cleanBase64 };
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseContext(raw: unknown): CorrectionContext {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const context: CorrectionContext = {
    questionText: readOptionalString(source, 'questionText'),
    title: readOptionalString(source, 'title'),
    unit: readOptionalString(source, 'unit'),
    commonMistakes: readOptionalString(source, 'commonMistakes'),
    keyFormula: readOptionalString(source, 'keyFormula'),
  };
  if (Array.isArray(source.explanationSteps)) {
    context.explanationSteps = source.explanationSteps.filter(
      (step): step is string => typeof step === 'string'
    );
  }
  return context;
}

function parseCaptureSource(raw: unknown): 'canvas' | 'paper-notebook' {
  return raw === 'paper-notebook' ? 'paper-notebook' : 'canvas';
}

function parseIncoming(body: Record<string, unknown>): { image: ParsedImage | null; context: CorrectionContext } {
  const raw =
    typeof body.imageBase64 === 'string'
      ? body.imageBase64
      : typeof body.image === 'string'
        ? body.image
        : '';
  const image = raw.trim() ? stripDataUrl(raw.trim()) : null;
  if (image && typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')) {
    image.mimeType = body.mimeType;
  }
  const context = parseContext(body.context ?? body);
  context.captureSource = parseCaptureSource(body.captureSource);
  return { image, context };
}

function normalizeComments(raw: unknown): ScratchpadCorrectionComment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ScratchpadCorrectionComment | null => {
      if (!item || typeof item !== 'object') return null;
      const source = item as Record<string, unknown>;
      if (typeof source.text !== 'string') return null;
      const text = stripUnicodeEmoji(source.text).trim();
      if (!text) return null;
      const severity = SEVERITIES.includes(source.severity as ScratchpadCommentSeverity)
        ? (source.severity as ScratchpadCommentSeverity)
        : 'warning';
      const line =
        typeof source.line === 'number' && Number.isFinite(source.line) && source.line > 0
          ? Math.round(source.line)
          : undefined;
      return { line, severity, text };
    })
    .filter((item): item is ScratchpadCorrectionComment => item !== null);
}

function isCorrectionResult(value: unknown): value is ScratchpadCorrectionResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.isRelevant === false) return false;
  return (
    OVERALLS.includes(candidate.overall as ScratchpadCorrectionOverall) &&
    typeof candidate.summary === 'string' &&
    candidate.summary.trim().length > 0
  );
}

function blockedResponse(error: string, status: number): Response {
  return NextResponse.json(visionBlockedPayload(error), { status });
}

async function correctViaVision(
  image: ParsedImage,
  context: CorrectionContext
): Promise<ScratchpadCorrectionResult | { isRelevant: false; error: string }> {
  const isPaper = context.captureSource === 'paper-notebook';
  const userText = JSON.stringify({
    task: isPaper
      ? '紙ノート写真を精査し、手書き数式が無ければ isRelevant:false。あれば実記述を引用して赤ペン添削する。'
      : '手書きキャンバスを精査し、数式が無ければ isRelevant:false。あれば実記述を引用して赤ペン添削する。',
    problem: {
      title: context.title ?? '',
      unit: context.unit ?? '',
      questionText: context.questionText ?? '',
      keyFormula: context.keyFormula ?? '',
      commonMistakes: context.commonMistakes ?? '',
      explanationSteps: context.explanationSteps ?? [],
    },
    outputSchema: {
      isRelevant: 'boolean',
      error: 'string (isRelevant が false のとき必須)',
      overall: 'good | needs_fix',
      summary: 'string（引用した手書き式を含む）',
      comments: [{ line: 'number (optional, 1-based)', severity: 'error | warning | ok', text: 'string（実記述の引用必須）' }],
    },
  });

  const parsed = await callGeminiVisionJson({
    systemPrompt: buildScratchpadVisionSystemPrompt(isPaper),
    userPrompt: userText,
    image: { mimeType: image.mimeType || 'image/jpeg', base64: image.base64 },
    temperature: 0.2,
    timeoutMs: 55_000,
  });
  if (isVisionBlockedResult(parsed) || (parsed && typeof parsed === 'object' && (parsed as { overall?: string }).overall === 'empty')) {
    return visionBlockedPayload(readBlockedError(parsed, HANDWRITING_IRRELEVANT_ERROR));
  }
  if (!isCorrectionResult(parsed)) {
    throw new Error('添削 JSON が不完全です');
  }

  const comments = normalizeComments(parsed.comments);
  return {
    isRelevant: true,
    overall: parsed.overall === 'empty' ? 'needs_fix' : parsed.overall,
    summary: stripUnicodeEmoji(parsed.summary).trim(),
    comments,
    source: 'llm',
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  await resolveRouterUserEmail(request, body.userEmail);
  const { image, context } = parseIncoming(body);
  if (!image || !image.base64 || image.base64.length > MAX_IMAGE_CHARS) {
    return blockedResponse(HANDWRITING_IRRELEVANT_ERROR, 200);
  }

  try {
    const viaVision = await correctViaVision(image, context);
    if (viaVision && 'isRelevant' in viaVision && viaVision.isRelevant === false) {
      return NextResponse.json(viaVision);
    }
    if (viaVision && 'overall' in viaVision) {
      return NextResponse.json(viaVision);
    }
    throw new Error('通信エラー');
  } catch (error) {
    console.error('Gemini Vision Error:', error);
    return blockedResponse(formatAiAnalysisError(error), 200);
  }
}

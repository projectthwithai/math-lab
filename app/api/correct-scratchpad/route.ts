// ==========================================
// Apex Suite: Math Lab - Scratchpad Red-Pen API
// ==========================================
// 手書きキャンバス画像（base64）を Gemini 1.5 Flash Vision で OCR・赤ペン添削する。
// GEMINI_API_KEY 最優先。未設定・タイムアウト時のみローカル mock。

import { NextResponse } from 'next/server';
import type {
  ScratchpadCommentSeverity,
  ScratchpadCorrectionComment,
  ScratchpadCorrectionOverall,
  ScratchpadCorrectionResult,
} from '@/types/mathLab';
import { correctScratchpadMock } from '@/lib/mock/correctScratchpadMock';
import { completeGeminiJson } from '@/lib/llm/completeJson';

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
}

function stripDataUrl(raw: string): ParsedImage {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/png', base64: raw.replace(/\s/g, '') };
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
  return { image, context: parseContext(body.context ?? body) };
}

function normalizeComments(raw: unknown): ScratchpadCorrectionComment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ScratchpadCorrectionComment | null => {
      if (!item || typeof item !== 'object') return null;
      const source = item as Record<string, unknown>;
      if (typeof source.text !== 'string' || !source.text.trim()) return null;
      const severity = SEVERITIES.includes(source.severity as ScratchpadCommentSeverity)
        ? (source.severity as ScratchpadCommentSeverity)
        : 'warning';
      const line =
        typeof source.line === 'number' && Number.isFinite(source.line) && source.line > 0
          ? Math.round(source.line)
          : undefined;
      return { line, severity, text: source.text.trim() };
    })
    .filter((item): item is ScratchpadCorrectionComment => item !== null);
}

function isCorrectionResult(value: unknown): value is ScratchpadCorrectionResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    OVERALLS.includes(candidate.overall as ScratchpadCorrectionOverall) &&
    typeof candidate.summary === 'string' &&
    candidate.summary.trim().length > 0
  );
}

export const maxDuration = 45;

async function correctViaVision(
  image: ParsedImage,
  context: CorrectionContext
): Promise<ScratchpadCorrectionResult | null> {
  const systemPrompt =
    'あなたは高校生の手書き途中式を赤ペンで添削する数学・物理・化学の教師です。' +
    '画像をOCRし、書かれている文字・数式・計算ステップを実際に読み取る。読めない部分は断定しない。' +
    '出力はJSONのみ。キーは overall, summary, comments。' +
    'overall は good / needs_fix / empty。' +
    'comments は { line?, severity, text } の配列。severity は error / warning / ok。' +
    'text は必ずピンポイントな赤ペン指導にする。例:' +
    '「2行目の計算で符号が逆です」「余弦定理への辺の代入ミスです」' +
    '「考え方は完璧です。計算を最後まで進めましょう」。' +
    '正解の最終値を先に教えず、どこが論理的・計算的に危ういかを具体的に指す。' +
    '空欄・ほぼ白紙なら overall=empty。数式は $...$ の LaTeX で書いてよい。';

  const userText = JSON.stringify({
    task: '手書き画像をOCRしたうえで赤ペン添削してください。行番号が読み取れるなら line を付ける。',
    problem: {
      title: context.title ?? '',
      unit: context.unit ?? '',
      questionText: context.questionText ?? '',
      keyFormula: context.keyFormula ?? '',
      commonMistakes: context.commonMistakes ?? '',
      explanationSteps: context.explanationSteps ?? [],
    },
    outputSchema: {
      overall: 'good | needs_fix | empty',
      summary: 'string',
      comments: [{ line: 'number (optional, 1-based)', severity: 'error | warning | ok', text: 'string' }],
    },
  });

  try {
    const parsed = await completeGeminiJson({
      systemPrompt,
      userPrompt: userText,
      image: { mimeType: image.mimeType, base64: image.base64 },
      temperature: 0.2,
      timeoutMs: 22000,
      maxGeminiAttempts: 3,
    });
    if (!isCorrectionResult(parsed)) return null;

    const comments = normalizeComments((parsed as ScratchpadCorrectionResult).comments);
    return {
      overall: parsed.overall,
      summary: parsed.summary.trim(),
      comments,
      source: 'llm',
    };
  } catch (error) {
    console.error('[correct-scratchpad] Vision添削に失敗、モックにフォールバックします', error);
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

  const { image, context } = parseIncoming(body);
  if (!image || !image.base64 || image.base64.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(
      correctScratchpadMock({
        ...context,
        imageByteLength: 0,
      })
    );
  }

  const viaVision = await correctViaVision(image, context);
  return NextResponse.json(
    viaVision ??
      correctScratchpadMock({
        ...context,
        imageByteLength: image.base64.length,
      })
  );
}

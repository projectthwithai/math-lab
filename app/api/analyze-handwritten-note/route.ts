// ==========================================
// Apex Suite: Math Lab - Handwritten notebook Vision API
// ==========================================
// 紙ノート写真を Gemini 1.5 Flash (Vision) で文字起こしし、論理デバッグする。
// 指揮官は Gemini 永久固定。未設定・失敗時はローカル mock。

import { NextResponse } from 'next/server';
import type { HandwrittenNoteAnalysis } from '@/types/mathLab';
import { analyzeHandwrittenNoteMock } from '@/lib/mock/analyzeHandwrittenNoteMock';
import { resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';

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

function normalizeResult(raw: unknown, fallback: HandwrittenNoteAnalysis): HandwrittenNoteAnalysis {
  if (!raw || typeof raw !== 'object') return fallback;
  const source = raw as Record<string, unknown>;
  const summaryNote =
    typeof source.summaryNote === 'string' && source.summaryNote.trim()
      ? source.summaryNote.trim()
      : fallback.summaryNote;
  const logicAudit =
    typeof source.logicAudit === 'string' && source.logicAudit.trim()
      ? source.logicAudit.trim()
      : fallback.logicAudit;
  return {
    summaryNote,
    logicAudit,
    isSound: source.isSound === true,
  };
}

async function analyzeViaVision(
  image: ParsedImage,
  context: { title?: string; unit?: string; questionText?: string; keyFormula?: string; commonMistakes?: string },
  userEmail?: string
): Promise<HandwrittenNoteAnalysis | null> {
  const systemPrompt =
    'あなたは高校生の紙ノートを読み取る数学・物理・化学の教師です。' +
    '手書きの論理ステップを文字起こしして要約し、そのうえで論理デバッグする。' +
    '論理の飛躍がないか、使っている公式の前提条件は満たされているかを見る。' +
    '出力はJSONのみ。キーは summaryNote, logicAudit, isSound。' +
    'summaryNote は生徒の自分流解法メモとして使える、読み取り結果の要約（日本語、数式は $...$）。' +
    'logicAudit は飛躍・前提条件の抜けを高校生に寄り添って1〜3文で書く。' +
    'isSound は論理が破綻なく前提も足りていれば true、飛躍や条件不足があれば false。' +
    '正解の最終値を先に教えず、ノートに書いてあることだけを根拠にする。読めない箇所は断定しない。';

  const userPrompt = JSON.stringify({
    task: '紙ノート写真をOCRし、解法メモ用の要約と論理デバッグを返す',
    problem: {
      title: context.title ?? '',
      unit: context.unit ?? '',
      questionText: context.questionText ?? '',
      keyFormula: context.keyFormula ?? '',
      commonMistakes: context.commonMistakes ?? '',
    },
    outputSchema: {
      summaryNote: 'string',
      logicAudit: 'string',
      isSound: 'boolean',
    },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt,
      userPrompt,
      image: { mimeType: image.mimeType, base64: image.base64 },
      userEmail,
      temperature: 0.2,
      timeoutMs: 22000,
      maxGeminiAttempts: 3,
    });
    if (!routed?.data) return null;
    return normalizeResult(routed.data, analyzeHandwrittenNoteMock({ ...context, hasImage: true }));
  } catch (error) {
    console.error('[analyze-handwritten-note] Vision解析に失敗、モックにフォールバックします', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
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
    return NextResponse.json(analyzeHandwrittenNoteMock({ ...context, hasImage: false }));
  }

  const viaVision = await analyzeViaVision(image, context, userEmail);
  return NextResponse.json(viaVision ?? analyzeHandwrittenNoteMock({ ...context, hasImage: true }));
}

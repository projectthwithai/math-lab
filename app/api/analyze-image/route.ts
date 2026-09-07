// ==========================================
// Apex Suite: Math Lab - Image Structure Analysis API
// ==========================================
// 著作権安全化:
// - 画像内の原問テキスト・設定・数値を出力・保存しない。
// - 解法構造（単元・手法・条件の種類）だけを抽出し、
//   100%オリジナルの新規創作問題とパターンカードだけを返す。
// .cursorrules: gpt-4o-mini (Vision) 優先。未設定・失敗時はローカル mock。

import { NextResponse } from 'next/server';
import type { ImageAnalysisResult, ImageLogicSummary, SolutionPattern, Subject } from '@/types/mathLab';
import { analyzeImageMock } from '@/lib/mock/analyzeImageMock';
import { problemFromPayload } from '@/lib/engine/problemFromPayload';
import { resolvePromptIntent } from '@/lib/engine/promptIntent';

const MAX_IMAGE_CHARS = 6_000_000;

interface ParsedImage {
  base64: string;
  mimeType: string;
}

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function stripDataUrl(raw: string): ParsedImage {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/jpeg', base64: raw.replace(/\s/g, '') };
}

async function parseIncomingImage(request: Request): Promise<ParsedImage | null> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('image') ?? form.get('file');
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || 'image/jpeg';
      return { base64: buffer.toString('base64'), mimeType };
    }
    const raw = form.get('imageBase64');
    if (typeof raw === 'string' && raw.trim()) return stripDataUrl(raw.trim());
    return null;
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const raw =
      typeof body.imageBase64 === 'string' ? body.imageBase64 : typeof body.image === 'string' ? body.image : '';
    if (!raw.trim()) return null;
    const parsed = stripDataUrl(raw.trim());
    if (typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')) {
      parsed.mimeType = body.mimeType;
    }
    return parsed;
  } catch {
    return null;
  }
}

function logicFromPayload(raw: unknown, fallback: ImageLogicSummary): ImageLogicSummary {
  if (!raw || typeof raw !== 'object') return fallback;
  const source = raw as Record<string, unknown>;
  const techniques = Array.isArray(source.techniques)
    ? source.techniques.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback.techniques;
  return {
    subject: isSubject(source.subject) ? source.subject : fallback.subject,
    unit: typeof source.unit === 'string' && source.unit.trim() ? source.unit.trim() : fallback.unit,
    techniques: techniques.length > 0 ? techniques : fallback.techniques,
  };
}

function patternFromPayload(raw: unknown, fallback: SolutionPattern): SolutionPattern {
  if (!raw || typeof raw !== 'object') return fallback;
  const source = raw as Record<string, unknown>;
  return {
    ...fallback,
    patternName:
      typeof source.patternName === 'string' && source.patternName.trim()
        ? source.patternName.trim()
        : fallback.patternName,
    strategyText:
      typeof source.strategyText === 'string' && source.strategyText.trim()
        ? source.strategyText.trim()
        : fallback.strategyText,
    exampleQuestion:
      typeof source.exampleQuestion === 'string' && source.exampleQuestion.trim()
        ? source.exampleQuestion.trim()
        : fallback.exampleQuestion,
    unit: typeof source.unit === 'string' && source.unit.trim() ? source.unit.trim() : fallback.unit,
    subject: isSubject(source.subject) ? source.subject : fallback.subject,
    level:
      source.level === 'basic' || source.level === 'standard' || source.level === 'advanced'
        ? source.level
        : fallback.level,
  };
}

function sanitizeOriginalCopy(result: ImageAnalysisResult): ImageAnalysisResult {
  return {
    logic: result.logic,
    variantProblem: result.variantProblem,
    pattern: result.pattern,
    source: result.source,
  };
}

async function analyzeViaVision(image: ParsedImage): Promise<ImageAnalysisResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt =
    'あなたは高校の数学・物理・化学の「解法構造」だけを抽出する教師です。' +
    '著作権遵守が最優先。画像内の問題文・文章・固有の設定・数値・図表の文言を' +
    '書き写す・引用する・言い換えて再現することは禁止。' +
    '抽出してよいのは抽象的なロジックだけ（単元、手法名、条件の種類）。' +
    '出力はJSONのみ。キーは logic, variantProblem, pattern。' +
    'extractedText / originalProblem / 原問の全文は絶対に出力しない。' +
    'logic は { subject, unit, techniques[] }。techniques は「平方完成」「内積=0」など一般名詞のみ。' +
    'variantProblem は完全オリジナルの新規創作問題。物語・数値・記号・設問文を画像と一致させない。' +
    'variantProblem は title, unit, subject, difficulty, format, questionText, templateText, ' +
    'variables, calcLogicJS, hints, keyFormula, commonMistakes を持つ。' +
    'pattern はオリジナルの patternName と strategyText と exampleQuestion（新規問題の要約）を持つ。' +
    '数式は Unicode（θ, π, ², √）と $...$ のみ。calcLogicJS は vars を受け取り ' +
    '{ vars, correctAnswer, explanationSteps } を返す関数本体。';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  '画像から解法構造だけを抽出し、原問は書き写さず、完全オリジナルの類題とパターンをJSONで返してください。',
              },
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const fallback = analyzeImageMock(Date.now());
    const logic = logicFromPayload(parsed.logic, fallback.logic);
    const intent = resolvePromptIntent(`${logic.unit} ${logic.techniques.join(' ')}`);

    const variantProblem =
      problemFromPayload(parsed.variantProblem, {
        unit: logic.unit,
        subject: logic.subject,
        difficulty: intent.difficulty,
        idPrefix: 'ocr-original',
      }) ?? fallback.variantProblem;

    const pattern = patternFromPayload(parsed.pattern, {
      ...fallback.pattern,
      id: `ocr-pat-${intent.unitId}-${Date.now()}`,
      unit: variantProblem.unit,
      unitId: intent.unitId,
      subject: variantProblem.subject,
      exampleQuestion: variantProblem.questionText,
      discovered: true,
    });

    return sanitizeOriginalCopy({
      logic,
      variantProblem,
      pattern: {
        ...pattern,
        exampleQuestion: variantProblem.questionText,
        discovered: true,
      },
      source: 'llm',
    });
  } catch (error) {
    console.error('[analyze-image] Vision解析に失敗、モックにフォールバックします', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let image: ParsedImage | null = null;
  try {
    image = await parseIncomingImage(request);
  } catch (error) {
    console.error('[analyze-image] 画像の読み取りに失敗しました', error);
  }

  if (!image || !image.base64 || image.base64.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(sanitizeOriginalCopy(analyzeImageMock(Date.now())));
  }

  const viaVision = await analyzeViaVision(image);
  return NextResponse.json(sanitizeOriginalCopy(viaVision ?? analyzeImageMock(image.base64.length)));
}

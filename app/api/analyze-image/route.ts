// ==========================================
// Apex Suite: Math Lab - Image Structure Analysis API
// ==========================================
// 著作権安全化:
// - 画像内の原問テキスト・設定・数値を出力・保存しない。
// - 解法構造（単元・手法・条件の種類）だけを抽出し、
//   100%オリジナルの新規創作問題とパターンカードだけを返す。
// Gemini 1.5 Flash Vision で実画像を解析する。無関係画像は捏造せず即ブロック。
// 通信失敗時もダミー類題は返さない。

import { NextResponse } from 'next/server';
import type { ImageAnalysisResult, ImageLogicSummary, SolutionPattern, Subject } from '@/types/mathLab';
import { problemFromPayload } from '@/lib/engine/problemFromPayload';
import { DEFAULT_DIFFICULTY } from '@/lib/engine/difficultyScale';
import { completeLlmJson, hasGeminiApiKey } from '@/lib/llm/completeJson';
import { parseLlmJsonObject } from '@/lib/llm/parseLlmJson';
import { resolveRouterUserEmail } from '@/lib/engine/aiRouter';
import {
  findSolutionPatternById,
  mergePatternMatchDigests,
  type PatternMatchDigest,
} from '@/data/patternsData';
import { findPatternInPools } from '@/lib/engine/patternPool';
import {
  IMAGE_ANALYSIS_INVALID_ERROR,
  IMAGE_ANALYSIS_SERVER_ERROR,
  buildImageAnalysisVisionSystemPrompt,
  imageAnalysisBlockedPayload,
  isImageAnalysisBlocked,
  readImageAnalysisError,
  type ImageAnalysisBlocked,
} from '@/lib/llm/imageAnalysisVision';

const MAX_IMAGE_CHARS = 2_000_000;
const MAX_CATALOG_FOR_PROMPT = 40;

export const runtime = 'nodejs';
export const maxDuration = 60;

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

function parsePatternDigests(raw: unknown): PatternMatchDigest[] {
  if (typeof raw === 'string') {
    try {
      return parsePatternDigests(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Record<string, unknown>;
    if (typeof source.id !== 'string' || typeof source.patternName !== 'string') return [];
    return [
      {
        id: source.id,
        unitId: typeof source.unitId === 'string' ? source.unitId : undefined,
        subtopicId: typeof source.subtopicId === 'string' ? source.subtopicId : undefined,
        unit: typeof source.unit === 'string' ? source.unit : '',
        subject:
          source.subject === 'physics' || source.subject === 'chemistry' || source.subject === 'math'
            ? source.subject
            : undefined,
        patternName: source.patternName,
        strategyText: typeof source.strategyText === 'string' ? source.strategyText : '',
      },
    ];
  });
}

async function parseIncomingAnalysis(
  request: Request
): Promise<{ image: ParsedImage | null; extraPatterns: PatternMatchDigest[] }> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const extraPatterns = parsePatternDigests(form.get('existingPatterns'));
    const file = form.get('image') ?? form.get('file');
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || 'image/jpeg';
      return { image: { base64: buffer.toString('base64'), mimeType }, extraPatterns };
    }
    const raw = form.get('imageBase64');
    if (typeof raw === 'string' && raw.trim()) {
      return { image: stripDataUrl(raw.trim()), extraPatterns };
    }
    return { image: null, extraPatterns };
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const extraPatterns = parsePatternDigests(body.existingPatterns);
    const raw =
      typeof body.imageBase64 === 'string' ? body.imageBase64 : typeof body.image === 'string' ? body.image : '';
    if (!raw.trim()) return { image: null, extraPatterns };
    const parsed = stripDataUrl(raw.trim());
    if (typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')) {
      parsed.mimeType = body.mimeType;
    }
    return { image: parsed, extraPatterns };
  } catch {
    return { image: null, extraPatterns: [] };
  }
}

function logicFromPayload(raw: unknown): ImageLogicSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  if (!isSubject(source.subject)) return null;
  const techniques = Array.isArray(source.techniques)
    ? source.techniques.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const unit = typeof source.unit === 'string' ? source.unit.trim() : '';
  if (!unit) return null;
  return {
    subject: source.subject,
    unit,
    techniques,
  };
}

function unitSlug(unit: string, subject: Subject): string {
  const slug = unit
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return slug ? `ocr-${subject}-${slug}` : `ocr-${subject}`;
}

function patternFromPayload(
  raw: unknown,
  defaults: Pick<SolutionPattern, 'id' | 'unit' | 'unitId' | 'subject' | 'exampleQuestion'>
): SolutionPattern | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const patternName = typeof source.patternName === 'string' ? source.patternName.trim() : '';
  const strategyText = typeof source.strategyText === 'string' ? source.strategyText.trim() : '';
  if (!patternName || !strategyText) return null;
  return {
    id: defaults.id,
    subject: defaults.subject,
    unit: typeof source.unit === 'string' && source.unit.trim() ? source.unit.trim() : defaults.unit,
    unitId: defaults.unitId,
    level:
      source.level === 'basic' || source.level === 'standard' || source.level === 'advanced'
        ? source.level
        : 'standard',
    patternName,
    strategyText,
    exampleQuestion:
      typeof source.exampleQuestion === 'string' && source.exampleQuestion.trim()
        ? source.exampleQuestion.trim()
        : defaults.exampleQuestion,
    discovered: true,
  };
}

function sanitizeOriginalCopy(result: ImageAnalysisResult): ImageAnalysisResult {
  return {
    isValid: true,
    logic: result.logic,
    variantProblem: {
      ...result.variantProblem,
      patternId: result.pattern.id,
    },
    pattern: result.pattern,
    source: 'llm',
    matchedExisting: result.matchedExisting === true,
  };
}

function resolveCatalogPattern(
  patternId: string | undefined,
  extra: PatternMatchDigest[]
): SolutionPattern | null {
  if (!patternId) return null;
  const discoveredLike: SolutionPattern[] = extra.map((item) => ({
    id: item.id,
    subject: item.subject === 'physics' || item.subject === 'chemistry' ? item.subject : 'math',
    unit: item.unit,
    unitId: item.unitId,
    subtopicId: item.subtopicId,
    level: 'standard',
    patternName: item.patternName,
    strategyText: item.strategyText,
    exampleQuestion: '',
    discovered: true,
  }));
  const pooled = findPatternInPools(patternId, discoveredLike)?.pattern;
  if (pooled) return pooled;
  return findSolutionPatternById(patternId) ?? null;
}

function coerceVisionJson(value: unknown): unknown {
  if (typeof value === 'string') return parseLlmJsonObject(value);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.data === 'string') return parseLlmJsonObject(record.data) ?? record;
  }
  return value;
}

function blockedResponse(error: string, status: number): Response {
  return NextResponse.json(imageAnalysisBlockedPayload(error), { status });
}

async function analyzeViaVision(
  image: ParsedImage,
  extraPatterns: PatternMatchDigest[]
): Promise<ImageAnalysisResult | ImageAnalysisBlocked | null> {
  if (!image.base64) return null;

  const catalog = mergePatternMatchDigests(extraPatterns).slice(0, MAX_CATALOG_FOR_PROMPT);
  const catalogForPrompt = catalog.map((item) => ({
    id: item.id,
    unit: item.unit,
    patternName: item.patternName,
    method: item.strategyText,
  }));

  try {
    const routed = await completeLlmJson({
      systemPrompt: buildImageAnalysisVisionSystemPrompt(),
      userPrompt:
        '【重要】このリクエストには写真が添付されている。写真を必ず見て教科を判定すること。' +
        '写真が数学なら physics / chemistry の類題は禁止。斜面の物体など定番の力学ダミーを出すことは禁止。' +
        '問題が無ければ isValid:false。あれば OCR したうえで同じ教科・同じ単元のオリジナル類題とパターンを返す。原問は書き写さない。\n' +
        JSON.stringify({ existingCatalog: catalogForPrompt }),
      image: { mimeType: image.mimeType || 'image/jpeg', base64: image.base64 },
      forceProvider: 'gemini',
      geminiOnly: true,
      temperature: 0.2,
      timeoutMs: 35000,
      maxGeminiAttempts: 3,
    });
    if (routed == null) return null;
    const parsedRaw = coerceVisionJson(routed);
    if (isImageAnalysisBlocked(parsedRaw)) {
      return imageAnalysisBlockedPayload(readImageAnalysisError(parsedRaw, IMAGE_ANALYSIS_INVALID_ERROR));
    }
    if (!parsedRaw || typeof parsedRaw !== 'object') {
      return imageAnalysisBlockedPayload(IMAGE_ANALYSIS_INVALID_ERROR);
    }
    const parsed = parsedRaw as Record<string, unknown>;
    if (parsed.isValid === false) {
      return imageAnalysisBlockedPayload(readImageAnalysisError(parsed, IMAGE_ANALYSIS_INVALID_ERROR));
    }

    const logic = logicFromPayload(parsed.logic);
    if (!logic) return imageAnalysisBlockedPayload(IMAGE_ANALYSIS_INVALID_ERROR);

    const matchRaw = parsed.match;
    const matchExisting =
      Boolean(matchRaw && typeof matchRaw === 'object' && (matchRaw as { existing?: unknown }).existing === true);
    const matchIdRaw =
      matchRaw && typeof matchRaw === 'object' ? (matchRaw as { patternId?: unknown }).patternId : undefined;
    const matchId = typeof matchIdRaw === 'string' ? matchIdRaw.trim() : undefined;

    const variantProblem = problemFromPayload(parsed.variantProblem, {
      unit: logic.unit,
      subject: logic.subject,
      difficulty: DEFAULT_DIFFICULTY,
      idPrefix: 'ocr-original',
    });
    if (!variantProblem) return imageAnalysisBlockedPayload(IMAGE_ANALYSIS_INVALID_ERROR);
    if (variantProblem.subject !== logic.subject) {
      variantProblem.subject = logic.subject;
      variantProblem.unit = logic.unit;
    }

    const catalogHit = matchExisting ? resolveCatalogPattern(matchId, extraPatterns) : null;
    if (catalogHit) {
      if (catalogHit.subject !== logic.subject) {
        return imageAnalysisBlockedPayload(IMAGE_ANALYSIS_INVALID_ERROR);
      }
      return sanitizeOriginalCopy({
        logic,
        variantProblem: { ...variantProblem, subject: logic.subject, unit: logic.unit, patternId: catalogHit.id },
        pattern: catalogHit,
        source: 'llm',
        matchedExisting: true,
      });
    }

    const pattern = patternFromPayload(parsed.pattern, {
      id: `ocr-pat-${unitSlug(logic.unit, logic.subject)}-${Date.now()}`,
      unit: logic.unit,
      unitId: unitSlug(logic.unit, logic.subject),
      subject: logic.subject,
      exampleQuestion: variantProblem.questionText,
    });
    if (!pattern) return imageAnalysisBlockedPayload(IMAGE_ANALYSIS_INVALID_ERROR);

    return sanitizeOriginalCopy({
      logic,
      variantProblem: {
        ...variantProblem,
        subject: logic.subject,
        unit: logic.unit,
        patternId: pattern.id,
      },
      pattern: {
        ...pattern,
        subject: logic.subject,
        unit: logic.unit,
        exampleQuestion: pattern.exampleQuestion || variantProblem.questionText,
        discovered: true,
      },
      source: 'llm',
      matchedExisting: false,
    });
  } catch (error) {
    console.error('[analyze-image] Vision解析に失敗しました', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await resolveRouterUserEmail(request);
    if (!hasGeminiApiKey()) {
      return blockedResponse(IMAGE_ANALYSIS_SERVER_ERROR, 503);
    }

    let image: ParsedImage | null = null;
    let extraPatterns: PatternMatchDigest[] = [];
    try {
      const parsed = await parseIncomingAnalysis(request);
      image = parsed.image;
      extraPatterns = parsed.extraPatterns;
    } catch (error) {
      console.error('[analyze-image] 画像の読み取りに失敗しました', error);
      return blockedResponse(IMAGE_ANALYSIS_INVALID_ERROR, 200);
    }

    if (!image || !image.base64 || image.base64.length > MAX_IMAGE_CHARS) {
      return blockedResponse(IMAGE_ANALYSIS_INVALID_ERROR, 200);
    }

    const viaVision = await analyzeViaVision(image, extraPatterns);
    if (viaVision && 'isValid' in viaVision && viaVision.isValid === false) {
      return NextResponse.json(viaVision);
    }
    if (viaVision && 'variantProblem' in viaVision) {
      return NextResponse.json(viaVision);
    }
    return blockedResponse(IMAGE_ANALYSIS_SERVER_ERROR, 503);
  } catch (error) {
    console.error('[analyze-image] 通信エラー', error);
    return blockedResponse(IMAGE_ANALYSIS_SERVER_ERROR, 503);
  }
}

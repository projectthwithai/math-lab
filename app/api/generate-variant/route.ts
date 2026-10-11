// ==========================================
// Apex Suite: Math Lab - Exam-quality pattern variant API
// ==========================================
// 同じ解法パターンを、別の数学的・科学的テーマで切り出した入試良問を 1 問返す。
// 会話の着せ替えテンプレートは使わない。Gemini を優先し、指揮官は Gemini 永久固定。

import { NextResponse } from 'next/server';
import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { getUnitById } from '@/data/unitsData';
import { findSolutionPatternById, getPatternStarDifficulty } from '@/data/patternsData';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { parseGeometryScene } from '@/lib/engine/geometryVisual';
import { parseVisualType } from '@/lib/engine/visualNeed';
import { isCommanderUser, resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';
import { completeLlmJson } from '@/lib/llm/completeJson';
import { buildExamVariantSystemPrompt } from '@/lib/llm/examPrompts';
import { ensureProblemHasCorrectAnswer, isPlaceholderCorrectAnswer } from '@/lib/engine/correctAnswer';
import { normalizeThemeLabel, pickExamThemeLabel } from '@/lib/engine/patternVariant';
import { isExamQualityVariantText } from '@/lib/engine/variantQuality';
import { wrapBareLatexOutsideMath } from '@/lib/utils/sanitizeLatex';
import { clampDifficulty, DEFAULT_DIFFICULTY } from '@/lib/engine/difficultyScale';

interface GenerateVariantBody {
  patternId?: unknown;
  patternName?: unknown;
  strategyText?: unknown;
  unitId?: unknown;
  subject?: unknown;
  existingCount?: unknown;
  userEmail?: unknown;
}

interface LlmVariantPayload {
  title: string;
  unit: string;
  subject: Subject;
  format: 'choice' | 'input' | 'descriptive';
  variables: Record<string, { min: number; max: number; step: number }>;
  templateText: string;
  calcLogicJS: string;
  hints: [string, string, string];
  keyFormula: string;
  commonMistakes: string;
  themeLabel?: string;
  camouflageStyle?: string;
  choices?: string[];
  geometryScene?: unknown;
  visualType?: string;
}

function normalizeId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function parseExistingCount(raw: unknown): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function isValidLlmVariantPayload(value: unknown): value is LlmVariantPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.unit === 'string' &&
    isSubject(candidate.subject) &&
    typeof candidate.templateText === 'string' &&
    typeof candidate.calcLogicJS === 'string' &&
    typeof candidate.variables === 'object' &&
    Array.isArray(candidate.hints) &&
    candidate.hints.length === 3 &&
    typeof candidate.keyFormula === 'string'
  );
}

function polishExamText(text: string): string {
  return wrapBareLatexOutsideMath(text.trim());
}

async function completeVariantJson(params: {
  systemPrompt: string;
  userPrompt: string;
  userEmail?: string;
}): Promise<unknown | null> {
  const gemini = await completeLlmJson({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    forceProvider: 'gemini',
    geminiOnly: true,
    temperature: 0.75,
  });
  if (gemini !== null) return gemini;
  if (isCommanderUser(params.userEmail)) return null;
  const routed = await routeLlmJson({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    userEmail: params.userEmail,
  });
  return routed?.data ?? null;
}

async function generateVariantViaLlm(params: {
  patternId: string;
  patternName: string;
  strategyText: string;
  unitId?: string;
  subject: Subject;
  existingCount: number;
  userEmail?: string;
}): Promise<{ problem: GeneratedProblem; styleLabel: string } | null> {
  const unit = params.unitId ? getUnitById(params.unitId) : undefined;
  const catalog = findSolutionPatternById(params.patternId);
  const difficulty = catalog ? getPatternStarDifficulty(catalog) : DEFAULT_DIFFICULTY;
  const fallbackTheme = pickExamThemeLabel(params.existingCount);

  const userPrompt = JSON.stringify({
    patternId: params.patternId,
    patternName: params.patternName,
    strategyText: params.strategyText,
    subject: params.subject,
    unitTitle: unit?.title ?? catalog?.unit ?? '数学',
    difficulty: clampDifficulty(difficulty),
    outputSchema: {
      title: 'string（入試問題らしい短い見出し。変装・会話などの語は禁止）',
      unit: 'string',
      subject: 'math | physics | chemistry',
      format: 'input | choice | descriptive',
      themeLabel: 'string（例: 階乗不等式 / 整数の倍数 / 漸化式の一般項 / 平面分割）',
      variables: '{ [name]: { min: number, max: number, step: number } }',
      templateText:
        'string（プレースホルダーは {{varName}}。受験生が読む純粋な問題文のみ。$...$ / $$...$$ で数式を囲む）',
      calcLogicJS: 'string (function body。指定パターンを本質的に使う)',
      hints: '[string, string, string]',
      keyFormula: 'string（$...$ の LaTeX）',
      commonMistakes: 'string',
      visualType: 'none | math_graph | geometry_svg | physics_simulation | chemistry_animation',
      geometryScene: 'optional; 幾何図形が不可欠なときだけ',
    },
  });

  try {
    const parsed = await completeVariantJson({
      systemPrompt: buildExamVariantSystemPrompt(params.patternName, params.strategyText),
      userPrompt,
      userEmail: params.userEmail,
    });
    if (!isValidLlmVariantPayload(parsed)) return null;
    if (!isExamQualityVariantText(parsed.templateText)) return null;
    if (!isExamQualityVariantText(parsed.title)) return null;

    const questionText = polishExamText(parsed.templateText);
    if (!isExamQualityVariantText(questionText)) return null;

    const geometryScene = parseGeometryScene(parsed.geometryScene);
    const requestedVisual = parseVisualType(parsed.visualType);
    const visualType = geometryScene
      ? 'geometry_svg'
      : requestedVisual === 'geometry_svg'
        ? 'none'
        : requestedVisual;
    const styleLabel = normalizeThemeLabel(parsed.themeLabel ?? parsed.camouflageStyle, fallbackTheme);
    const base: GeneratedProblem = {
      id: `variant-${params.patternId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      patternId: params.patternId,
      subject: parsed.subject,
      unit: parsed.unit,
      title: parsed.title.trim(),
      difficulty: clampDifficulty(difficulty),
      format: parsed.format ?? 'input',
      questionText,
      visualType,
      visualConfig: geometryScene
        ? { type: 'geometry', params: { ...geometryScene, scene: geometryScene } }
        : { type: visualType === 'none' ? 'none' : visualType, params: {} },
      correctAnswer: '',
      choices: parsed.choices,
      hints: parsed.hints,
      explanation: {
        stepByStep: [],
        keyFormula: polishExamText(parsed.keyFormula),
        commonMistakes: parsed.commonMistakes ?? '',
      },
      templateConfig: {
        variables: parsed.variables,
        templateText: questionText,
        calcLogicJS: parsed.calcLogicJS,
      },
    };

    const problem = ensureProblemHasCorrectAnswer(regenerateProblemLocally(base));
    if (isPlaceholderCorrectAnswer(problem.correctAnswer)) return null;
    if (!isExamQualityVariantText(problem.questionText)) return null;
    return { problem, styleLabel };
  } catch (error) {
    console.error('[generate-variant] 入試バリエーションの生成に失敗しました', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: GenerateVariantBody = {};
  try {
    body = (await request.json()) as GenerateVariantBody;
  } catch {
    body = {};
  }

  const patternId = normalizeId(body.patternId);
  const patternName = normalizeId(body.patternName);
  const strategyText = typeof body.strategyText === 'string' ? body.strategyText.trim() : '';
  if (!patternId || !patternName || !strategyText) {
    return NextResponse.json(
      { error: 'patternId, patternName, strategyText は必須です。' },
      { status: 400 }
    );
  }

  const catalog = findSolutionPatternById(patternId);
  const unitId = normalizeId(body.unitId) ?? catalog?.unitId;
  const subject: Subject = isSubject(body.subject)
    ? body.subject
    : catalog?.subject ?? (unitId ? getUnitById(unitId)?.subject : undefined) ?? 'math';
  const existingCount = parseExistingCount(body.existingCount);
  const userEmail = await resolveRouterUserEmail(request, body.userEmail);

  const viaLlm = await generateVariantViaLlm({
    patternId,
    patternName,
    strategyText,
    unitId,
    subject,
    existingCount,
    userEmail,
  });

  if (!viaLlm) {
    return NextResponse.json(
      { error: '入試レベルのバリエーションを生成できませんでした。手抜きテンプレートでは代替しません。' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    problem: viaLlm.problem,
    styleLabel: viaLlm.styleLabel,
  });
}

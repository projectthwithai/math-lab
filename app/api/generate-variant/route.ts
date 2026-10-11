// ==========================================
// Apex Suite: Math Lab - Camouflaged pattern variant API
// ==========================================
// 解法ロジックは固定したまま、出題の見た目だけを変装した GeneratedProblem を 1 問返す。
// 指揮官（NEXT_PUBLIC_ADMIN_EMAIL）は aiRouter 経由で無料 Gemini 永久固定。

import { NextResponse } from 'next/server';
import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { generateMockVariant, readMockVariantStyleLabel } from '@/lib/mock/generateMockVariant';
import { getUnitById } from '@/data/unitsData';
import { findSolutionPatternById, getPatternStarDifficulty } from '@/data/patternsData';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { parseGeometryScene } from '@/lib/engine/geometryVisual';
import { parseVisualType } from '@/lib/engine/visualNeed';
import { routeLlmJson, resolveRouterUserEmail } from '@/lib/engine/aiRouter';
import { LATEX_EXPLANATION_RULES, SUBJECT_RUBRIC } from '@/lib/llm/examPrompts';
import { VISUAL_TYPE_PROMPT_RULES } from '@/lib/engine/visualNeed';
import { ensureProblemHasCorrectAnswer, isPlaceholderCorrectAnswer } from '@/lib/engine/correctAnswer';
import {
  normalizeCamouflageStyleLabel,
  pickCamouflageStyleLabel,
} from '@/lib/engine/patternVariant';
import { clampDifficulty, DEFAULT_DIFFICULTY } from '@/lib/engine/difficultyScale';

interface GenerateVariantBody {
  patternId?: unknown;
  patternName?: unknown;
  strategyText?: unknown;
  unitId?: unknown;
  subject?: unknown;
  existingCount?: unknown;
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

function buildVariantSystemPrompt(patternName: string, strategyText: string): string {
  return (
    `あなたは難関大入試の作問チーフです。\n` +
    `指定された解法パターン『${patternName}』(解法方針: ${strategyText}) を使用する問題について、\n` +
    `解法ロジックは1ミリも変えずに、出題の見た目・文章表現・シチュエーション（純粋な数式題、図形・動点の幾何文章題、共通テスト風の日常会話文題など）を大胆にカモフラージュ（変装）させた新しい問題バリエーション（GeneratedProblem型）を1問生成してください。\n` +
    SUBJECT_RUBRIC +
    LATEX_EXPLANATION_RULES +
    VISUAL_TYPE_PROMPT_RULES +
    '出力は必ずJSON形式のみとし、余計な説明文を含めないでください。' +
    '再利用可能なテンプレート（変数の範囲・計算ロジックJS・テンプレート文）を生成してください。' +
    'calcLogicJSはJavaScriptの関数本体の文字列で、引数varsを受け取り、' +
    '{ vars: object, correctAnswer: string | number, explanationSteps?: string[] } を返す。' +
    'correctAnswer は空文字・未定義・null 禁止。' +
    'camouflageStyle は 図形文章 / 共通テスト風 / 日常会話 / 動点幾何 / 純粋数式の別表現 のいずれか。'
  );
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
  const fallbackStyle = pickCamouflageStyleLabel(params.existingCount);

  const userPrompt = JSON.stringify({
    patternId: params.patternId,
    patternName: params.patternName,
    strategyText: params.strategyText,
    subject: params.subject,
    unitTitle: unit?.title ?? catalog?.unit ?? '数学',
    difficulty: clampDifficulty(difficulty),
    outputSchema: {
      title: 'string',
      unit: 'string',
      subject: 'math | physics | chemistry',
      format: 'input | choice | descriptive',
      camouflageStyle: '図形文章 | 共通テスト風 | 日常会話 | 動点幾何 | 純粋数式の別表現',
      variables: '{ [name]: { min: number, max: number, step: number } }',
      templateText: 'string (プレースホルダーは {{varName}} 形式。変装後の文章)',
      calcLogicJS: 'string (function body。解法ロジックは指定パターンと同一)',
      hints: '[string, string, string]',
      keyFormula: 'string（$...$ の LaTeX）',
      commonMistakes: 'string',
      visualType: 'none | math_graph | geometry_svg | physics_simulation | chemistry_animation',
      geometryScene: 'optional; 幾何図形が不可欠なときだけ',
    },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt: buildVariantSystemPrompt(params.patternName, params.strategyText),
      userPrompt,
      userEmail: params.userEmail,
    });
    const parsed = routed?.data;
    if (!isValidLlmVariantPayload(parsed)) return null;

    const geometryScene = parseGeometryScene(parsed.geometryScene);
    const requestedVisual = parseVisualType(parsed.visualType);
    const visualType = geometryScene
      ? 'geometry_svg'
      : requestedVisual === 'geometry_svg'
        ? 'none'
        : requestedVisual;
    const styleLabel = normalizeCamouflageStyleLabel(parsed.camouflageStyle, fallbackStyle);
    const base: GeneratedProblem = {
      id: `variant-${params.patternId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      patternId: params.patternId,
      subject: parsed.subject,
      unit: parsed.unit,
      title: parsed.title,
      difficulty: clampDifficulty(difficulty),
      format: parsed.format ?? 'input',
      questionText: parsed.templateText,
      visualType,
      visualConfig: geometryScene
        ? { type: 'geometry', params: { ...geometryScene, scene: geometryScene } }
        : { type: visualType === 'none' ? 'none' : visualType, params: {} },
      correctAnswer: '',
      choices: parsed.choices,
      hints: parsed.hints,
      explanation: {
        stepByStep: [],
        keyFormula: parsed.keyFormula,
        commonMistakes: parsed.commonMistakes ?? '',
      },
      templateConfig: {
        variables: parsed.variables,
        templateText: parsed.templateText,
        calcLogicJS: parsed.calcLogicJS,
      },
    };

    const problem = ensureProblemHasCorrectAnswer(regenerateProblemLocally(base));
    if (isPlaceholderCorrectAnswer(problem.correctAnswer)) return null;
    return { problem, styleLabel };
  } catch (error) {
    console.error('[generate-variant] LLM生成に失敗、モックにフォールバックします', error);
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
  const userEmail = await resolveRouterUserEmail(request, (body as { userEmail?: unknown }).userEmail);

  const viaLlm = await generateVariantViaLlm({
    patternId,
    patternName,
    strategyText,
    unitId,
    subject,
    existingCount,
    userEmail,
  });

  if (viaLlm) {
    return NextResponse.json({
      problem: viaLlm.problem,
      styleLabel: viaLlm.styleLabel,
    });
  }

  const mock = generateMockVariant({
    patternId,
    patternName,
    strategyText,
    unitId,
    subject,
    existingCount,
  });
  return NextResponse.json({
    problem: ensureProblemHasCorrectAnswer(mock),
    styleLabel: readMockVariantStyleLabel(mock),
  });
}

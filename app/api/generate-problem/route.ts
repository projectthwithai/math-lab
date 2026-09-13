// ==========================================
// Apex Suite: Math Lab - Problem Generation API Route
// ==========================================
// .cursorrules の「API Cost Minimization」方針に従い:
// - `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` があれば gemini-1.5-flash（互換 Flash へ自動フォールバック）。
// - なければ `OPENAI_API_KEY` の gpt-4o-mini。
// - 未設定、またはLLM呼び出しが失敗した場合は、100%ローカルの
//   モック生成エンジン (`lib/mock/generateMockProblem.ts`) にフォールバックする。
// 生成された問題は必ず `templateConfig` を持ち、クライアント側で
// 「数字を変えて再生成（APIコスト0）」が可能。

import { NextResponse } from 'next/server';
import type { GeneratedProblem, SolutionPattern, Subject } from '@/types/mathLab';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { getUnitById } from '@/data/unitsData';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { pickPracticePattern } from '@/lib/engine/patternPool';
import { stampCatalogProblem, stampDiscoveredProblem } from '@/lib/mock/stampDiscoveredProblem';
import { getPatternStarDifficulty } from '@/data/patternsData';
import {
  clampDifficulty,
  DEFAULT_DIFFICULTY,
  getDifficultyMeta,
  getDifficultyTier,
} from '@/lib/engine/difficultyScale';
import { resolvePromptIntent } from '@/lib/engine/promptIntent';
import { parseGeometryScene } from '@/lib/engine/geometryVisual';
import { parseVisualType } from '@/lib/engine/visualNeed';
import { completeLlmJson } from '@/lib/llm/completeJson';
import { buildDifficultyGuide, buildProblemSystemPrompt } from '@/lib/llm/examPrompts';
import { ensureProblemHasCorrectAnswer, isPlaceholderCorrectAnswer } from '@/lib/engine/correctAnswer';

interface GenerateProblemParams {
  unitId?: string;
  patternId?: string;
  subtopicId?: string;
  difficulty?: number;
  discoveredPatterns?: SolutionPattern[];
  prompt?: string;
}

function parseDifficulty(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(parsed)) return undefined;
  return clampDifficulty(parsed > 5 ? Math.ceil(parsed / 2) : parsed);
}

function normalizeId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function finalizeGeneratedProblem(
  viaLlm: GeneratedProblem | null,
  params: GenerateProblemParams
): GeneratedProblem {
  if (viaLlm && !isPlaceholderCorrectAnswer(viaLlm.correctAnswer)) {
    return ensureProblemHasCorrectAnswer(viaLlm);
  }
  return ensureProblemHasCorrectAnswer(generateMockProblem(params));
}

function parseDiscoveredPatterns(raw: unknown): SolutionPattern[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is SolutionPattern => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.patternName === 'string' &&
      typeof candidate.strategyText === 'string' &&
      isSubject(candidate.subject)
    );
  });
}

interface LlmTemplatePayload {
  title: string;
  unit: string;
  subject: 'math' | 'physics' | 'chemistry';
  format: 'choice' | 'input' | 'descriptive';
  variables: Record<string, { min: number; max: number; step: number }>;
  templateText: string;
  calcLogicJS: string;
  hints: [string, string, string];
  keyFormula: string;
  commonMistakes: string;
  choices?: string[];
  geometryScene?: unknown;
  visualType?: string;
}

function isValidLlmTemplatePayload(value: unknown): value is LlmTemplatePayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.unit === 'string' &&
    (candidate.subject === 'math' || candidate.subject === 'physics' || candidate.subject === 'chemistry') &&
    typeof candidate.templateText === 'string' &&
    typeof candidate.calcLogicJS === 'string' &&
    typeof candidate.variables === 'object' &&
    Array.isArray(candidate.hints) &&
    candidate.hints.length === 3 &&
    typeof candidate.keyFormula === 'string'
  );
}

async function generateViaLlm(params: GenerateProblemParams): Promise<GeneratedProblem | null> {
  const unit = params.unitId ? getUnitById(params.unitId) : undefined;
  const difficulty = params.difficulty ?? DEFAULT_DIFFICULTY;
  const meta = getDifficultyMeta(difficulty);
  const tier = getDifficultyTier(difficulty);
  const tierGuide = buildDifficultyGuide(difficulty, unit?.subject ?? 'math');

  const systemPrompt = buildProblemSystemPrompt({
    difficulty,
    subject: unit?.subject ?? 'math',
    unitTitle: unit?.title,
    userRequest: Boolean(params.prompt),
  });

  const userPrompt = JSON.stringify({
    subject: unit?.subject ?? 'math',
    unitTitle: unit?.title ?? '数学の基本問題',
    difficulty,
    difficultyTier: tier,
    difficultyGuide: tierGuide,
    patternName: params.patternId,
    userRequest: params.prompt ?? '',
    outputSchema: {
      title: `string（先頭に ${meta.starLabel}${meta.label} を付ける）`,
      unit: 'string',
      subject: 'math | physics | chemistry',
      format: 'input | choice | descriptive',
      variables: '{ [name]: { min: number, max: number, step: number } }',
      templateText: 'string (プレースホルダーは {{varName}} 形式)',
      calcLogicJS: 'string (function body)',
      hints: '[string, string, string]（途中の着眼を $...$ 可）',
      keyFormula: 'string（$...$ の LaTeX）',
      commonMistakes: 'string',
      visualType: 'none | math_graph | geometry_svg | physics_simulation | chemistry_animation',
      visualConfig: '{ type: string, params: object }  （none のときは type:"none", params:{}）',
      geometryScene: 'optional; 幾何図形が不可欠なときだけ。計算問題では省略',
    },
  });

  try {
    const parsed = await completeLlmJson({ systemPrompt, userPrompt });
    if (!isValidLlmTemplatePayload(parsed)) return null;

    const geometryScene = parseGeometryScene(parsed.geometryScene);
    const requestedVisual = parseVisualType(parsed.visualType);
    const visualType = geometryScene ? 'geometry_svg' : requestedVisual === 'geometry_svg' ? 'none' : requestedVisual;
    const base: GeneratedProblem = {
      id: `llm-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      patternId: params.patternId ?? params.unitId,
      subject: parsed.subject,
      unit: parsed.unit,
      title: parsed.title,
      difficulty,
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

    return ensureProblemHasCorrectAnswer(regenerateProblemLocally(base));
  } catch (error) {
    console.error('[generate-problem] LLM生成に失敗、モックにフォールバックします', error);
    return null;
  }
}

async function handleGenerateProblem(params: GenerateProblemParams): Promise<GeneratedProblem> {
  if (params.prompt) {
    const intent = resolvePromptIntent(params.prompt);
    const generationParams: GenerateProblemParams = {
      unitId: params.unitId ?? intent.unitId,
      difficulty: params.difficulty ?? intent.difficulty,
      prompt: params.prompt,
      patternId: params.patternId,
    };
    const picked = pickPracticePattern({
      unitId: generationParams.unitId,
      patternId: generationParams.patternId,
      subtopicId: params.subtopicId,
      discoveredPatterns: params.discoveredPatterns ?? [],
    });
    if (picked.pattern) {
      generationParams.patternId = picked.pattern.id;
    }
    const viaPrompt = await generateViaLlm(generationParams);
    const base = finalizeGeneratedProblem(viaPrompt, generationParams);
    if (picked.pattern && picked.fromDiscovered) {
      return stampDiscoveredProblem(base, picked.pattern);
    }
    if (picked.pattern) {
      return stampCatalogProblem(base, picked.pattern);
    }
    return { ...base, fromDiscoveredPattern: false };
  }

  const picked = pickPracticePattern({
    unitId: params.unitId,
    patternId: params.patternId,
    subtopicId: params.subtopicId,
    discoveredPatterns: params.discoveredPatterns ?? [],
  });

  const resolvedUnitId = params.unitId ?? picked.pattern?.unitId;
  const resolvedDifficulty =
    params.difficulty ??
    (picked.pattern ? getPatternStarDifficulty(picked.pattern) : undefined);
  const resolvedPatternId = picked.pattern?.id ?? params.patternId;

  const generationParams: GenerateProblemParams = {
    unitId: resolvedUnitId,
    patternId: resolvedPatternId,
    difficulty: resolvedDifficulty,
    prompt: params.prompt,
  };

  const viaLlm = await generateViaLlm(generationParams);
  const base = finalizeGeneratedProblem(viaLlm, generationParams);

  if (picked.pattern && picked.fromDiscovered) {
    return stampDiscoveredProblem(base, picked.pattern);
  }
  if (picked.pattern) {
    return stampCatalogProblem(base, picked.pattern);
  }
  return { ...base, fromDiscoveredPattern: false };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const params: GenerateProblemParams = {
    unitId: normalizeId(url.searchParams.get('unitId')),
    patternId: normalizeId(url.searchParams.get('patternId')),
    subtopicId: normalizeId(url.searchParams.get('subtopicId')),
    difficulty: parseDifficulty(url.searchParams.get('difficulty')),
    prompt: normalizeId(url.searchParams.get('prompt')),
    discoveredPatterns: [],
  };

  const problem = await handleGenerateProblem(params);
  return NextResponse.json(problem);
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const params: GenerateProblemParams = {
    unitId: normalizeId(body.unitId),
    patternId: normalizeId(body.patternId),
    subtopicId: normalizeId(body.subtopicId),
    difficulty: parseDifficulty(body.difficulty),
    prompt: normalizeId(body.prompt),
    discoveredPatterns: parseDiscoveredPatterns(body.discoveredPatterns),
  };

  const problem = await handleGenerateProblem(params);
  return NextResponse.json(problem);
}

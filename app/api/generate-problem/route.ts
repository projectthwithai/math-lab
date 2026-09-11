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
import { parseVisualType, VISUAL_TYPE_PROMPT_RULES } from '@/lib/engine/visualNeed';
import { completeLlmJson } from '@/lib/llm/completeJson';

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
  const tierGuide =
    difficulty === 1
      ? '★1 基礎: 公式へ数値を直接代入する基本計算。場合分けや文字定数は使わない。解説は代入の手順を3ステップ程度で。'
      : difficulty === 2
        ? '★2 標準: 定期テスト・共通テスト基礎レベル。典型的な1〜2ステップの変形を含む。'
        : difficulty === 3
          ? '★3 応用: 共通テスト標準・典型入試。文字定数や定義域との場合分けを含めてよい。'
          : difficulty === 4
            ? '★4 発展: 難関大・国公立・MARCH二次。場合分けと条件の言い換えが必要な問題。基本の代入計算だけは禁止。'
            : [
                '★5 最難関: 東大・京大・旧帝・医学部難問。基本計算（公式へ数値を代入するだけ）は禁止。',
                '必ず次をすべて満たすこと:',
                '(1) 文字定数 a,k,t などを残したまま議論する高度な関数・図形・ベクトル問題。',
                '(2) 場合分けが3パターン以上（軸と定義域、パラメータの符号、交点個数、鋭角/直角/鈍角 など）。',
                '(3) 初見の論理展開が必要な融合問題（2つ以上の定理の接続、条件の言い換え、存在条件）。',
                '(4) 答えは単なる代入値ではなく、個数・範囲の端点・場合分け後の値のいずれか。',
                '(5) 解説 stepByStep は論理の根拠を6ステップ以上で極めて詳細に書く。',
              ].join(' ');

  const systemPrompt =
    'あなたは高校生向けの数学・物理・化学の問題作成AIです。' +
    '出力は必ずJSON形式のみとし、余計な説明文を含めないでください。' +
    '再利用可能なテンプレート（変数の範囲・計算ロジックJS・テンプレート文）を生成してください。' +
    'calcLogicJSはJavaScriptの関数本体の文字列で、引数varsを受け取り、' +
    '{ vars: object, correctAnswer: string | number, explanationSteps?: string[] } を返してください。' +
    '2次関数・一次関数・三角関数のグラフ問題では、クライアント側SVG描画のため vars に係数を必ず含める。' +
    'quadratic は a,b,c または a,p,q。linear は m,b。sine は amplitude,frequency。画像生成は使わない。' +
    '三角形・円・接線・ベクトル・点と直線の問題では geometryScene を必ず付ける。' +
    'geometryScene は { points:[{id,x,y,label}], segments:[{from,to,dashed?,label?}], circles:[{cx,cy,r,dashed?,label?}], ' +
    'angles:[{vertex,from,to,label}], vectors:[{from,to,label}], tangents:[{from,to}], caption }。座標は -10〜10 程度。' +
    VISUAL_TYPE_PROMPT_RULES +
    'LaTeXのバックスラッシュ記法は使わず、Unicode数学記号（θ, π, °, ², √ 等）と' +
    'ASCII表記（^, /, ()）のみで数式を表現してください。' +
    '難易度指定に従い、問題の構造そのものを劇的に分岐させてください。' +
    '★4以上では「計算するだけ」の問題を出してはいけない。' +
    (params.prompt ? 'ユーザーの作問リクエスト（userRequest）の単元・難易度・出題形式を最優先で反映してください。' : '') +
    tierGuide;

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
      hints: '[string, string, string]',
      keyFormula: 'string',
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

    return regenerateProblemLocally(base);
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
    const base = viaPrompt ?? generateMockProblem(generationParams);
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
  const base = viaLlm ?? generateMockProblem(generationParams);

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

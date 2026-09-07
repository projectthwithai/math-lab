// ==========================================
// Apex Suite: Math Lab - Problem Generation API Route
// ==========================================
// .cursorrules の「API Cost Minimization」方針に従い:
// - `OPENAI_API_KEY` が設定されていれば gpt-4o-mini でテンプレートを生成。
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
import { getPatternDefaultDifficulty } from '@/data/patternsData';
import { resolvePromptIntent } from '@/lib/engine/promptIntent';

interface GenerateProblemParams {
  unitId?: string;
  patternId?: string;
  difficulty?: number;
  discoveredPatterns?: SolutionPattern[];
  prompt?: string;
}

function parseDifficulty(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(parsed)) return undefined;
  return Math.max(1, Math.min(10, Math.round(parsed)));
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const unit = params.unitId ? getUnitById(params.unitId) : undefined;
  const difficulty = params.difficulty ?? 5;

  const tier =
    difficulty <= 3 ? 'basic' : difficulty <= 7 ? 'standard' : 'hard';
  const tierGuide =
    tier === 'basic'
      ? '★1-3 基礎: 公式へ数値を直接代入する基本計算。場合分けや文字定数は使わない。解説は代入の手順を3ステップ程度で。'
      : tier === 'standard'
        ? '★4-7 標準・応用: 文字定数 a や定義域との場合分けを含む、標準的な入試問題。解説は場合分けの根拠を明示する。'
        : '★8-10 難関: 難関大二次試験・共通テスト難問レベルの融合・思考問題。解説 stepByStep は途中の論理展開を5ステップ以上で極めて詳細に書く。';

  const systemPrompt =
    'あなたは高校生向けの数学・物理・化学の問題作成AIです。' +
    '出力は必ずJSON形式のみとし、余計な説明文を含めないでください。' +
    '再利用可能なテンプレート（変数の範囲・計算ロジックJS・テンプレート文）を生成してください。' +
    'calcLogicJSはJavaScriptの関数本体の文字列で、引数varsを受け取り、' +
    '{ vars: object, correctAnswer: string | number, explanationSteps?: string[] } を返してください。' +
    '2次関数・一次関数・三角関数のグラフ問題では、クライアント側SVG描画のため vars に係数を必ず含める。' +
    'quadratic は a,b,c または a,p,q。linear は m,b。sine は amplitude,frequency。画像生成は使わない。' +
    'LaTeXのバックスラッシュ記法は使わず、Unicode数学記号（θ, π, °, ², √ 等）と' +
    'ASCII表記（^, /, ()）のみで数式を表現してください。' +
    '難易度指定に従い、問題の構造そのものを劇的に分岐させてください。' +
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
      title: 'string（先頭に ★基礎 / ★標準 / ★難関 を付ける）',
      unit: 'string',
      subject: 'math | physics | chemistry',
      format: 'input | choice | descriptive',
      variables: '{ [name]: { min: number, max: number, step: number } }',
      templateText: 'string (プレースホルダーは {{varName}} 形式)',
      calcLogicJS: 'string (function body)',
      hints: '[string, string, string]',
      keyFormula: 'string',
      commonMistakes: 'string',
    },
  });

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
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;

    const parsed = JSON.parse(content);
    if (!isValidLlmTemplatePayload(parsed)) return null;

    const base: GeneratedProblem = {
      id: `llm-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      patternId: params.patternId ?? params.unitId,
      subject: parsed.subject,
      unit: parsed.unit,
      title: parsed.title,
      difficulty,
      format: parsed.format ?? 'input',
      questionText: parsed.templateText,
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
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
    };
    const viaPrompt = await generateViaLlm(generationParams);
    return { ...(viaPrompt ?? generateMockProblem(generationParams)), fromDiscoveredPattern: false };
  }

  const picked = pickPracticePattern({
    unitId: params.unitId,
    patternId: params.patternId,
    discoveredPatterns: params.discoveredPatterns ?? [],
  });

  const resolvedUnitId = params.unitId ?? picked.pattern?.unitId;
  const resolvedDifficulty =
    params.difficulty ??
    (picked.pattern ? getPatternDefaultDifficulty(picked.pattern.level) : undefined);
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
    difficulty: parseDifficulty(body.difficulty),
    prompt: normalizeId(body.prompt),
    discoveredPatterns: parseDiscoveredPatterns(body.discoveredPatterns),
  };

  const problem = await handleGenerateProblem(params);
  return NextResponse.json(problem);
}

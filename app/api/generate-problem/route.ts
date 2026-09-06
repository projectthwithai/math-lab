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
import type { GeneratedProblem } from '@/types/mathLab';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { getUnitById } from '@/data/unitsData';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';

interface GenerateProblemParams {
  unitId?: string;
  patternId?: string;
  difficulty?: number;
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

  const systemPrompt =
    'あなたは高校生向けの数学・物理・化学の問題作成AIです。' +
    '出力は必ずJSON形式のみとし、余計な説明文を含めないでください。' +
    '再利用可能なテンプレート（変数の範囲・計算ロジックJS・テンプレート文）を生成してください。' +
    'calcLogicJSはJavaScriptの関数本体の文字列で、引数varsを受け取り、' +
    '{ vars: object, correctAnswer: string | number, explanationSteps?: string[] } を返してください。' +
    'LaTeXのバックスラッシュ記法は使わず、Unicode数学記号（θ, π, °, ², √ 等）と' +
    'ASCII表記（^, /, ()）のみで数式を表現してください。';

  const userPrompt = JSON.stringify({
    subject: unit?.subject ?? 'math',
    unitTitle: unit?.title ?? '数学の基本問題',
    difficulty,
    outputSchema: {
      title: 'string',
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
  const viaLlm = await generateViaLlm(params);
  if (viaLlm) return viaLlm;
  return generateMockProblem(params);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const params: GenerateProblemParams = {
    unitId: normalizeId(url.searchParams.get('unitId')),
    patternId: normalizeId(url.searchParams.get('patternId')),
    difficulty: parseDifficulty(url.searchParams.get('difficulty')),
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
  };

  const problem = await handleGenerateProblem(params);
  return NextResponse.json(problem);
}

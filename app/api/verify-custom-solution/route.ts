// ==========================================
// Apex Suite: Math Lab - Custom Solution Verify API
// ==========================================
// 自分流の解法メモを Gemini が熟読し、類似問題への汎用性と罠を判定する。
// GEMINI_API_KEY 最優先。未設定・タイムアウト時のみローカル検証。

import { NextResponse } from 'next/server';
import type {
  CustomSolutionVerifyContext,
  CustomSolutionVerifyResult,
  CustomSolutionVerifyStatus,
} from '@/types/mathLab';
import { verifyCustomSolutionMock } from '@/lib/mock/verifyCustomSolution';
import { completeGeminiJson } from '@/lib/llm/completeJson';

interface VerifyRequestBody {
  customText?: unknown;
  context?: unknown;
}

export const maxDuration = 30;

const STATUSES: CustomSolutionVerifyStatus[] = ['perfect', 'warning', 'invalid'];

function normalizeText(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseContext(raw: unknown): CustomSolutionVerifyContext {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;

  const context: CustomSolutionVerifyContext = {
    questionText: readOptionalString(source, 'questionText'),
    title: readOptionalString(source, 'title'),
    unit: readOptionalString(source, 'unit'),
    patternName: readOptionalString(source, 'patternName'),
    patternId: readOptionalString(source, 'patternId'),
    strategyText: readOptionalString(source, 'strategyText'),
    keyFormula: readOptionalString(source, 'keyFormula'),
    exampleQuestion: readOptionalString(source, 'exampleQuestion'),
    commonMistakes: readOptionalString(source, 'commonMistakes'),
  };

  if (source.mode === 'problem' || source.mode === 'pattern') {
    context.mode = source.mode;
  }
  if (typeof source.correctAnswer === 'string' || typeof source.correctAnswer === 'number') {
    context.correctAnswer = source.correctAnswer;
  }
  if (Array.isArray(source.explanationSteps)) {
    context.explanationSteps = source.explanationSteps.filter(
      (step): step is string => typeof step === 'string'
    );
  }

  return context;
}

function isVerifyResult(value: unknown): value is CustomSolutionVerifyResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    STATUSES.includes(candidate.status as CustomSolutionVerifyStatus) &&
    typeof candidate.feedback === 'string' &&
    candidate.feedback.trim().length > 0
  );
}

async function verifyViaLlm(
  customText: string,
  context: CustomSolutionVerifyContext
): Promise<CustomSolutionVerifyResult | null> {
  const systemPrompt =
    'あなたは高校の数学・物理・化学の解法を厳格に審査する教師です。' +
    'ユーザーが書いた解法メモを熟読し、単語マッチではなく論理で判定する。' +
    '出力はJSONのみ。キーは status, feedback, edgeCaseNote。' +
    'status は perfect / warning / invalid。' +
    'perfect: その解き方が数字を変えた全類似問題に通用し、除外点・場合分けの漏れがない。' +
    'warning: 大筋は正しいが、落ちやすい罠（除外点、定義域、符号、端点、適用条件）がある。' +
    'invalid: 誤り、過一般化、または論理の飛躍がある。' +
    'feedback は親身で具体的な日本語（2〜4文）。edgeCaseNote は反例や罠を1文。' +
    '数式は $...$ の LaTeX で書いてよい。';

  const userPrompt = JSON.stringify({
    customText,
    context,
    outputSchema: {
      status: 'perfect | warning | invalid',
      feedback: 'string',
      edgeCaseNote: 'string (optional)',
    },
  });

  try {
    const parsed = await completeGeminiJson({
      systemPrompt,
      userPrompt,
      temperature: 0.25,
      timeoutMs: 18000,
      maxGeminiAttempts: 3,
    });
    if (!isVerifyResult(parsed)) return null;

    return {
      status: parsed.status,
      feedback: parsed.feedback.trim(),
      edgeCaseNote:
        typeof parsed.edgeCaseNote === 'string' && parsed.edgeCaseNote.trim().length > 0
          ? parsed.edgeCaseNote.trim()
          : undefined,
    };
  } catch (error) {
    console.error('[verify-custom-solution] LLM検証に失敗、モックにフォールバックします', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: VerifyRequestBody = {};
  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    body = {};
  }

  const customText = normalizeText(body.customText);
  const context = parseContext(body.context);

  const viaLlm = await verifyViaLlm(customText, context);
  const result = viaLlm ?? verifyCustomSolutionMock(customText, context);

  return NextResponse.json(result);
}

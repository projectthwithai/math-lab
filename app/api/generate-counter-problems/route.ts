// ==========================================
// Apex Suite: Math Lab - Counter-example trap problem API
// ==========================================
// 生徒の解法メモが通用しない具体的な反例問題を 1〜3 問生成する。
// 指揮官（NEXT_PUBLIC_ADMIN_EMAIL）は永久無料の Gemini 1.5 Flash 固定。

import { NextResponse } from 'next/server';
import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';
import { problemFromPayload } from '@/lib/engine/problemFromPayload';
import { generateCounterProblemsMock } from '@/lib/mock/generateCounterProblemsMock';
import { trapPatternName } from '@/lib/engine/trapPatternFromProblem';
import { ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';

export const maxDuration = 30;

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function buildSystemPrompt(customNote: string): string {
  const note = customNote.trim() || '(未記入)';
  return (
    `生徒の解法メモ『${note}』を使うと、計算が複雑化して解けない、または誤答・不成立になってしまう具体的な反例問題（数学/理科）を1~3問生成してください。` +
    `なぜ生徒の解法では通用せず、どう解くべきかの解説を含んだ GeneratedProblem 配列を返却してください。` +
    `出力はJSONのみ。キーは problems（配列、1〜3件）。数式は $...$ の LaTeX。` +
    `各問題の explanation.commonMistakes に「なぜメモの解法では通用しないか」、` +
    `explanation.stepByStep に「どう解くべきか」を書く。correctAnswer は採点可能な具体値にする。`
  );
}

function extractProblemPayloads(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.problems)) return record.problems;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

function finalizeCounterProblem(
  raw: unknown,
  index: number,
  fallback: { subject?: Subject; unit?: string; difficulty?: number }
): GeneratedProblem | null {
  const problem = problemFromPayload(raw, {
    ...fallback,
    idPrefix: `trap-${Date.now()}-${index}`,
  });
  if (!problem) return null;
  const patternId = problem.patternId?.trim() || `trap-${problem.id}`;
  return ensureProblemHasCorrectAnswer({
    ...problem,
    title: trapPatternName(problem.title),
    patternId,
    fromDiscoveredPattern: true,
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const questionText = readString(body.questionText);
  const customNote = readString(body.customNote);
  const aiFeedback = readString(body.aiFeedback);
  const unit = readString(body.unit);
  const subject = isSubject(body.subject) ? body.subject : undefined;
  const difficulty = typeof body.difficulty === 'number' ? body.difficulty : undefined;
  const userEmail = await resolveRouterUserEmail(request, body.userEmail);

  if (!questionText && !customNote && !aiFeedback) {
    return NextResponse.json(
      { error: '原問、解法メモ、またはAIの注意点が必要です。' },
      { status: 400 }
    );
  }

  const fallback = { subject, unit, difficulty };
  const userPrompt = JSON.stringify({
    questionText,
    customNote,
    aiFeedback,
    subject: subject ?? 'math',
    unit: unit || '総合',
    difficulty: difficulty ?? 3,
    outputSchema: {
      problems: [
        {
          title: 'string',
          unit: 'string',
          subject: 'math | physics | chemistry',
          format: 'input | choice | descriptive',
          questionText: 'string',
          correctAnswer: 'string | number',
          choices: 'string[] (format=choice のとき)',
          hints: '[string, string, string]',
          explanation: {
            stepByStep: 'string[]（正しい解き方）',
            keyFormula: 'string',
            commonMistakes: 'string（なぜ生徒の解法では通用しないか）',
          },
        },
      ],
    },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt: buildSystemPrompt(customNote),
      userPrompt,
      userEmail,
      temperature: 0.5,
      timeoutMs: 22000,
      maxGeminiAttempts: 3,
    });
    const payloads = extractProblemPayloads(routed?.data);
    const problems = payloads
      .map((item, index) => finalizeCounterProblem(item, index, fallback))
      .filter((item): item is GeneratedProblem => Boolean(item))
      .slice(0, 3);

    if (problems.length > 0) {
      return NextResponse.json({ problems });
    }
  } catch (error) {
    console.error('[generate-counter-problems] LLM生成に失敗、モックにフォールバックします', error);
  }

  return NextResponse.json({
    problems: generateCounterProblemsMock({
      questionText,
      customNote,
      aiFeedback,
      subject,
      unit,
    }),
  });
}

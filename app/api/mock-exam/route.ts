// ==========================================
// Apex Suite: Math Lab - Mock Exam Generation API
// ==========================================
// Gemini (GEMINI_API_KEY) 直通で大問をリアルタイム生成する。
// 通信エラー時のみ、高校数I教科書応用〜共通テスト水準のローカル模試へフォールバック。
// 中学の展開・定数項ダミーは使わない。

import { NextResponse } from 'next/server';
import type { GeneratedProblem } from '@/types/mathLab';
import { getUnitById } from '@/data/unitsData';
import { getDifficultyMeta, getDifficultyTier } from '@/lib/engine/difficultyScale';
import {
  applyMockExamStyle,
  buildMockExamProblems,
  parseMockExamConfigFromUnknown,
  type MockExamConfig,
} from '@/lib/engine/mockExam';
import { problemFromPayload } from '@/lib/engine/problemFromPayload';
import { completeGeminiJson, hasGeminiApiKey } from '@/lib/llm/completeJson';
import {
  buildDifficultyGuide,
  buildMockExamSystemPrompt,
  isLowQualityDummyQuestion,
} from '@/lib/llm/examPrompts';
import { cleanGeneratedProblem } from '@/lib/utils/mathFormatter';

export const maxDuration = 60;

function extractProblemArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return [];
  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.problems)) return record.problems;
  if (record.title || record.templateText || record.questionText) return [parsed];
  return [];
}

async function generateViaGemini(config: MockExamConfig): Promise<GeneratedProblem[] | null> {
  if (!hasGeminiApiKey()) {
    console.warn('[mock-exam] GEMINI_API_KEY が未設定のため、高品質ローカル模試へフォールバックします');
    return null;
  }

  const difficulty = config.difficulty;
  const meta = getDifficultyMeta(difficulty);
  const slots = Array.from({ length: config.questionCount }, (_, index) => {
    const unitId = config.unitIds[index % config.unitIds.length];
    const unit = getUnitById(unitId);
    const patternId = config.patternIds?.[index % (config.patternIds.length || 1)];
    return {
      index: index + 1,
      unitId,
      unitTitle: unit?.title ?? '数学I',
      subject: unit?.subject ?? 'math',
      patternId: patternId ?? null,
    };
  });

  const subjects = [...new Set(slots.map((slot) => slot.subject))];
  const systemPrompt = buildMockExamSystemPrompt(difficulty, config.questionCount, subjects);
  const userPrompt = JSON.stringify({
    difficulty,
    difficultyTier: getDifficultyTier(difficulty),
    difficultyGuide: buildDifficultyGuide(difficulty, subjects[0] ?? 'math'),
    subjectRubric: '数学・物理・化学それぞれの★1〜★5ルーブリックに従え。スロットの subject を守ること。',
    style: config.style,
    questionCount: config.questionCount,
    slots,
    outputSchema: {
      problems: [
        {
          title: `string（先頭に ${meta.starLabel}${meta.label} を付ける）`,
          unit: 'string',
          subject: 'math | physics | chemistry',
          format: 'input | choice | descriptive',
          questionText: 'string（完成した問題文。中学の展開ドリルは禁止）',
          correctAnswer: 'string | number',
          variables: '{ [name]: { min: number, max: number, step: number } }',
          templateText: 'string (プレースホルダーは {{varName}} 形式)',
          calcLogicJS: 'string (function body)。correctAnswer と必ず一致すること',
          hints: '[string, string, string]',
          keyFormula: 'string（$...$ の LaTeX 1行）',
          commonMistakes: 'string',
          explanation: { stepByStep: 'string[]（途中式を $...$ で6行以上、★4〜5）', keyFormula: 'string', commonMistakes: 'string' },
          visualType: 'none | math_graph | geometry_svg | physics_simulation | chemistry_animation',
        },
      ],
    },
  });

  const parsed = await completeGeminiJson({
    systemPrompt,
    userPrompt,
    temperature: difficulty >= 5 ? 0.55 : 0.45,
    timeoutMs: 22000,
    maxGeminiAttempts: 3,
  });
  if (!parsed) return null;

  const generated: GeneratedProblem[] = [];
  for (const [index, raw] of extractProblemArray(parsed).entries()) {
    const slot = slots[index] ?? slots[0];
    const problem = problemFromPayload(raw, {
      unit: slot.unitTitle,
      subject: slot.subject,
      difficulty,
      idPrefix: `gemini-exam-${index}`,
    });
    if (!problem) continue;
    if (isLowQualityDummyQuestion(problem.questionText, difficulty) || isLowQualityDummyQuestion(problem.title, difficulty)) {
      continue;
    }
    generated.push(
      applyMockExamStyle(
        cleanGeneratedProblem({
          ...problem,
          difficulty,
          patternId: problem.patternId ?? slot.patternId ?? slot.unitId,
        }),
        config,
        index
      )
    );
  }

  return generated.length > 0 ? generated : null;
}

function fillToCount(config: MockExamConfig, geminiProblems: GeneratedProblem[]): GeneratedProblem[] {
  if (geminiProblems.length >= config.questionCount) {
    return geminiProblems.slice(0, config.questionCount).map((problem, index) => ({
      ...problem,
      id: `mock-exam-${index}-${problem.id}`,
    }));
  }

  const fallback = buildMockExamProblems(config);
  const merged = [...geminiProblems];
  for (const candidate of fallback) {
    if (merged.length >= config.questionCount) break;
    if (merged.some((item) => item.questionText === candidate.questionText)) continue;
    merged.push(candidate);
  }
  return merged.slice(0, config.questionCount).map((problem, index) => ({
    ...problem,
    id: `mock-exam-${index}-${problem.id}`,
  }));
}

function raceTimeout<T>(promise: Promise<T | null>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[mock-exam] Gemini が時間内に応答しなかったため、高校レベル模試へフォールバックします');
      resolve(null);
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        console.error('[mock-exam] Gemini 生成に失敗', error);
        resolve(null);
      });
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const config = parseMockExamConfigFromUnknown(body);
  if (!config) {
    return NextResponse.json({ error: '模試の単元設定が不正です。' }, { status: 400 });
  }

  try {
    const viaGemini = await raceTimeout(generateViaGemini(config), 48000);
    if (viaGemini) {
      return NextResponse.json({
        problems: fillToCount(config, viaGemini),
        source: viaGemini.length >= config.questionCount ? 'gemini' : 'gemini+fallback',
      });
    }
  } catch (error) {
    console.error('[mock-exam] Gemini 生成に失敗', error);
  }

  return NextResponse.json({
    problems: buildMockExamProblems(config),
    source: 'fallback',
  });
}

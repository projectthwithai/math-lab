// ==========================================
// Apex Suite: Math Lab - AI Pattern Discovery API
// ==========================================
// 指定単元の「まだ図鑑に無い」高度な解法パターンを 3〜5 件発掘する。
// 生成結果は `discovered: true` を付けて返し、クライアントが
// `userStore.discoveredPatterns`（単元演習の出題プール）へ自動保存する。
// .cursorrules の API Cost Minimization:
// - GEMINI_API_KEY があれば gemini-1.5-flash、なければ gpt-4o-mini
// - 未設定・失敗時はローカル発掘エンジン（ゼロコスト）

import { NextResponse } from 'next/server';
import type { PatternLevel, SolutionPattern, Subject } from '@/types/mathLab';
import { getUnitById } from '@/data/unitsData';
import { SOLUTION_PATTERNS } from '@/data/patternsData';
import { generateMockPatterns } from '@/lib/mock/generateMockPatterns';
import { completeLlmJson } from '@/lib/llm/completeJson';
import { resolveSubtopicIdForPattern } from '@/data/subtopicsData';

interface GeneratePatternsBody {
  unitId?: unknown;
  subject?: unknown;
  existingNames?: unknown;
  count?: unknown;
  subtopicId?: unknown;
}

function normalizeId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseCount(raw: unknown): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(3, Math.min(5, Math.round(parsed)));
}

function parseExistingNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function isSubject(value: unknown): value is Subject {
  return value === 'math' || value === 'physics' || value === 'chemistry';
}

function isLevel(value: unknown): value is PatternLevel {
  return value === 'basic' || value === 'standard' || value === 'advanced';
}

function isPatternLike(value: unknown): value is {
  patternName: string;
  exampleQuestion: string;
  strategyText: string;
  level?: PatternLevel;
} {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.patternName === 'string' &&
    candidate.patternName.trim().length > 0 &&
    typeof candidate.exampleQuestion === 'string' &&
    candidate.exampleQuestion.trim().length > 0 &&
    typeof candidate.strategyText === 'string' &&
    candidate.strategyText.trim().length > 0
  );
}

async function generateViaLlm(params: {
  unitId?: string;
  subject?: Subject;
  existingNames: string[];
  count: number;
}): Promise<SolutionPattern[] | null> {
  const unit = params.unitId ? getUnitById(params.unitId) : undefined;
  const subject: Subject = unit?.subject ?? params.subject ?? 'math';
  const unitTitle = unit?.title ?? '総合';

  const systemPrompt =
    'あなたは高校入試・大学入試の解法パターンを発掘する専門家です。' +
    '出力はJSONオブジェクトのみ。キー patterns に配列を入れてください。' +
    '各要素は patternName, exampleQuestion, strategyText, level(basic|standard|advanced) を持つ。' +
    'exampleQuestion は具体的な1問で、数式は $...$ で囲む。' +
    'LaTeXは \\sin や \\frac を使ってよい。' +
    '既存パターン名と重複するテーマは出さない。' +
    '解き方の方針は STEP を含む実践的な文章にする。';

  const userPrompt = JSON.stringify({
    subject,
    unitTitle,
    count: params.count,
    avoidPatternNames: params.existingNames.slice(0, 40),
  });

  try {
    const parsedRaw = await completeLlmJson({ systemPrompt, userPrompt });
    const parsed = parsedRaw as { patterns?: unknown } | null;
    if (!parsed) return null;
    const rawList = Array.isArray(parsed.patterns) ? parsed.patterns : Array.isArray(parsed) ? parsed : [];
    const stamp = Date.now();
    const patterns = rawList
      .filter(isPatternLike)
      .slice(0, params.count)
      .map((item, index) => ({
        id: `ai-pat-${unit?.id ?? subject}-${stamp}-${index}`,
        subject,
        unit: unitTitle,
        unitId: unit?.id ?? params.unitId,
        level: isLevel(item.level) ? item.level : index % 3 === 0 ? 'basic' : index % 3 === 1 ? 'standard' : 'advanced',
        patternName: item.patternName.trim(),
        exampleQuestion: item.exampleQuestion.trim(),
        strategyText: item.strategyText.trim(),
        discovered: true,
      })) satisfies SolutionPattern[];

    return patterns.length >= 3 ? patterns : null;
  } catch (error) {
    console.error('[generate-patterns] LLM発掘に失敗、ローカルにフォールバックします', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: GeneratePatternsBody = {};
  try {
    body = (await request.json()) as GeneratePatternsBody;
  } catch {
    body = {};
  }

  const unitId = normalizeId(body.unitId);
  const subtopicId = normalizeId(body.subtopicId);
  const subject = isSubject(body.subject) ? body.subject : undefined;
  const count = parseCount(body.count);
  const extraNames = parseExistingNames(body.existingNames);
  const catalogNames = SOLUTION_PATTERNS.filter((pattern) => !unitId || pattern.unitId === unitId).map(
    (pattern) => pattern.patternName
  );
  const existingNames = [...new Set([...catalogNames, ...extraNames])];

  const viaLlm = await generateViaLlm({ unitId, subject, existingNames, count });
  const rawPatterns = viaLlm ?? generateMockPatterns({ unitId, subject, existingNames, count });
  // クライアントはレスポンスを userStore.discoveredPatterns に自動保存する。
  const patterns = rawPatterns.map((pattern) => {
    const next = {
      ...pattern,
      unitId: pattern.unitId ?? unitId,
      discovered: true as const,
    };
    return { ...next, subtopicId: next.subtopicId ?? subtopicId ?? resolveSubtopicIdForPattern(next) };
  });

  return NextResponse.json({
    patterns,
    source: viaLlm ? 'llm' : 'local',
    persistToStore: true,
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const unitId = normalizeId(url.searchParams.get('unitId'));
  const rawSubject = url.searchParams.get('subject');
  const subject = isSubject(rawSubject) ? rawSubject : undefined;
  const count = parseCount(url.searchParams.get('count'));

  const existingNames = SOLUTION_PATTERNS.filter((pattern) => !unitId || pattern.unitId === unitId).map(
    (pattern) => pattern.patternName
  );
  const patterns = generateMockPatterns({ unitId, subject, existingNames, count }).map((pattern) => {
    const next = {
      ...pattern,
      unitId: pattern.unitId ?? unitId,
      discovered: true as const,
    };
    return { ...next, subtopicId: next.subtopicId ?? resolveSubtopicIdForPattern(next) };
  });
  return NextResponse.json({ patterns, source: 'local', persistToStore: true });
}

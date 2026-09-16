// ==========================================
// Apex Suite: Math Lab - Refine Solution Note API
// ==========================================
// 解法ロジック検証の指摘を踏まえ、生徒の解法メモを2〜3行に清書する。
// 指揮官（NEXT_PUBLIC_ADMIN_EMAIL）は永久無料の Gemini 1.5 Flash 固定。

import { NextResponse } from 'next/server';
import { resolveRouterUserEmail, routeLlmJson } from '@/lib/engine/aiRouter';
import { refineSolutionNoteMock } from '@/lib/mock/refineSolutionNoteMock';

export const maxDuration = 30;

const SYSTEM_PROMPT =
  'あなたは生徒の解法ノートを推敲する専属チューターです。生徒が書いた元のメモの表現や考え方を尊重しながら、AIの注意点（条件見落とし防止、ミスの防ぎ方、事前の手順など）を自然に盛り込み、生徒が復習で見返した時に一瞬で思い出せる『抜け目のない完璧な解法メモ（2~3行程度）』にブラッシュアップ（清書）して返却してください。' +
  '出力はJSONのみ。キーは refinedNote。数式は $...$ の LaTeX で書いてよい。元メモに無い別解で上書きしない。';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRefinedNote(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const note = (raw as Record<string, unknown>).refinedNote;
  if (typeof note !== 'string' || !note.trim()) return null;
  return note.trim();
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const originalNote = readString(body.originalNote);
  const aiFeedback = readString(body.aiFeedback);
  const questionText = readString(body.questionText);
  const keyFormula = readString(body.keyFormula);
  const userEmail = await resolveRouterUserEmail(request, body.userEmail);

  if (!originalNote && !aiFeedback) {
    return NextResponse.json(
      { error: '元のメモか、AIの注意点が必要です。' },
      { status: 400 }
    );
  }

  const userPrompt = JSON.stringify({
    originalNote,
    aiFeedback,
    questionText,
    keyFormula,
    outputSchema: { refinedNote: 'string (2〜3行の清書メモ)' },
  });

  try {
    const routed = await routeLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      userEmail,
      temperature: 0.35,
      timeoutMs: 18000,
      maxGeminiAttempts: 3,
    });
    const refinedNote = parseRefinedNote(routed?.data);
    if (refinedNote) {
      return NextResponse.json({ refinedNote });
    }
  } catch (error) {
    console.error('[refine-solution-note] LLM清書に失敗、モックにフォールバックします', error);
  }

  return NextResponse.json({
    refinedNote: refineSolutionNoteMock({ originalNote, aiFeedback, keyFormula }),
  });
}

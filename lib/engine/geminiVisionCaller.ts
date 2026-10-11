// ==========================================
// Apex Suite: Math Lab - Gemini 3 Vision fallback
// ==========================================
// 画像解析・手書き添削は Gemini 3 世代のみ。429 / クォータ超過では
// 画面を落とさず、次の高スループットモデルへ即座に切り替える。

import { parseLlmJsonObject } from '@/lib/llm/parseLlmJson';

export const GEMINI_3_VISION_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
] as const;

export type Gemini3VisionModel = (typeof GEMINI_3_VISION_MODELS)[number];

export interface GeminiVisionImage {
  mimeType: string;
  base64: string;
}

export interface GeminiVisionCallParams {
  systemPrompt: string;
  userPrompt: string;
  image: GeminiVisionImage;
  temperature?: number;
  timeoutMs?: number;
}

function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return key || undefined;
}

function stripMarkdownFence(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export function extractGeminiJson(raw: string): unknown | null {
  const withoutFence = stripMarkdownFence(raw);
  return parseLlmJsonObject(withoutFence) ?? parseLlmJsonObject(raw);
}

export function isGeminiQuotaExceeded(status: number, body: string): boolean {
  if (status === 429) return true;
  const text = body.toLowerCase();
  return (
    text.includes('resource_exhausted') ||
    text.includes('quota exceeded') ||
    text.includes('quotaexceeded') ||
    /\blimit:\s*20\b/.test(text)
  );
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError');
}

function readGoogleErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    const message = parsed.error?.message?.trim();
    if (message) return `Gemini HTTP ${status}: ${message}`;
  } catch {
    // 本文が JSON でない場合は生テキストを使う
  }
  const clipped = body.replace(/\s+/g, ' ').trim().slice(0, 240);
  return clipped ? `Gemini HTTP ${status}: ${clipped}` : `Gemini HTTP ${status}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildVisionBody(params: GeminiVisionCallParams): Record<string, unknown> {
  return {
    systemInstruction: { parts: [{ text: params.systemPrompt }] },
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: params.image.mimeType || 'image/jpeg',
              data: params.image.base64,
            },
          },
          { text: params.userPrompt },
        ],
      },
    ],
    generationConfig: {
      temperature: params.temperature ?? 0.2,
      responseMimeType: 'application/json',
    },
  };
}

/**
 * Gemini 3 世代を優先順に呼び、429 では次モデルへ即座にフォールバックする。
 * 成功時は ```json フェンスを除いた純粋な JSON オブジェクトを返す。
 */
export async function callGeminiVisionJson(params: GeminiVisionCallParams): Promise<unknown> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が設定されていません');
  }
  if (!params.image.base64) {
    throw new Error('画像データが空です');
  }

  const budgetMs = params.timeoutMs ?? 55_000;
  const started = Date.now();
  const body = buildVisionBody(params);
  const failures: string[] = [];

  for (const model of GEMINI_3_VISION_MODELS) {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining < 4_000) break;
    const timeoutMs = Math.min(20_000, remaining);

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
        },
        timeoutMs
      );
    } catch (error) {
      if (isAbortError(error)) {
        failures.push(`${model}: 時間内に応答しませんでした`);
        continue;
      }
      const message = error instanceof Error ? error.message : '通信エラー';
      failures.push(`${model}: ${message}`);
      continue;
    }

    const raw = await response.text();
    if (!response.ok) {
      const message = readGoogleErrorMessage(response.status, raw);
      if (isGeminiQuotaExceeded(response.status, raw)) {
        console.info(`[gemini-vision] ${model} がクォータ超過のため次モデルへ切り替えます`);
        failures.push(`${model}: クォータ超過`);
        continue;
      }
      if (response.status === 404 || response.status === 503) {
        console.info(`[gemini-vision] ${model} は利用できないため次モデルへ切り替えます`);
        failures.push(`${model}: ${message}`);
        continue;
      }
      console.error('Gemini Vision Error:', message);
      throw new Error(message);
    }

    let payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      failures.push(`${model}: 応答 JSON を解析できませんでした`);
      continue;
    }

    const text = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) {
      failures.push(`${model}: 空の応答`);
      continue;
    }

    const parsed = extractGeminiJson(text);
    if (!parsed || typeof parsed !== 'object') {
      failures.push(`${model}: JSON 抽出に失敗`);
      continue;
    }

    console.info(`[gemini-vision] ${model} で JSON を生成しました`);
    return parsed;
  }

  const quotaOnly = failures.length > 0 && failures.every((item) => item.includes('クォータ超過'));
  if (quotaOnly) {
    throw new Error('利用可能な Gemini 3 世代モデルのクォータを使い切りました。時間をおいて再試行してください。');
  }
  throw new Error(failures[failures.length - 1] || 'Gemini Vision との通信に失敗しました');
}

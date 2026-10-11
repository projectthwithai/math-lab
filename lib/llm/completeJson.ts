// ==========================================
// Apex Suite: Math Lab - LLM JSON / text completion
// ==========================================
// 低レベル呼び出し。プロバイダ選択は `lib/engine/aiRouter.ts` が行う。
// Gemini は gemini-1.5-flash を優先し、廃止済みなら無料枠の Flash 系へ自動フォールバックする。

import { parseLlmJsonObject } from '@/lib/llm/parseLlmJson';

export interface LlmImagePart {
  mimeType: string;
  base64: string;
}

export type LlmProvider = 'gemini' | 'openai';

export interface CompleteJsonParams {
  systemPrompt: string;
  userPrompt: string;
  image?: LlmImagePart;
  temperature?: number;
  /** true のとき OpenAI へ落とさず Gemini のみ */
  geminiOnly?: boolean;
  /** ルーター指定。gemini = Gemini のみ / openai = GPT-4o-mini のみ */
  forceProvider?: LlmProvider;
  /** 1モデルあたりの待ち時間（ms） */
  timeoutMs?: number;
  /** 試す Gemini モデル数の上限 */
  maxGeminiAttempts?: number;
}

const GEMINI_MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
];

let cachedGeminiModel: string | null | undefined;

export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return key || undefined;
}

export function getOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}

function parseJsonObject(raw: string): unknown | null {
  return parseLlmJsonObject(raw);
}

function stripMarkdownFence(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export function parseGeminiJsonText(raw: string): unknown | null {
  const withoutFence = stripMarkdownFence(raw);
  return parseJsonObject(withoutFence) ?? parseJsonObject(raw);
}

function readGoogleErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    if (message) return `Gemini HTTP ${status}: ${message}`;
  } catch {
    // 本文が JSON でない場合は生テキストを使う
  }
  const clipped = body.replace(/\s+/g, ' ').trim().slice(0, 240);
  return clipped ? `Gemini HTTP ${status}: ${clipped}` : `Gemini HTTP ${status}`;
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError');
}

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function listGeminiFlashModel(apiKey: string, timeoutMs: number): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      'https://generativelanguage.googleapis.com/v1beta/models',
      { headers: geminiHeaders(apiKey) },
      Math.min(8000, timeoutMs)
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { models?: Array<{ name?: string }> };
    const names = (data.models ?? [])
      .map((model) => (model.name ?? '').replace(/^models\//, ''))
      .filter(Boolean);
    for (const candidate of GEMINI_MODEL_CANDIDATES) {
      if (names.includes(candidate)) return candidate;
    }
    return (
      names.find(
        (name) =>
          name.includes('flash') &&
          !name.includes('image') &&
          !name.includes('tts') &&
          !name.includes('embed')
      ) ?? null
    );
  } catch {
    return null;
  }
}

async function requestGeminiModelText(
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<string | null> {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify(body),
    },
    timeoutMs
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`[llm] Gemini (${model}) HTTP ${response.status}`, detail.slice(0, 400));
    return null;
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();
  return text || null;
}

function buildGeminiBody(params: CompleteJsonParams, jsonMode: boolean): Record<string, unknown> {
  const parts: Array<Record<string, unknown>> = [];
  if (params.image?.base64) {
    parts.push({
      inlineData: {
        mimeType: params.image.mimeType || 'image/jpeg',
        data: params.image.base64,
      },
    });
  }
  parts.push({ text: params.userPrompt });

  const generationConfig: Record<string, unknown> = {
    temperature: params.temperature ?? 0.4,
  };
  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  return {
    systemInstruction: { parts: [{ text: params.systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig,
  };
}

async function generateGeminiContent(
  params: CompleteJsonParams,
  jsonMode: boolean
): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const timeoutMs = params.timeoutMs ?? 25000;
  const maxAttempts = params.maxGeminiAttempts ?? GEMINI_MODEL_CANDIDATES.length;
  const body = buildGeminiBody(params, jsonMode);

  const listed = cachedGeminiModel ?? (await listGeminiFlashModel(apiKey, timeoutMs));
  const models = [
    ...(listed ? [listed] : []),
    ...GEMINI_MODEL_CANDIDATES.filter((model) => model !== listed),
  ].slice(0, Math.max(1, maxAttempts));

  for (const model of models) {
    try {
      const text = await requestGeminiModelText(apiKey, model, body, timeoutMs);
      if (text) {
        cachedGeminiModel = model;
        console.info(`[llm] Gemini (${model}) で ${jsonMode ? 'JSON' : 'テキスト'} を生成しました`);
        return text;
      }
    } catch (error) {
      console.error(`[llm] Gemini (${model}) 呼び出しに失敗`, error);
    }
  }

  return null;
}

async function completeViaGemini(params: CompleteJsonParams): Promise<unknown | null> {
  const text = await generateGeminiContent(params, true);
  if (!text) return null;
  const parsed = parseJsonObject(text);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

async function completeViaGeminiText(params: CompleteJsonParams): Promise<string | null> {
  return generateGeminiContent(params, false);
}

function buildOpenAiUserContent(params: CompleteJsonParams): unknown {
  return params.image
    ? [
        { type: 'text', text: params.userPrompt },
        {
          type: 'image_url',
          image_url: { url: `data:${params.image.mimeType};base64,${params.image.base64}` },
        },
      ]
    : params.userPrompt;
}

async function completeViaOpenAiText(params: CompleteJsonParams, jsonMode: boolean): Promise<string | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;
  const timeoutMs = params.timeoutMs ?? 25000;

  try {
    const response = await fetchWithTimeout(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          temperature: params.temperature ?? 0.4,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: buildOpenAiUserContent(params) },
          ],
        }),
      },
      timeoutMs
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch (error) {
    console.error('[llm] OpenAI 呼び出しに失敗', error);
    return null;
  }
}

async function completeViaOpenAi(params: CompleteJsonParams): Promise<unknown | null> {
  const content = await completeViaOpenAiText(params, true);
  if (!content) return null;
  return parseJsonObject(content);
}

function shouldUseGeminiOnly(params: CompleteJsonParams): boolean {
  return params.forceProvider === 'gemini' || Boolean(params.geminiOnly);
}

function shouldUseOpenAiOnly(params: CompleteJsonParams): boolean {
  return params.forceProvider === 'openai';
}

/** ルーター指定があればそのプロバイダのみ。未指定時は Gemini → OpenAI。 */
export async function completeLlmJson(params: CompleteJsonParams): Promise<unknown | null> {
  if (!getGeminiApiKey() && !getOpenAiApiKey()) return null;

  if (shouldUseOpenAiOnly(params)) {
    return completeViaOpenAi(params);
  }

  const viaGemini = await completeViaGemini(params);
  if (viaGemini !== null) return viaGemini;
  if (shouldUseGeminiOnly(params)) {
    if (hasGeminiApiKey()) {
      console.error('[llm] Gemini 呼び出しに失敗したため、ダミー問題は返さず失敗とします');
    }
    return null;
  }
  if (hasGeminiApiKey()) {
    console.error('[llm] Gemini 呼び出しに失敗したため、次のフォールバックを試します');
  }
  return completeViaOpenAi(params);
}

/** JSON ではなくプレーンテキスト（チューターチャット等）を返す。 */
export async function completeLlmText(params: CompleteJsonParams): Promise<string | null> {
  if (!getGeminiApiKey() && !getOpenAiApiKey()) return null;

  if (shouldUseOpenAiOnly(params)) {
    return completeViaOpenAiText(params, false);
  }

  const viaGemini = await completeViaGeminiText(params);
  if (viaGemini) return viaGemini;
  if (shouldUseGeminiOnly(params)) return null;
  return completeViaOpenAiText(params, false);
}

/** 模試など Gemini 直通専用。失敗時は null（呼び出し元が高品質ローカル模試へ）。 */
export async function completeGeminiJson(params: CompleteJsonParams): Promise<unknown | null> {
  return completeLlmJson({ ...params, geminiOnly: true, forceProvider: 'gemini' });
}

const VISION_MODELS = [
  'gemini-1.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
] as const;

/**
 * 画像解析専用。gemini-1.5-flash を直接呼び、失敗時は null を返さず Error を投げる。
 */
export async function completeGeminiVisionJson(params: CompleteJsonParams): Promise<unknown> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が設定されていません');
  }
  if (!params.image?.base64) {
    throw new Error('画像データが空です');
  }

  const timeoutMs = params.timeoutMs ?? 55_000;
  const body = buildGeminiBody(
    { ...params, forceProvider: 'gemini', geminiOnly: true },
    true
  );
  const failures: string[] = [];

  for (const model of VISION_MODELS) {
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: geminiHeaders(apiKey),
          body: JSON.stringify(body),
        },
        timeoutMs
      );
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(`Gemini が時間内に応答しませんでした（${Math.round(timeoutMs / 1000)}秒）`);
      }
      const message = error instanceof Error ? error.message : '通信エラー';
      failures.push(`${model}: ${message}`);
      continue;
    }

    const raw = await response.text();
    if (!response.ok) {
      const message = readGoogleErrorMessage(response.status, raw);
      console.error('Gemini Vision Error:', message);
      failures.push(`${model}: ${message}`);
      if (response.status === 404 || response.status === 429 || response.status === 503) continue;
      throw new Error(message);
    }

    let payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      throw new Error('Gemini 応答の JSON を解析できませんでした');
    }

    const text = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new Error('Gemini から空の応答が返りました');
    }

    const parsed = parseGeminiJsonText(text);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Gemini の JSON を解析できませんでした（マークダウン除去後）');
    }
    cachedGeminiModel = model;
    console.info(`[llm] Gemini Vision (${model}) で JSON を生成しました`);
    return parsed;
  }

  throw new Error(
    failures.find((item) => item.includes('HTTP 429')) ||
      failures[failures.length - 1] ||
      'Gemini Vision との通信に失敗しました'
  );
}

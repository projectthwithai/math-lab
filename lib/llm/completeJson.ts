// ==========================================
// Apex Suite: Math Lab - LLM JSON completion
// ==========================================
// 優先順:
//   1. GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY → Gemini Flash（REST）
//   2. OPENAI_API_KEY → gpt-4o-mini
//   3. 呼び出し元でローカルモックへフォールバック
// gemini-1.5-flash を優先し、廃止済みなら無料枠の Flash 系へ自動フォールバックする。

export interface LlmImagePart {
  mimeType: string;
  base64: string;
}

export interface CompleteJsonParams {
  systemPrompt: string;
  userPrompt: string;
  image?: LlmImagePart;
}

const GEMINI_MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
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

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function parseJsonObject(raw: string): unknown | null {
  try {
    return JSON.parse(extractJsonText(raw));
  } catch {
    return null;
  }
}

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

async function listGeminiFlashModel(apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: geminiHeaders(apiKey),
    });
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

async function requestGeminiModel(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<unknown | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();
  if (!text) return null;
  return parseJsonObject(text);
}

async function completeViaGemini(params: CompleteJsonParams): Promise<unknown | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const parts: Array<Record<string, unknown>> = [{ text: params.userPrompt }];
  if (params.image) {
    parts.push({
      inlineData: {
        mimeType: params.image.mimeType,
        data: params.image.base64,
      },
    });
  }

  const body = {
    systemInstruction: { parts: [{ text: params.systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  };

  const listed = cachedGeminiModel ?? (await listGeminiFlashModel(apiKey));
  const models = [
    ...(listed ? [listed] : []),
    ...GEMINI_MODEL_CANDIDATES.filter((model) => model !== listed),
  ];

  for (const model of models) {
    try {
      const parsed = await requestGeminiModel(apiKey, model, body);
      if (parsed && typeof parsed === 'object') {
        cachedGeminiModel = model;
        console.info(`[llm] Gemini (${model}) で JSON を生成しました`);
        return parsed;
      }
    } catch (error) {
      console.error(`[llm] Gemini (${model}) 呼び出しに失敗`, error);
    }
  }

  return null;
}

async function completeViaOpenAi(params: CompleteJsonParams): Promise<unknown | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  const userContent = params.image
    ? [
        { type: 'text', text: params.userPrompt },
        {
          type: 'image_url',
          image_url: { url: `data:${params.image.mimeType};base64,${params.image.base64}` },
        },
      ]
    : params.userPrompt;

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
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;
    return parseJsonObject(content);
  } catch (error) {
    console.error('[llm] OpenAI 呼び出しに失敗', error);
    return null;
  }
}

/** Gemini（キーがあれば）→ OpenAI → null。null のときは呼び出し元がモックへ落とす。 */
export async function completeLlmJson(params: CompleteJsonParams): Promise<unknown | null> {
  if (!getGeminiApiKey() && !getOpenAiApiKey()) return null;
  const viaGemini = await completeViaGemini(params);
  if (viaGemini !== null) return viaGemini;
  if (hasGeminiApiKey()) {
    console.error('[llm] Gemini 呼び出しに失敗したため、次のフォールバックを試します');
  }
  return completeViaOpenAi(params);
}

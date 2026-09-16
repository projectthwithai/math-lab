// ==========================================
// Apex Suite: Math Lab - Hybrid AI Model Router
// ==========================================
// 全ての AI エンドポイント（問題生成・模試・画像解析・手書き添削・チャット等）の
// 共通ルーター。指揮官アカウントは OpenAI キーの有無にかかわらず
// 生涯 Gemini 1.5 Flash（GEMINI_API_KEY）固定で API 代 0 円。

import { isAdminEmail } from '@/lib/auth/developerAccess';
import {
  completeLlmJson,
  completeLlmText,
  getGeminiApiKey,
  getOpenAiApiKey,
  type CompleteJsonParams,
  type LlmProvider,
} from '@/lib/llm/completeJson';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AiProvider = LlmProvider;

export interface AiRouterParams extends CompleteJsonParams {
  /** リクエスト元ユーザーのメール。指揮官判定に使う */
  userEmail?: string | null;
}

export interface AiJsonResult {
  data: unknown;
  provider: AiProvider;
}

export interface AiTextResult {
  text: string;
  provider: AiProvider;
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** 指揮官（NEXT_PUBLIC_ADMIN_EMAIL）なら true。 */
export function isCommanderUser(userEmail?: string | null): boolean {
  return isAdminEmail(userEmail);
}

/**
 * ルーティングルール:
 * - 指揮官: OpenAI キーの有無にかかわらず 100% Gemini
 * - 一般ユーザー: OPENAI_API_KEY があれば GPT-4o-mini、無ければ Gemini
 */
export function resolveAiProvider(userEmail?: string | null): AiProvider {
  if (isCommanderUser(userEmail)) return 'gemini';
  return getOpenAiApiKey() ? 'openai' : 'gemini';
}

export function hasRoutedProviderKey(userEmail?: string | null): boolean {
  const provider = resolveAiProvider(userEmail);
  return provider === 'gemini' ? Boolean(getGeminiApiKey()) : Boolean(getOpenAiApiKey());
}

function firstEmail(candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    const email = normalizeEmail(candidate);
    if (email) return email;
  }
  return undefined;
}

/**
 * セッション → ボディ → ヘッダーの順でメールを解決する。
 * いずれかが指揮官メールならそれを優先し、開発者を Gemini 永久固定する。
 */
export async function resolveRouterUserEmail(
  request: Request,
  bodyEmail?: unknown
): Promise<string | undefined> {
  const headerEmail = request.headers.get('x-user-email');
  const queryEmail = (() => {
    try {
      return new URL(request.url).searchParams.get('userEmail');
    } catch {
      return null;
    }
  })();

  let sessionEmail = '';
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      sessionEmail = data.user?.email ?? '';
    }
  } catch (error) {
    console.warn('[aiRouter] セッションメールの取得をスキップしました', error);
  }

  const candidates = [sessionEmail, bodyEmail, headerEmail, queryEmail];
  for (const candidate of candidates) {
    const email = normalizeEmail(candidate);
    if (isAdminEmail(email)) return email;
  }
  return firstEmail(candidates);
}

function withForcedProvider(params: AiRouterParams, provider: AiProvider): CompleteJsonParams {
  return {
    ...params,
    forceProvider: provider,
    geminiOnly: provider === 'gemini',
  };
}

function logRoute(provider: AiProvider, userEmail?: string | null): void {
  const commander = isCommanderUser(userEmail);
  console.info(
    `[aiRouter] ${provider === 'gemini' ? 'Gemini 1.5 Flash' : 'GPT-4o-mini'} を使用します` +
      (commander ? '（指揮官アカウント: 永久無料 Gemini 固定）' : '')
  );
}

async function completeJsonForProvider(
  params: AiRouterParams,
  provider: AiProvider
): Promise<unknown | null> {
  return completeLlmJson(withForcedProvider(params, provider));
}

async function completeTextForProvider(
  params: AiRouterParams,
  provider: AiProvider
): Promise<string | null> {
  return completeLlmText(withForcedProvider(params, provider));
}

/** JSON 応答。指揮官は Gemini のみ（OpenAI へ絶対に落とさない）。 */
export async function routeLlmJson(params: AiRouterParams): Promise<AiJsonResult | null> {
  const provider = resolveAiProvider(params.userEmail);
  logRoute(provider, params.userEmail);

  const primary = await completeJsonForProvider(params, provider);
  if (primary !== null) return { data: primary, provider };

  if (isCommanderUser(params.userEmail) || provider === 'gemini') return null;

  const fallback = await completeJsonForProvider(params, 'gemini');
  return fallback !== null ? { data: fallback, provider: 'gemini' } : null;
}

/** テキスト応答。指揮官は Gemini のみ。 */
export async function routeLlmText(params: AiRouterParams): Promise<AiTextResult | null> {
  const provider = resolveAiProvider(params.userEmail);
  logRoute(provider, params.userEmail);

  const primary = await completeTextForProvider(params, provider);
  if (primary) return { text: primary, provider };

  if (isCommanderUser(params.userEmail) || provider === 'gemini') return null;

  const fallback = await completeTextForProvider(params, 'gemini');
  return fallback ? { text: fallback, provider: 'gemini' } : null;
}

export function extractModelTextReply(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === 'object') {
      const source = parsed as Record<string, unknown>;
      for (const key of ['reply', 'advice', 'message', 'text', 'answer']) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }
  } catch {
    // プレーンテキストのまま返す
  }

  return candidate;
}

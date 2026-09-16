// ==========================================
// Apex Suite: Math Lab - AI Router client identity
// ==========================================
// 指揮官のローカル開発者セッションを API へ伝え、サーバー側ルーターが
// 永久 Gemini 固定できるようにする。

import { getAdminEmail, hasDeveloperPrivileges } from '@/lib/auth/developerAccess';

export function getAiRouterUserEmail(): string | undefined {
  if (!hasDeveloperPrivileges()) return undefined;
  const admin = getAdminEmail();
  return admin || undefined;
}

export function withAiRouterHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const email = getAiRouterUserEmail();
  if (email) headers.set('x-user-email', email);
  return headers;
}

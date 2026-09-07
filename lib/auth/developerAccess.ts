// ==========================================
// Apex Suite: Math Lab - Developer access gate
// ==========================================
// 開発者権限は NEXT_PUBLIC_ADMIN_EMAIL とログイン中メールの完全一致のみ。
// 判定結果はメモリ上のゲートに保持し、localStorage の isDeveloper は信用しない。

function normalizeEmail(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function getAdminEmail(): string {
  return normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = getAdminEmail();
  const candidate = normalizeEmail(email);
  return admin.length > 0 && candidate.length > 0 && admin === candidate;
}

let verifiedDeveloperSession = false;

/** Auth セッションから開発者ゲートを更新する。許可されたとき true。 */
export function syncDeveloperSession(email: string | null | undefined): boolean {
  verifiedDeveloperSession = isAdminEmail(email);
  return verifiedDeveloperSession;
}

/** Energy 免除などに使う。ストアの isDeveloper フラグ単体では判定しない。 */
export function hasDeveloperPrivileges(): boolean {
  return verifiedDeveloperSession;
}

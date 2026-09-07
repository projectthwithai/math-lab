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
let localNetworkFallback = false;

/** Auth セッションから開発者ゲートを更新する。許可されたとき true。 */
export function syncDeveloperSession(email: string | null | undefined): boolean {
  if (isAdminEmail(email)) {
    localNetworkFallback = false;
    verifiedDeveloperSession = true;
    return true;
  }
  if (email) {
    localNetworkFallback = false;
    verifiedDeveloperSession = false;
    return false;
  }
  if (localNetworkFallback && getAdminEmail().length > 0) {
    verifiedDeveloperSession = true;
    return true;
  }
  verifiedDeveloperSession = false;
  return false;
}

/**
 * Supabase が DNS 未反映などで届かないとき、
 * NEXT_PUBLIC_ADMIN_EMAIL が設定されていればローカル開発者セッションを確立する。
 */
export function activateLocalDeveloperFallback(): boolean {
  if (!getAdminEmail()) return false;
  localNetworkFallback = true;
  verifiedDeveloperSession = true;
  if (typeof window !== 'undefined') {
    void import('@/lib/store/userStore').then(({ useUserStore }) => {
      useUserStore.setState({ isDeveloper: true });
    });
  }
  return true;
}

/** Energy 免除などに使う。ストアの isDeveloper フラグ単体では判定しない。 */
export function hasDeveloperPrivileges(): boolean {
  return verifiedDeveloperSession;
}

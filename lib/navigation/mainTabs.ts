// ==========================================
// Apex Suite: Math Lab - 黄金5大タブ
// ==========================================
// ホーム / パターン図鑑 / 模試 / 武器庫 / ライブラリは別ルートへ遷移せず、
// `/?tab=` のシャローパラメータで同一シェルに常駐する。

export const MAIN_TAB_KEYS = ['home', 'patterns', 'mock', 'armory', 'library'] as const;

export type MainTabKey = (typeof MAIN_TAB_KEYS)[number];

export type LibrarySection = 'history' | 'files';

export function parseMainTab(raw: string | null | undefined): MainTabKey {
  if (raw === 'mock-exam') return 'mock';
  if (raw === 'home' || raw === 'patterns' || raw === 'mock' || raw === 'armory' || raw === 'library') {
    return raw;
  }
  return 'home';
}

export function isShellPath(pathname: string | null | undefined): boolean {
  return pathname === '/';
}

/** 常駐シェルの URL。ホームはクエリなしの `/`。 */
export function shellHref(
  tab: MainTabKey,
  options?: { libraryView?: LibrarySection }
): string {
  if (tab === 'home') return '/';
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (tab === 'library' && options?.libraryView === 'files') {
    params.set('view', 'files');
  }
  return `/?${params.toString()}`;
}

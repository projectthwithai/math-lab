'use client';

// ==========================================
// Apex Suite: Math Lab - 常駐タブの状態
// ==========================================
// ヘッダー / ボトムナビは router.push せず setActiveTab する。
// シェル上では history.replaceState だけを更新し、ページの再マウントを起こさない。
// ワークスペースなど別ルートにいるときだけ、シェルへ1回遷移する。

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  isShellPath,
  parseMainTab,
  shellHref,
  type LibrarySection,
  type MainTabKey,
} from '@/lib/navigation/mainTabs';

interface MainTabContextValue {
  activeTab: MainTabKey;
  onShell: boolean;
  librarySection: LibrarySection;
  setActiveTab: (tab: MainTabKey) => void;
  setLibrarySection: (section: LibrarySection) => void;
}

const MainTabContext = createContext<MainTabContextValue | null>(null);

function readLocationSelection(): { tab: MainTabKey; librarySection: LibrarySection | null } {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('tab') && params.get('view') === 'armory') {
    window.history.replaceState(window.history.state, '', shellHref('armory'));
    return { tab: 'armory', librarySection: null };
  }
  const tab = parseMainTab(params.get('tab'));
  if (tab !== 'library') return { tab, librarySection: null };
  return { tab, librarySection: params.get('view') === 'files' ? 'files' : 'history' };
}

export function MainTabProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<MainTabKey>('home');
  const [librarySection, setLibrarySectionState] = useState<LibrarySection>('history');
  const activeTabRef = useRef<MainTabKey>('home');
  const librarySectionRef = useRef<LibrarySection>('history');
  const scrollYByTab = useRef<Partial<Record<MainTabKey, number>>>({});
  const pendingScrollY = useRef<number | null>(null);
  const previousPathRef = useRef<string | null>(null);

  const commit = useCallback((tab: MainTabKey, section: LibrarySection) => {
    activeTabRef.current = tab;
    librarySectionRef.current = section;
    setActiveTabState(tab);
    setLibrarySectionState(section);
  }, []);

  useLayoutEffect(() => {
    const previous = previousPathRef.current;
    previousPathRef.current = pathname;

    if (previous !== null && isShellPath(previous) && !isShellPath(pathname)) {
      scrollYByTab.current[activeTabRef.current] = window.scrollY;
    }

    if (!isShellPath(pathname)) return;

    const selection = readLocationSelection();
    const nextSection = selection.librarySection ?? librarySectionRef.current;
    commit(selection.tab, nextSection);

    if (previous !== null && !isShellPath(previous)) {
      const y = scrollYByTab.current[selection.tab] ?? 0;
      pendingScrollY.current = null;
      window.scrollTo(0, y);
    }
    // pathname が変わったときだけ URL を正とする。
    // タブクリックは replaceState なので pathname は `/` のまま、この効果は再実行されない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useLayoutEffect(() => {
    if (pendingScrollY.current == null) return;
    const y = pendingScrollY.current;
    pendingScrollY.current = null;
    window.scrollTo(0, y);
  }, [activeTab]);

  const setActiveTab = useCallback(
    (tab: MainTabKey) => {
      const href = shellHref(
        tab,
        tab === 'library' ? { libraryView: librarySectionRef.current } : undefined
      );
      const onShellNow = isShellPath(window.location.pathname);

      if (!onShellNow) {
        commit(tab, librarySectionRef.current);
        router.push(href);
        return;
      }

      if (tab === activeTabRef.current) return;

      scrollYByTab.current[activeTabRef.current] = window.scrollY;
      pendingScrollY.current = scrollYByTab.current[tab] ?? 0;
      commit(tab, librarySectionRef.current);
      window.history.replaceState(window.history.state, '', href);
    },
    [commit, router]
  );

  const setLibrarySection = useCallback(
    (section: LibrarySection) => {
      commit(activeTabRef.current, section);
      if (!isShellPath(window.location.pathname) || activeTabRef.current !== 'library') return;
      window.history.replaceState(
        window.history.state,
        '',
        shellHref('library', { libraryView: section })
      );
    },
    [commit]
  );

  const value = useMemo<MainTabContextValue>(
    () => ({
      activeTab,
      onShell: isShellPath(pathname),
      librarySection,
      setActiveTab,
      setLibrarySection,
    }),
    [activeTab, pathname, librarySection, setActiveTab, setLibrarySection]
  );

  return <MainTabContext.Provider value={value}>{children}</MainTabContext.Provider>;
}

export function useMainTab(): MainTabContextValue {
  const value = useContext(MainTabContext);
  if (!value) {
    throw new Error('useMainTab は MainTabProvider の内側で使ってください');
  }
  return value;
}

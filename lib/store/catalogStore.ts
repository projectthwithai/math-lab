// ==========================================
// Apex Suite: Math Lab - 初回カタログプリロード
// ==========================================
// パターン図鑑・武器庫・解答履歴・カスタムファイルは、タブを開くたびに取り直さない。
// シェルの初回マウントで静的データと LocalStorage をストアへ載せ、以降はメモリを使う。
// カスタムファイルの正本は userStore（作成・削除がその場で反映される）。
// ここでの読み取りはハイドレーション済みであることを確定させるための初期化。

import { create } from 'zustand';

import { SOLUTION_PATTERNS } from '@/data/patternsData';
import { WEAPONS_DATA } from '@/data/weaponsData';
import { getAllSolvedProblemRecords } from '@/lib/storage/solvedProblemsStore';
import { useUserStore } from '@/lib/store/userStore';
import type { SolutionPattern, SolvedProblemRecord, WeaponItem } from '@/types/mathLab';

interface CatalogState {
  ready: boolean;
  customFilesReady: boolean;
  customFileCount: number;
  patterns: SolutionPattern[];
  weapons: WeaponItem[];
  solvedRecords: SolvedProblemRecord[];
  preload: () => void;
  replaceSolvedRecord: (updated: SolvedProblemRecord) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  ready: false,
  customFilesReady: false,
  customFileCount: 0,
  patterns: [],
  weapons: [],
  solvedRecords: [],
  preload: () => {
    const { customFiles, hasHydrated } = useUserStore.getState();
    set({
      ready: true,
      customFilesReady: hasHydrated,
      customFileCount: customFiles.length,
      patterns: SOLUTION_PATTERNS,
      weapons: WEAPONS_DATA,
      solvedRecords: getAllSolvedProblemRecords(),
    });
  },
  replaceSolvedRecord: (updated) =>
    set((state) => ({
      solvedRecords: state.solvedRecords.map((record) => (record.id === updated.id ? updated : record)),
    })),
}));

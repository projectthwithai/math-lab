// ==========================================
// Apex Suite: Math Lab - Workspace Page
// ==========================================
// `searchParams`（Next.js 16ではPromise）から`unitId`/`patternId`を取得し、
// それらが変わるたびに`WorkspaceView`を強制的に再マウントする（key prop）。
// グラフ・図形は WorkspaceView 内で初期折りたたみ（アコーディオン）表示する。
// 出題プールは WorkspaceView が userStore.discoveredPatterns を
// /api/generate-problem に渡し、固定図鑑＋発掘パターンから抽選する。

import WorkspaceView from './WorkspaceView';

export default async function WorkspacePage(props: PageProps<'/workspace'>) {
  const searchParams = await props.searchParams;

  const rawUnitId = searchParams.unitId;
  const rawPatternId = searchParams.patternId;
  const rawDifficulty = searchParams.difficulty;
  const rawPrompt = searchParams.prompt;
  const rawSource = searchParams.source;

  const unitId = typeof rawUnitId === 'string' ? rawUnitId : undefined;
  const patternId = typeof rawPatternId === 'string' ? rawPatternId : undefined;
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : undefined;
  const source = typeof rawSource === 'string' ? rawSource : undefined;
  const parsedDifficulty = typeof rawDifficulty === 'string' ? Number(rawDifficulty) : NaN;
  const difficulty =
    Number.isFinite(parsedDifficulty) && parsedDifficulty >= 1 && parsedDifficulty <= 10
      ? Math.round(parsedDifficulty)
      : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <WorkspaceView
        key={`${unitId ?? 'none'}::${patternId ?? 'none'}::${difficulty ?? 'auto'}::${prompt ?? ''}::${source ?? ''}`}
        unitId={unitId}
        patternId={patternId}
        initialDifficulty={difficulty}
        prompt={prompt}
        source={source}
      />
    </main>
  );
}

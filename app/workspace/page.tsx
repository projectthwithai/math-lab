// ==========================================
// Apex Suite: Math Lab - Workspace Page
// ==========================================
// `searchParams`（Next.js 16ではPromise）から`unitId`/`patternId`を取得し、
// それらが変わるたびに`WorkspaceView`を強制的に再マウントする（key prop）。
// グラフ・図形は visualType が none / 無効なら WorkspaceView で枠ごと非表示。
// visualType がある問題だけ、初期折りたたみのアコーディオンを出す。
// 出題プールは WorkspaceView が userStore.discoveredPatterns を
// /api/generate-problem に渡し、固定図鑑＋発掘パターンから抽選する。

import PageBackButton from '@/components/layout/PageBackButton';
import WorkspaceView from './WorkspaceView';

export default async function WorkspacePage(props: PageProps<'/workspace'>) {
  const searchParams = await props.searchParams;

  const rawUnitId = searchParams.unitId;
  const rawPatternId = searchParams.patternId;
  const rawDifficulty = searchParams.difficulty;
  const rawPrompt = searchParams.prompt;
  const rawSource = searchParams.source;
  const rawSubtopicId = searchParams.subtopicId;
  const rawQuestId = searchParams.questId;

  const unitId = typeof rawUnitId === 'string' ? rawUnitId : undefined;
  const patternId = typeof rawPatternId === 'string' ? rawPatternId : undefined;
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : undefined;
  const source = typeof rawSource === 'string' ? rawSource : undefined;
  const subtopicId = typeof rawSubtopicId === 'string' ? rawSubtopicId : undefined;
  const questId = typeof rawQuestId === 'string' ? rawQuestId : undefined;
  const parsedDifficulty = typeof rawDifficulty === 'string' ? Number(rawDifficulty) : NaN;
  const difficulty =
    Number.isFinite(parsedDifficulty) && parsedDifficulty >= 1 && parsedDifficulty <= 5
      ? Math.round(parsedDifficulty)
      : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageBackButton fallbackHref="/units" />
      <WorkspaceView
        key={`${unitId ?? 'none'}::${patternId ?? 'none'}::${subtopicId ?? 'none'}::${difficulty ?? 'auto'}::${prompt ?? ''}::${source ?? ''}::${questId ?? ''}`}
        unitId={unitId}
        patternId={patternId}
        initialDifficulty={difficulty}
        prompt={prompt}
        source={source}
        subtopicId={subtopicId}
        questId={questId}
      />
    </main>
  );
}

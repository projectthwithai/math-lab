// ==========================================
// Apex Suite: Math Lab - Workspace Page
// ==========================================
// `searchParams`（Next.js 16ではPromise）から`unitId`/`patternId`を取得し、
// それらが変わるたびに`WorkspaceView`を強制的に再マウントする（key prop）。

import WorkspaceView from './WorkspaceView';

export default async function WorkspacePage(props: PageProps<'/workspace'>) {
  const searchParams = await props.searchParams;

  const rawUnitId = searchParams.unitId;
  const rawPatternId = searchParams.patternId;

  const unitId = typeof rawUnitId === 'string' ? rawUnitId : undefined;
  const patternId = typeof rawPatternId === 'string' ? rawPatternId : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <WorkspaceView key={`${unitId ?? 'none'}::${patternId ?? 'none'}`} unitId={unitId} patternId={patternId} />
    </main>
  );
}

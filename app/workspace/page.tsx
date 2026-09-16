// ==========================================
// Apex Suite: Math Lab - Workspace Page
// ==========================================
// `searchParams`（Next.js 16ではPromise）から`unitId`/`patternId`を取得し、
// それらが変わるたびに`WorkspaceView`を強制的に再マウントする（key prop）。
// グラフ・図形は visualType が none / 無効なら WorkspaceView で枠ごと非表示。
// visualType がある問題だけ、初期折りたたみのアコーディオンを出す。
// 出題プールは WorkspaceView が userStore.discoveredPatterns を
// /api/generate-problem に渡し、固定図鑑＋発掘パターンから抽選する。
// 解法メモは WorkspaceView の workspaceNote と userStore.getPatternNote で
// 解答前画面と採点モーダルを双方向同期する。
// mode=review のときはマイライブラリからの過去問復習（0 Energy・ローカル再生成）。

import { RefreshCw } from 'lucide-react';

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
  const rawMode = searchParams.mode;
  const rawProblemId = searchParams.problemId;

  const unitId = typeof rawUnitId === 'string' ? rawUnitId : undefined;
  const patternId = typeof rawPatternId === 'string' ? rawPatternId : undefined;
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : undefined;
  const source = typeof rawSource === 'string' ? rawSource : undefined;
  const subtopicId = typeof rawSubtopicId === 'string' ? rawSubtopicId : undefined;
  const questId = typeof rawQuestId === 'string' ? rawQuestId : undefined;
  const mode = typeof rawMode === 'string' ? rawMode : undefined;
  const problemId = typeof rawProblemId === 'string' ? rawProblemId : undefined;
  const parsedDifficulty = typeof rawDifficulty === 'string' ? Number(rawDifficulty) : NaN;
  const difficulty =
    Number.isFinite(parsedDifficulty) && parsedDifficulty >= 1 && parsedDifficulty <= 5
      ? Math.round(parsedDifficulty)
      : undefined;
  const isReview = mode === 'review';
  const workspaceSource = isReview ? 'review' : source;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageBackButton
        href={isReview ? '/library' : undefined}
        fallbackHref={isReview ? '/library' : '/units'}
      />
      {isReview && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
          <RefreshCw className="h-3.5 w-3.5" />
          🔄 過去問復習モード (0 Energy)
        </div>
      )}
      <WorkspaceView
        key={`${unitId ?? 'none'}::${patternId ?? 'none'}::${subtopicId ?? 'none'}::${difficulty ?? 'auto'}::${prompt ?? ''}::${workspaceSource ?? ''}::${questId ?? ''}::${mode ?? ''}::${problemId ?? ''}`}
        unitId={unitId}
        patternId={patternId}
        initialDifficulty={difficulty}
        prompt={prompt}
        source={workspaceSource}
        subtopicId={subtopicId}
        questId={questId}
        mode={mode}
        problemId={problemId}
      />
    </main>
  );
}

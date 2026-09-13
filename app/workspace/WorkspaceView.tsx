'use client';

// ==========================================
// Apex Suite: Math Lab - Workspace View（スプリット・ワークスペース画面）
// ==========================================
// [左] 問題文・難易度バッジ・タイマー・「数字を変えて再生成」ボタン
// [右] タブ切り替え（手書きメモ / 解答入力・テンキー / 3段階ヒント / Apexガイド壁打ち）
// 「解答を送信する」で採点結果モーダル(ScoreResultModal)を表示する。
// 提出後は「解説を見る」で同モーダルを再表示でき、「次の問題へ」で出題を進める。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, RefreshCw, Lightbulb, PenLine, Keyboard, MessageCircle, Star, Layers, X, ArrowRight, Calculator, BookOpen } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { checkProblemAnswer } from '@/lib/engine/answerChecker';
import { ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';
import { addSolvedProblemRecord } from '@/lib/storage/solvedProblemsStore';
import { consumePendingWorkspaceProblem } from '@/lib/storage/pendingProblemStore';
import { findPatternLinkedMemo, getPatternDisplayName } from '@/lib/storage/patternMemoLookup';
import { useUserStore } from '@/lib/store/userStore';
import { completeDailyQuest } from '@/lib/store/dailyQuestStore';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import {
  formatEnergyShortage,
  getGenerateEnergyCost,
} from '@/lib/engine/energyCosts';
import { formatStarDifficulty } from '@/lib/engine/difficultyScale';
import { hasDeveloperPrivileges } from '@/lib/auth/developerAccess';

import MathGraphPlotter from '@/components/visuals/MathGraphPlotter';
import GeometrySvgPlotter from '@/components/visuals/GeometrySvgPlotter';
import PhysicsCanvasSim from '@/components/visuals/PhysicsCanvasSim';
import ChemistryCanvasSim from '@/components/visuals/ChemistryCanvasSim';
import { resolveMathGraphModel } from '@/lib/engine/mathGraphVisual';
import { resolveGeometryScene } from '@/lib/engine/geometryVisual';
import { resolveChemistryScene, resolvePhysicsScene } from '@/lib/engine/scienceVisual';
import { isActiveVisualType } from '@/lib/engine/visualNeed';
import KaTeXText from '@/components/workspace/KaTeXText';
import ScratchpadCanvas from '@/components/workspace/ScratchpadCanvas';
import LaTeXKeypad from '@/components/workspace/LaTeXKeypad';
import ScientificCalculator from '@/components/workspace/ScientificCalculator';
import AISolutionChat from '@/components/workspace/AISolutionChat';
import ScoreResultModal from '@/components/workspace/ScoreResultModal';
import GoalBackwardTree from '@/components/workspace/GoalBackwardTree';
import DynamicLoadingCircle from '@/components/ui/DynamicLoadingCircle';

type WorkspaceTab = 'memo' | 'input' | 'hints' | 'chat';

const TABS: { id: WorkspaceTab; label: string; icon: typeof PenLine }[] = [
  { id: 'memo', label: '手書きメモ', icon: PenLine },
  { id: 'input', label: '解答入力', icon: Keyboard },
  { id: 'hints', label: '3段階ヒント', icon: Lightbulb },
  { id: 'chat', label: 'Apexガイド壁打ち', icon: MessageCircle },
];

interface WorkspaceViewProps {
  unitId?: string;
  patternId?: string;
  /** パターン図鑑などから明示指定された初回難易度（1-5）。2問目以降はストアの適応難易度を使う */
  initialDifficulty?: number;
  /** ホームの即時生成バーから渡された作問プロンプト */
  prompt?: string;
  /** pending = 画像解析で作った完成済み問題を sessionStorage から読む */
  source?: string;
  subtopicId?: string;
  /** デイリークエスト経由のとき、達成記録するクエストID */
  questId?: string;
}

export default function WorkspaceView({
  unitId,
  patternId,
  initialDifficulty,
  prompt,
  source,
  subtopicId,
  questId,
}: WorkspaceViewProps) {
  const router = useRouter();
  const recordAnswer = useUserStore((state) => state.recordAnswer);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('input');
  const [answerInput, setAnswerInput] = useState('');
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submission, setSubmission] = useState<{ isCorrect: boolean; xpResult: XpGainResult } | null>(
    null
  );
  const [energyError, setEnergyError] = useState<string | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isVisualOpen, setIsVisualOpen] = useState(false);
  /** 同一問題への再送信による二重XPを防ぐ。モーダルを閉じても解除しない */
  const [isSubmitted, setIsSubmitted] = useState(false);
  /** 採点モーダル。「閉じる」後も submission を残し、解説を見る で再表示する */
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const isSubmittedRef = useRef(false);
  const fetchingRef = useRef(false);

  const accent = useMemo(() => SUBJECT_ACCENT[problem?.subject ?? 'math'], [problem?.subject]);
  const visualEnabled = isActiveVisualType(problem?.visualType);
  const geometryScene = useMemo(
    () => (problem?.visualType === 'geometry_svg' ? resolveGeometryScene(problem) : null),
    [problem]
  );
  const graphModel = useMemo(
    () => (problem?.visualType === 'math_graph' ? resolveMathGraphModel(problem) : null),
    [problem]
  );
  const physicsScene = useMemo(
    () => (problem?.visualType === 'physics_simulation' ? resolvePhysicsScene(problem) : null),
    [problem]
  );
  const chemistryScene = useMemo(
    () => (problem?.visualType === 'chemistry_animation' ? resolveChemistryScene(problem) : null),
    [problem]
  );
  const hasVisual =
    visualEnabled && Boolean(geometryScene || graphModel || physicsScene || chemistryScene);
  const patternMemo = useMemo(
    () => (problem?.patternId ? findPatternLinkedMemo(problem.patternId) : null),
    [problem?.id, problem?.patternId]
  );
  const patternName = getPatternDisplayName(problem?.patternId);

  const applyNewProblem = useCallback((next: GeneratedProblem) => {
    setProblem(ensureProblemHasCorrectAnswer(next));
    setAnswerInput('');
    setRevealedHintCount(0);
    setElapsedSeconds(0);
    setSubmission(null);
    setIsMemoOpen(false);
    setIsSolved(false);
    setIsVisualOpen(false);
    setIsSubmitted(false);
    setIsScoreModalOpen(false);
    isSubmittedRef.current = false;
  }, []);

  const fetchProblem = useCallback(async (opts?: { useInitialDifficulty?: boolean }) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (source === 'pending') {
        const pending = consumePendingWorkspaceProblem();
        if (pending) {
          setEnergyError(null);
          setIsLoading(true);
          applyNewProblem(pending);
          return;
        }
      }

      const store = useUserStore.getState();
      const generateCost = getGenerateEnergyCost(source);
      if (!store.consumeEnergy(generateCost)) {
        setEnergyError(formatEnergyShortage(generateCost, store.energy));
        setIsLoading(false);
        return;
      }

      setEnergyError(null);
      setIsLoading(true);

      const difficulty =
        opts?.useInitialDifficulty && initialDifficulty
          ? initialDifficulty
          : useUserStore.getState().currentDifficulty;
      const excavatedForUnit = unitId
        ? discoveredPatterns.filter((pattern) => pattern.unitId === unitId)
        : discoveredPatterns;

      const response = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          patternId,
          subtopicId,
          difficulty,
          prompt,
          discoveredPatterns: prompt ? [] : excavatedForUnit,
        }),
      });
      if (!response.ok) throw new Error(`generate-problem ${response.status}`);
      const data = (await response.json()) as GeneratedProblem;
      applyNewProblem(data);
    } catch (error) {
      console.error('[WorkspaceView] 問題の取得に失敗しました', error);
      const generateCost = getGenerateEnergyCost(source);
      useUserStore.getState().refundEnergy(generateCost);
      setEnergyError(
        generateCost > 0 && !hasDeveloperPrivileges()
          ? '問題の生成に失敗したため、Energy を返還しました。'
          : '問題の生成に失敗しました。もう一度試してください。'
      );
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [unitId, patternId, subtopicId, initialDifficulty, discoveredPatterns, prompt, source, applyNewProblem]);

  useEffect(() => {
    // 発掘パターンを出題プールに含めるため、Zustand ハイドレーション後に生成する。
    if (!hasHydrated) return;
    // fetchProblem内部のsetStateは非同期完了後に実行されるため意図的。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblem({ useInitialDifficulty: true });
  }, [fetchProblem, hasHydrated]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = window.setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isSubmitted]);

  const handleRegenerateLocally = () => {
    if (!problem) return;
    const regenerated = regenerateProblemLocally({
      ...problem,
      id: `${problem.id}-regen-${Date.now()}`,
    });
    applyNewProblem(regenerated);
  };

  const handleSubmitAnswer = () => {
    if (!problem || isSubmitted || isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setIsSubmitted(true);
    const isCorrect = checkProblemAnswer(answerInput.trim(), problem);
    const xpResult = recordAnswer({
      isCorrect,
      difficulty: problem.difficulty,
      hintsUsed: revealedHintCount,
      patternId: problem.patternId ?? patternId,
    });
    setSubmission({ isCorrect, xpResult });
    setIsScoreModalOpen(true);
    setIsSolved(true);
    // マイライブラリ（忘却曲線ベースの復習機能）用に解答履歴を保存する。
    addSolvedProblemRecord(problem, isCorrect);
    if (isCorrect && source === 'daily-quest' && questId) {
      completeDailyQuest(questId);
    }
  };

  const handleNextProblem = () => {
    if (fetchingRef.current || isLoading) return;
    setIsScoreModalOpen(false);
    setSubmission(null);
    void fetchProblem();
    router.refresh();
  };

  const handleReopenExplanation = () => {
    if (!submission) return;
    setIsScoreModalOpen(true);
  };

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(
    elapsedSeconds % 60
  ).padStart(2, '0')}`;

  if (energyError && !problem) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">{energyError}</p>
        <button
          type="button"
          onClick={() => {
            void fetchProblem({ useInitialDifficulty: true });
          }}
          className="rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-200"
        >
          再試行
        </button>
      </div>
    );
  }

  if (isLoading || !problem) {
    return (
      <div className="flex min-h-[min(70vh,36rem)] items-center justify-center px-4 py-10">
        <DynamicLoadingCircle size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {energyError && (
        <p className="col-span-full rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-200">
          {energyError}
        </p>
      )}
      {/* 左: 問題エリア */}
      <div className={`flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60`}>
        {problem.fromDiscoveredPattern && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-[11px] font-medium tracking-tight text-amber-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-amber-300">
            <Layers className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            図鑑で発掘したパターンからの出題
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border ${accent.border} px-2.5 py-1 text-[11px] font-medium ${accent.text}`}>
              <Star className="h-3 w-3" />
              {formatStarDifficulty(problem.difficulty)}
            </span>
            <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">
              {problem.unit}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {formattedTime}
          </span>
        </div>

        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{problem.title}</h1>
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200">
          <KaTeXText text={problem.questionText} />
        </div>

        {patternMemo && (
          <button
            type="button"
            onClick={() => setIsMemoOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-200"
          >
            💡 このパターンの自分メモを参照
          </button>
        )}

        {hasVisual && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVisualOpen((open) => !open)}
              aria-expanded={isVisualOpen}
              className="flex w-full items-center justify-center gap-1.5 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              📈 グラフ・図形を表示する (タップで展開)
            </button>
            <AnimatePresence initial={false}>
              {isVisualOpen && (
                <motion.div
                  key="workspace-visual"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                    {geometryScene && (
                      <GeometrySvgPlotter problem={problem} scene={geometryScene} className="mt-0" />
                    )}
                    {graphModel && (
                      <MathGraphPlotter problem={problem} isSolved={isSolved} className="mt-0" />
                    )}
                    {physicsScene && (
                      <PhysicsCanvasSim problem={problem} scene={physicsScene} className="mt-0" />
                    )}
                    {chemistryScene && (
                      <ChemistryCanvasSim problem={problem} scene={chemistryScene} className="mt-0" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          type="button"
          onClick={handleRegenerateLocally}
          className={`flex items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          数値を変えて再生成（0 Energy）
        </button>
      </div>

      {/* 右: タブ切り替えエリア */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/40'
                    : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-200"
          >
            <Calculator className="h-3.5 w-3.5" />
            🧮 電卓
          </button>
        </div>

        <div className="min-h-[340px] flex-1">
          {activeTab === 'memo' && <ScratchpadCanvas problem={problem} />}

          {activeTab === 'input' && (
            <div className="flex flex-col gap-3">
              {problem.format === 'choice' && problem.choices && problem.choices.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-500">当てはまるものを1つ選んでください</label>
                  {problem.choices.map((choice, index) => {
                    const selected = answerInput === choice;
                    return (
                      <button
                        key={`${choice}-${index}`}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setAnswerInput(choice)}
                        className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-cyan-400/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                        }`}
                      >
                        <span className="mr-2 text-[11px] font-bold text-slate-500">
                          {['①', '②', '③', '④', '⑤'][index] ?? `${index + 1}.`}
                        </span>
                        <KaTeXText text={choice} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <label className="text-xs text-slate-500">解答を入力してください</label>
                  <LaTeXKeypad value={answerInput} onChange={setAnswerInput} disabled={isSubmitted} />
                </>
              )}
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="flex flex-col gap-3">
              <GoalBackwardTree problem={problem} compact />
              {problem.hints.map((hint, index) => {
                const isRevealed = revealedHintCount > index;
                return (
                  <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 p-3">
                    <p className="mb-1 text-xs font-bold text-amber-300">ヒント {index + 1}</p>
                    {isRevealed ? (
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        <KaTeXText text={hint} />
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealedHintCount(index + 1)}
                        className="text-xs text-slate-500 underline hover:text-slate-700 dark:text-slate-300"
                      >
                        タップして表示する
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'chat' && <AISolutionChat problem={problem} />}
        </div>

        {isSubmitted ? (
          <div className="mt-auto flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleReopenExplanation}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-400/10 px-2 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-400/20 dark:text-amber-200"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              解説を見る
            </button>
            <button
              type="button"
              onClick={handleNextProblem}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-2 py-3 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-400/20 dark:text-cyan-200"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              次の問題へ
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmitAnswer}
            className="mt-auto rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:border-slate-700 hover:bg-slate-800 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            解答を送信する
          </button>
        )}
      </div>

      {isMemoOpen && patternMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-400/30 bg-white/95 p-5 shadow-xl dark:bg-slate-950/95">
            <button
              type="button"
              onClick={() => setIsMemoOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pattern Memo</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">このパターンの自分メモ</h2>
            <p className="mt-1 text-xs text-slate-500">
              {patternMemo.label}
              {patternName ? ` · ${patternName}` : ''}
            </p>
            <div className="mt-4 whitespace-pre-wrap rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              <KaTeXText text={patternMemo.content} />
            </div>
            <button
              type="button"
              onClick={() => setIsMemoOpen(false)}
              className="mt-4 w-full rounded-lg border border-amber-400/40 py-2 text-xs font-semibold text-amber-700 dark:text-amber-200"
            >
              閉じて問題に戻る
            </button>
          </div>
        </div>
      )}

      {submission && isScoreModalOpen && (
        <ScoreResultModal
          problem={problem}
          isCorrect={submission.isCorrect}
          xpResult={submission.xpResult}
          onClose={() => setIsScoreModalOpen(false)}
          onNextProblem={handleNextProblem}
        />
      )}

      <button
        type="button"
        onClick={() => setIsCalculatorOpen(true)}
        className="fixed right-0 top-1/3 z-40 hidden rounded-l-xl border border-r-0 border-cyan-400/40 bg-slate-950/90 px-2 py-3 text-xs font-semibold text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)] md:flex md:flex-col md:items-center md:gap-1"
        aria-label="電卓を開く"
      >
        <Calculator className="h-4 w-4" />
        電卓
      </button>

      <ScientificCalculator
        open={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApply={(value) => {
          setAnswerInput(value);
          setActiveTab('input');
        }}
      />
    </div>
  );
}

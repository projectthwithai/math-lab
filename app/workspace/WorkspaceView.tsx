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
import { Clock, RefreshCw, HelpCircle, PenLine, Keyboard, MessageCircle, Star, Layers, X, ArrowRight, Calculator, BookOpen, FileText, LineChart, Eye, ChevronDown, Sparkles, FolderPlus } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { checkProblemAnswer } from '@/lib/engine/answerChecker';
import { ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';
import { addSolvedProblemRecord, findSolvedProblemRecord, markRecordReviewed } from '@/lib/storage/solvedProblemsStore';
import { consumePendingWorkspaceProblem } from '@/lib/storage/pendingProblemStore';
import { findPatternLinkedMemo, getPatternDisplayName } from '@/lib/storage/patternMemoLookup';
import { getCustomSolutionNote, saveCustomSolutionNote } from '@/lib/storage/customSolutionNotesStore';
import { useUserStore } from '@/lib/store/userStore';
import { completeDailyQuest } from '@/lib/store/dailyQuestStore';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import {
  ENERGY_COST_CUSTOM_FILE_NEW,
  ENERGY_COST_CUSTOM_FILE_REVIEW,
  formatEnergyShortage,
  getGenerateEnergyCost,
  isCustomFileSource,
  isLibraryReviewSource,
  isPatternVariantSource,
} from '@/lib/engine/energyCosts';
import {
  markCustomFileEnergyCharged,
  resolveCustomFileProblemCost,
  startCustomFilePracticePath,
  wasCustomFileEnergyCharged,
} from '@/lib/engine/customFileProblem';
import { formatStarDifficulty } from '@/lib/engine/difficultyScale';
import { hasDeveloperPrivileges } from '@/lib/auth/developerAccess';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';

import MathGraphPlotter from '@/components/visuals/MathGraphPlotter';
import GeometrySvgPlotter from '@/components/visuals/GeometrySvgPlotter';
import PhysicsCanvasSim from '@/components/visuals/PhysicsCanvasSim';
import ChemistryCanvasSim from '@/components/visuals/ChemistryCanvasSim';
import { resolveMathGraphModel } from '@/lib/engine/mathGraphVisual';
import { resolveGeometryScene } from '@/lib/engine/geometryVisual';
import { resolveChemistryScene, resolvePhysicsScene } from '@/lib/engine/scienceVisual';
import { isActiveVisualType } from '@/lib/engine/visualNeed';
import { stripBannedVariantMeta } from '@/lib/engine/variantQuality';
import KaTeXText from '@/components/workspace/KaTeXText';
import ScratchpadCanvas from '@/components/workspace/ScratchpadCanvas';
import LaTeXKeypad from '@/components/workspace/LaTeXKeypad';
import ScientificCalculator from '@/components/workspace/ScientificCalculator';
import AISolutionChat from '@/components/workspace/AISolutionChat';
import ScoreResultModal from '@/components/workspace/ScoreResultModal';
import HandwrittenNoteScanButton from '@/components/workspace/HandwrittenNoteScanButton';
import GoalBackwardTree from '@/components/workspace/GoalBackwardTree';
import DynamicLoadingCircle from '@/components/ui/DynamicLoadingCircle';
import AddToFileModal from '@/components/library/AddToFileModal';

type WorkspaceTab = 'memo' | 'input' | 'hints' | 'chat';

const TABS: { id: WorkspaceTab; label: string; icon: typeof PenLine }[] = [
  { id: 'memo', label: '手書き', icon: PenLine },
  { id: 'input', label: '入力', icon: Keyboard },
  { id: 'hints', label: 'ヒント', icon: HelpCircle },
  { id: 'chat', label: '壁打ち', icon: MessageCircle },
];

interface WorkspaceViewProps {
  unitId?: string;
  patternId?: string;
  /** パターン図鑑などから明示指定された初回難易度（1-5）。2問目以降はストアの適応難易度を使う */
  initialDifficulty?: number;
  /** ホームの即時生成バーから渡された作問プロンプト */
  prompt?: string;
  /** pending = 画像解析で作った完成済み問題を sessionStorage から読む / review = ライブラリ復習 */
  source?: string;
  subtopicId?: string;
  /** デイリークエスト経由のとき、達成記録するクエストID */
  questId?: string;
  mode?: string;
  /** ライブラリ復習時の SolvedProblemRecord.id または problem.id */
  problemId?: string;
  /** 図鑑に蓄積した変装バリエーション */
  variantId?: string;
  /** マイファイル連続演習 */
  fileId?: string;
  fileIndex?: string;
}

export default function WorkspaceView({
  unitId,
  patternId,
  initialDifficulty,
  prompt,
  source,
  subtopicId,
  questId,
  mode,
  problemId,
  variantId,
  fileId,
  fileIndex,
}: WorkspaceViewProps) {
  const router = useRouter();
  const recordAnswer = useUserStore((state) => state.recordAnswer);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const patternNotes = useUserStore((state) => state.patternNotes);
  const upsertPatternNote = useUserStore((state) => state.upsertPatternNote);
  const customFiles = useUserStore((state) => state.customFiles);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const isProblemPracticed = useUserStore((state) => state.isProblemPracticed);

  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('input');
  const [answerInput, setAnswerInput] = useState('');
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submission, setSubmission] = useState<{
    isCorrect: boolean;
    xpResult: XpGainResult;
    userAnswer: string;
    recordId: string;
  } | null>(null);
  const [energyError, setEnergyError] = useState<string | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [workspaceNote, setWorkspaceNote] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [isVisualOpen, setIsVisualOpen] = useState(false);
  const [isPatternPeekOpen, setIsPatternPeekOpen] = useState(false);
  /** 同一問題への再送信による二重XPを防ぐ。モーダルを閉じても解除しない */
  const [isSubmitted, setIsSubmitted] = useState(false);
  /** 採点モーダル。「閉じる」後も submission を残し、解説を見る で再表示する */
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAddToFileOpen, setIsAddToFileOpen] = useState(false);
  const isSubmittedRef = useRef(false);
  const fetchingRef = useRef(false);
  const reviewRecordIdRef = useRef<string | null>(null);
  const isReviewMode = mode === 'review' || isLibraryReviewSource(source);
  const isVariantMode = Boolean(variantId) || isPatternVariantSource(source);
  const isCustomFileMode = Boolean(fileId) || isCustomFileSource(source);
  const customFileIndex = Math.max(0, Number(fileIndex) || 0);
  const activeCustomFile = isCustomFileMode
    ? customFiles.find((item) => item.id === fileId)
    : undefined;
  const isLastCustomFileProblem =
    Boolean(activeCustomFile) && customFileIndex + 1 >= (activeCustomFile?.problems.length ?? 0);

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
    [problem?.id, problem?.patternId, patternNotes]
  );
  const patternName = getPatternDisplayName(problem?.patternId);

  useEffect(() => {
    const fromPattern = problem?.patternId
      ? useUserStore.getState().getPatternNote(problem.patternId)
      : '';
    const fromProblem = problem ? getCustomSolutionNote(problem.id)?.content : '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkspaceNote(fromPattern || fromProblem || '');
    // 問題の切り替え時だけ読み込む。入力中の store 更新では上書きしない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, problem?.patternId]);

  const persistSolutionNote = (text: string) => {
    setWorkspaceNote(text);
    if (problem?.patternId) {
      upsertPatternNote(problem.patternId, text);
      return;
    }
    if (problem) saveCustomSolutionNote(problem.id, text);
  };

  const applyNewProblem = useCallback((next: GeneratedProblem) => {
    setProblem(ensureProblemHasCorrectAnswer(next));
    setAnswerInput('');
    setWorkspaceNote('');
    setRevealedHintCount(0);
    setElapsedSeconds(0);
    setSubmission(null);
    setIsMemoOpen(false);
    setIsPatternPeekOpen(false);
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
      if (isReviewMode) {
        const stored = problemId ? findSolvedProblemRecord(problemId) : null;
        const pending = consumePendingWorkspaceProblem();
        const sourceProblem = stored?.problem ?? pending;
        if (!sourceProblem) {
          setEnergyError('復習する問題が見つかりません。マイライブラリから選び直してください。');
          setIsLoading(false);
          return;
        }
        reviewRecordIdRef.current = stored?.id ?? problemId ?? null;
        setEnergyError(null);
        setIsLoading(true);
        applyNewProblem(
          regenerateProblemLocally({
            ...sourceProblem,
            id: `${sourceProblem.id}-review-${Date.now()}`,
          })
        );
        return;
      }

      if (isCustomFileMode && fileId) {
        const store = useUserStore.getState();
        const file = store.customFiles.find((item) => item.id === fileId);
        const sourceProblem = file?.problems[customFileIndex];
        if (!file || !sourceProblem) {
          setEnergyError('マイファイルの問題が見つかりません。ライブラリから選び直してください。');
          setIsLoading(false);
          return;
        }
        const practiced = store.isProblemPracticed(sourceProblem.id);
        const developer = hasDeveloperPrivileges() || store.isDeveloper;
        const fileCost = resolveCustomFileProblemCost({
          practiced,
          isDeveloper: developer,
          alreadyCharged: wasCustomFileEnergyCharged(sourceProblem.id),
        });
        if (!store.consumeEnergy(fileCost)) {
          setEnergyError(
            `未挑戦の問題は ${ENERGY_COST_CUSTOM_FILE_NEW} Energy 必要です。` +
              formatEnergyShortage(fileCost, store.energy)
          );
          setIsLoading(false);
          return;
        }
        if (fileCost > 0) markCustomFileEnergyCharged(sourceProblem.id);
        setEnergyError(null);
        setIsLoading(true);
        applyNewProblem(sourceProblem);
        return;
      }

      if (source === 'pending') {
        const pending = consumePendingWorkspaceProblem();
        if (pending) {
          setEnergyError(null);
          setIsLoading(true);
          applyNewProblem(pending);
          return;
        }
      }

      if (isVariantMode && patternId) {
        const variants = useUserStore.getState().patternVariants[patternId] ?? [];
        const stored =
          (variantId ? variants.find((item) => item.id === variantId) : undefined) ?? variants[0];
        if (!stored?.problem) {
          setEnergyError('蓄積したバリエーションが見つかりません。図鑑から選び直してください。');
          setIsLoading(false);
          return;
        }
        setEnergyError(null);
        setIsLoading(true);
        applyNewProblem(
          regenerateProblemLocally({
            ...stored.problem,
            id: `${stored.problem.id}-play-${Date.now()}`,
            patternId,
            questionText: stripBannedVariantMeta(stored.problem.questionText),
            templateConfig: stored.problem.templateConfig
              ? {
                  ...stored.problem.templateConfig,
                  templateText: stripBannedVariantMeta(stored.problem.templateConfig.templateText),
                }
              : stored.problem.templateConfig,
          })
        );
        return;
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
        headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          unitId,
          patternId,
          subtopicId,
          difficulty,
          prompt,
          discoveredPatterns: prompt ? [] : excavatedForUnit,
        }), // patternId があれば API 側が最優先でピン留めする
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
  }, [unitId, patternId, subtopicId, initialDifficulty, discoveredPatterns, prompt, source, applyNewProblem, isReviewMode, isVariantMode, isCustomFileMode, problemId, variantId, fileId, customFileIndex]);

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
    if (problem.patternId) {
      upsertPatternNote(problem.patternId, workspaceNote);
    } else if (workspaceNote.trim()) {
      saveCustomSolutionNote(problem.id, workspaceNote);
    }
    const isCorrect = checkProblemAnswer(answerInput.trim(), problem);
    const xpResult = recordAnswer({
      isCorrect,
      difficulty: problem.difficulty,
      hintsUsed: revealedHintCount,
      patternId: problem.patternId ?? patternId,
    });
    const reviewRecordId = reviewRecordIdRef.current;
    const record =
      isReviewMode && reviewRecordId
        ? markRecordReviewed(reviewRecordId, isCorrect) ?? addSolvedProblemRecord(problem, isCorrect)
        : addSolvedProblemRecord(problem, isCorrect);
    setSubmission({ isCorrect, xpResult, userAnswer: answerInput.trim(), recordId: record.id });
    setIsScoreModalOpen(true);
    setIsSolved(true);
    if (isCorrect && source === 'daily-quest' && questId) {
      completeDailyQuest(questId);
    }
  };

  const handleNextProblem = () => {
    if (fetchingRef.current || isLoading) return;
    setIsScoreModalOpen(false);
    setSubmission(null);
    if (isCustomFileMode && fileId) {
      const file = useUserStore.getState().customFiles.find((item) => item.id === fileId);
      const nextIndex = customFileIndex + 1;
      if (file && nextIndex < file.problems.length) {
        router.push(startCustomFilePracticePath(fileId, nextIndex));
        return;
      }
      router.push('/library?view=files');
      return;
    }
    if (isReviewMode || isVariantMode) {
      handleRegenerateLocally();
      return;
    }
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
        {isReviewMode || isCustomFileMode ? (
          <button
            type="button"
            onClick={() => router.push(isCustomFileMode ? '/library?view=files' : '/library')}
            className="rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-200"
          >
            マイライブラリへ戻る
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void fetchProblem({ useInitialDifficulty: true });
            }}
            className="rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-200"
          >
            再試行
          </button>
        )}
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
      <div className="flex flex-col gap-4 rounded-2xl surface-panel p-5 backdrop-blur-md">
        {isReviewMode && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-center text-[11px] font-semibold tracking-tight text-cyan-700 dark:text-cyan-200">
            <RefreshCw className="h-3.5 w-3.5" />
            過去問復習モード (0 Energy)
          </div>
        )}
        {isCustomFileMode && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-center text-[11px] font-semibold tracking-tight text-cyan-700 dark:text-cyan-200">
            <FolderPlus className="h-3.5 w-3.5" />
            マイファイル {customFileIndex + 1}/{activeCustomFile?.problems.length ?? '?'}
            {' · '}
            {isDeveloper || hasDeveloperPrivileges()
              ? `0 Energy`
              : isProblemPracticed(problem.id)
                ? `復習 (${ENERGY_COST_CUSTOM_FILE_REVIEW} Energy)`
                : `未挑戦 (${ENERGY_COST_CUSTOM_FILE_NEW} Energy)`}
          </div>
        )}
        {problem.fromDiscoveredPattern && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-[11px] font-medium tracking-tight text-amber-700 dark:border-slate-800 dark:bg-[#12141f] dark:text-amber-300">
            <Layers className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            図鑑で発掘したパターンからの出題
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsPatternPeekOpen((open) => !open)}
            aria-expanded={isPatternPeekOpen}
            className="flex w-full items-center justify-center gap-1.5 bg-slate-50 px-3 py-2.5 text-xs font-medium tracking-tight text-slate-700 transition-colors hover:bg-slate-100 dark:bg-[#0b0d14] dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Eye className="h-3.5 w-3.5" />
            解法パターンを確認する（タップで展開）
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPatternPeekOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {isPatternPeekOpen && (
              <motion.div
                key="pattern-peek"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
                  {patternName ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{patternName}</p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      新パターン（未登録）
                    </p>
                  )}
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">自分流解法メモ</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {workspaceNote.trim() || patternMemo?.content || '自分流メモはまだありません。'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddToFileOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-cyan-400/60 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-200"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              ファイルに追加
            </button>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {formattedTime}
            </span>
          </div>
        </div>

        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{problem.title}</h1>
        <div className="rounded-xl surface-card p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          <KaTeXText text={problem.questionText} />
        </div>

        <div className="relative rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-3">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                自分流解法メモ
              </p>
              <HandwrittenNoteScanButton
                compact
                problem={problem}
                onSummary={persistSolutionNote}
              />
            </div>
            <textarea
              value={workspaceNote}
              onChange={(event) => persistSolutionNote(event.target.value)}
              rows={4}
              placeholder="解き方を自分の言葉で書いておこう。解答後の採点モーダルにもそのまま表示されます。"
              className="min-h-[6rem] w-full resize-y rounded-lg surface-input p-2.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none dark:text-white"
            />
            {patternMemo && (
              <button
                type="button"
                onClick={() => setIsMemoOpen(true)}
                className="mt-2 text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-200"
              >
                数式つきでメモを確認する
              </button>
            )}
          </div>

        {hasVisual && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVisualOpen((open) => !open)}
              aria-expanded={isVisualOpen}
              className="flex w-full items-center justify-center gap-1.5 bg-slate-50 px-3 py-2.5 text-xs font-medium tracking-tight text-slate-700 transition-colors hover:bg-slate-100 dark:bg-[#0b0d14] dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <LineChart className="h-3.5 w-3.5" />
              図形
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
      <div className="flex flex-col gap-3 rounded-2xl surface-panel p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium tracking-tight transition-colors ${
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
            aria-label="電卓"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-700 transition-colors hover:bg-cyan-400/20 dark:text-cyan-200"
          >
            <Calculator className="h-4 w-4" />
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
                            : 'border-slate-300 bg-white text-slate-800 hover:border-cyan-400/40 dark:border-zinc-700/60 dark:bg-[#12141f] dark:text-slate-200 dark:shadow-lg dark:shadow-black/40'
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
                  <div key={index} className="rounded-lg surface-card p-3">
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
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-400/10 px-2 py-3 text-sm font-medium tracking-tight text-amber-800 transition-colors hover:bg-amber-400/20 dark:text-amber-200"
            >
              <FileText className="h-4 w-4 shrink-0" />
              解説
            </button>
            <button
              type="button"
              onClick={handleNextProblem}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-2 py-3 text-sm font-medium tracking-tight text-cyan-700 transition-colors hover:bg-cyan-400/20 dark:text-cyan-200"
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              {isCustomFileMode && isLastCustomFileProblem ? 'ファイルを終了する' : '次の問題へ'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmitAnswer}
            className="mt-auto rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-medium tracking-tight text-white transition-colors hover:border-slate-700 hover:bg-slate-800 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            解答を送信する
          </button>
        )}
      </div>

      {isMemoOpen && patternMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-400/30 surface-panel p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setIsMemoOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
              aria-label="閉じる"
            >
              <X className="h-5 w-5 text-zinc-400 hover:text-zinc-100" />
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
          userAnswer={submission.userAnswer}
          solvedRecordId={submission.recordId}
          solutionNote={workspaceNote}
          onSolutionNoteChange={persistSolutionNote}
          onClose={() => setIsScoreModalOpen(false)}
          onNextProblem={handleNextProblem}
        />
      )}

      <button
        type="button"
        onClick={() => setIsCalculatorOpen(true)}
        className="fixed right-0 top-1/3 z-40 hidden rounded-l-xl border border-r-0 border-cyan-400/40 bg-[#0b0d14] px-2 py-3 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)] md:flex md:items-center"
        aria-label="電卓を開く"
      >
        <Calculator className="h-4 w-4" />
      </button>

      {isAddToFileOpen && (
        <AddToFileModal problem={problem} onClose={() => setIsAddToFileOpen(false)} />
      )}

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

'use client';

// ==========================================
// Apex Suite: Math Lab - Image Analysis Modal
// ==========================================
// 原問テキストは表示しない。検出した複数類題をカードで切り替え、
// 1問ずつ解く／ファイルへ追加、または全問まとめて保存できる。

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BookPlus, CheckCircle2, ChevronLeft, ChevronRight, Flame, FolderPlus, X } from 'lucide-react';

import type { GeneratedProblem, ImageAnalysisResult } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';
import { setPendingWorkspaceProblem } from '@/lib/storage/pendingProblemStore';
import KaTeXText from '@/components/workspace/KaTeXText';
import HandwritingReshootAlert from '@/components/workspace/HandwritingReshootAlert';
import AddToFileModal from '@/components/library/AddToFileModal';
import {
  IMAGE_ANALYSIS_INVALID_ERROR,
  IMAGE_ANALYSIS_RESHOOT_HEADING,
  collectDetectedProblems,
  isImageAnalysisBlocked,
  type ImageAnalysisBlocked,
} from '@/lib/llm/imageAnalysisVision';

interface ImageAnalysisModalProps {
  result: ImageAnalysisResult | ImageAnalysisBlocked;
  onClose: () => void;
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl surface-panel p-5 shadow-xl backdrop-blur-md sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="閉じる"
        >
          <X className="h-5 w-5 text-zinc-400 hover:text-zinc-100" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

export default function ImageAnalysisModal({ result, onClose }: ImageAnalysisModalProps) {
  const router = useRouter();
  const appendDiscoveredPatterns = useUserStore((state) => state.appendDiscoveredPatterns);
  const incrementPatternVariants = useUserStore((state) => state.incrementPatternVariants);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [fileTarget, setFileTarget] = useState<GeneratedProblem[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const problems = useMemo(
    () => (isImageAnalysisBlocked(result) ? [] : collectDetectedProblems(result)),
    [result]
  );

  if (isImageAnalysisBlocked(result)) {
    const errorText = result.error?.trim() || IMAGE_ANALYSIS_INVALID_ERROR;
    const isApiError = errorText.startsWith('AI解析エラー');
    return (
      <ModalShell onClose={onClose}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          Structure Extract / Original Item
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {isApiError ? '解析に失敗しました' : '再撮影が必要です'}
        </h2>
        <div className="mt-4">
          <HandwritingReshootAlert
            heading={isApiError ? '解析に失敗しました' : IMAGE_ANALYSIS_RESHOOT_HEADING}
            message={errorText}
          />
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-amber-400/40 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-400/10 dark:text-amber-100"
          >
            写真を撮り直す
          </button>
        </div>
      </ModalShell>
    );
  }

  const matchedExisting = result.matchedExisting === true;
  const current = problems[Math.min(activeIndex, Math.max(0, problems.length - 1))] ?? result.variantProblem;
  const go = (next: number) => {
    if (problems.length === 0) return;
    setActiveIndex((next + problems.length) % problems.length);
  };

  const openWorkspace = (problem: GeneratedProblem) => {
    setPendingWorkspaceProblem(problem);
    router.push('/workspace?source=pending');
  };

  const handleAddPattern = () => {
    if (matchedExisting) {
      incrementPatternVariants(result.pattern.id);
      setAddedNotice('既存パターンのバリエーションとして記録しました。');
      return;
    }
    const added = appendDiscoveredPatterns([
      {
        ...result.pattern,
        discovered: true,
        exampleQuestion: result.pattern.exampleQuestion || current.questionText,
      },
    ]);
    if (added.length === 0) {
      setAddedNotice('このパターンはすでに図鑑に登録済みです。');
    } else {
      setAddedNotice('パターン図鑑に追加しました。単元演習の出題プールにも入ります。');
    }
  };

  return (
    <ModalShell onClose={onClose}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          Structure Extract / Original Item
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">解析結果</h2>
        <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
          {problems.length}問の問題を検出しました
        </p>
        <p className="mt-1 text-xs text-slate-500">
          原問の文章は保存・表示しません。解法構造だけを抽出し、完全オリジナルの類題を作りました。
        </p>

        <section className="mt-4 rounded-xl surface-card p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">抽出した解法構造</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {result.logic.unit}（{result.logic.subject === 'math' ? '数学' : result.logic.subject === 'physics' ? '物理' : '化学'}）
          </p>
          <p className="mt-1 text-xs text-slate-500">{result.logic.techniques.join(' / ')}</p>
        </section>

        {problems.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problems.map((problem, index) => (
              <button
                key={problem.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  index === activeIndex
                    ? 'border border-cyan-400/60 bg-cyan-400/15 text-cyan-800 dark:text-cyan-100'
                    : 'border border-slate-300 text-slate-500 dark:border-slate-700'
                }`}
              >
                問{index + 1}
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-3">
          <AnimatePresence mode="wait">
            <motion.section
              key={current.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                  完全オリジナル類題 {problems.length > 1 ? `${activeIndex + 1} / ${problems.length}` : ''}
                </p>
                {problems.length > 1 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => go(activeIndex - 1)}
                      className="rounded-lg border border-slate-300 p-1 text-slate-500 dark:border-slate-700"
                      aria-label="前の問題"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(activeIndex + 1)}
                      className="rounded-lg border border-slate-300 p-1 text-slate-500 dark:border-slate-700"
                      aria-label="次の問題"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{current.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <KaTeXText text={current.questionText} />
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openWorkspace(current)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-400/50 dark:border-slate-800 dark:bg-[#0b0d14] dark:text-slate-200"
                >
                  <Flame className="h-3.5 w-3.5" />
                  この問題を解く
                </button>
                <button
                  type="button"
                  onClick={() => setFileTarget([current])}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-400/50 dark:border-slate-800 dark:bg-[#0b0d14] dark:text-slate-200"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  ファイルに追加
                </button>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        <section className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            {matchedExisting ? '既存パターンのバリエーション' : '解法パターン'}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {result.pattern.customName?.trim() || result.pattern.patternName}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {result.pattern.strategyText}
          </p>
        </section>

        <button
          type="button"
          onClick={handleAddPattern}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#0b0d14] dark:text-slate-200 dark:hover:border-slate-700"
        >
          <BookPlus className="h-3.5 w-3.5" />
          {matchedExisting ? '既存パターンの類題として記録する' : 'この解法パターンを図鑑に自動追加する'}
        </button>

        {problems.length > 0 && (
          <button
            type="button"
            onClick={() => setFileTarget(problems)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-400/10 py-2.5 text-xs font-semibold text-cyan-800 dark:text-cyan-100"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            検出した全問題をまとめてファイルに追加
          </button>
        )}

        {addedNotice && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {addedNotice}
          </p>
        )}
        {fileTarget && (
          <AddToFileModal
            problem={fileTarget[0]}
            problems={fileTarget}
            onClose={() => setFileTarget(null)}
          />
        )}
    </ModalShell>
  );
}

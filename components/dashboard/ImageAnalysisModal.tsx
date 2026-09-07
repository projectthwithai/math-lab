'use client';

// ==========================================
// Apex Suite: Math Lab - Image Analysis Modal
// ==========================================
// 原問テキストは表示しない。オリジナル類題と解法パターンだけを見せ、
// 「類題を解く」「図鑑へ追加」の2アクションのみ提供する。

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookPlus, CheckCircle2, Flame, X } from 'lucide-react';

import type { ImageAnalysisResult } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';
import { setPendingWorkspaceProblem } from '@/lib/storage/pendingProblemStore';
import KaTeXText from '@/components/workspace/KaTeXText';

interface ImageAnalysisModalProps {
  result: ImageAnalysisResult;
  onClose: () => void;
}

export default function ImageAnalysisModal({ result, onClose }: ImageAnalysisModalProps) {
  const router = useRouter();
  const appendDiscoveredPatterns = useUserStore((state) => state.appendDiscoveredPatterns);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const openWorkspace = () => {
    setPendingWorkspaceProblem(result.variantProblem);
    router.push('/workspace?source=pending');
  };

  const handleAddPattern = () => {
    const added = appendDiscoveredPatterns([
      {
        ...result.pattern,
        discovered: true,
        exampleQuestion: result.pattern.exampleQuestion || result.variantProblem.questionText,
      },
    ]);
    if (added.length === 0) {
      setAddedNotice('このパターンはすでに図鑑に登録済みです。');
    } else {
      setAddedNotice('パターン図鑑に追加しました。単元演習の出題プールにも入ります。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          Structure Extract / Original Item
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">解析結果</h2>
        <p className="mt-1 text-xs text-slate-500">
          原問の文章は保存・表示しません。解法構造だけを抽出し、完全オリジナルの類題を作りました
          {result.source === 'local' ? '（APIキー未設定のためサンプル構造）' : ''}。
        </p>

        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">抽出した解法構造</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {result.logic.unit}（{result.logic.subject === 'math' ? '数学' : result.logic.subject === 'physics' ? '物理' : '化学'}）
          </p>
          <p className="mt-1 text-xs text-slate-500">{result.logic.techniques.join(' / ')}</p>
        </section>

        <section className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
            完全オリジナル類題
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{result.variantProblem.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            <KaTeXText text={result.variantProblem.questionText} />
          </p>
        </section>

        <section className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            解法パターン
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{result.pattern.patternName}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {result.pattern.strategyText}
          </p>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={openWorkspace}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700"
          >
            <Flame className="h-3.5 w-3.5" />
            完全オリジナルの類題を生成して解く
          </button>
          <button
            type="button"
            onClick={handleAddPattern}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700"
          >
            <BookPlus className="h-3.5 w-3.5" />
            この解法パターンを図鑑に自動追加する
          </button>
        </div>

        {addedNotice && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {addedNotice}
          </p>
        )}
      </motion.div>
    </div>
  );
}

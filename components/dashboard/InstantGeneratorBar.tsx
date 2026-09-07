'use client';

// ==========================================
// Apex Suite: Math Lab - Instant Generator Bar
// ==========================================
// ホーム最上部の即時生成バー。テキストは Workspace へ即遷移、
// 画像は /api/analyze-image で解析してモーダルを開く。

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ImagePlus, Loader2, Sparkles, Send } from 'lucide-react';

import type { ImageAnalysisResult } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_ANALYZE_IMAGE, ENERGY_COST_GENERATE_PROBLEM, formatEnergyShortage } from '@/lib/engine/energyCosts';
import ImageAnalysisModal from './ImageAnalysisModal';

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export default function InstantGeneratorBar() {
  const router = useRouter();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);

  const handleTextSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!hasHydrated) {
      setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    const store = useUserStore.getState();
    if (!store.canAffordEnergy(ENERGY_COST_GENERATE_PROBLEM)) {
      setErrorMessage(formatEnergyShortage(ENERGY_COST_GENERATE_PROBLEM, store.energy));
      return;
    }
    router.push(`/workspace?prompt=${encodeURIComponent(trimmed)}`);
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    if (!hasHydrated) {
      setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage('画像は 4MB 以下にしてください。');
      return;
    }

    const store = useUserStore.getState();
    if (!store.consumeEnergy(ENERGY_COST_ANALYZE_IMAGE)) {
      setErrorMessage(formatEnergyShortage(ENERGY_COST_ANALYZE_IMAGE, store.energy));
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const form = new FormData();
      form.append('image', file);
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: form,
      });
      if (!response.ok) throw new Error(`analyze-image ${response.status}`);
      const data = (await response.json()) as ImageAnalysisResult;
      if (!data.variantProblem || !data.pattern) {
        throw new Error('incomplete analysis');
      }
      setAnalysis(data);
    } catch (error) {
      console.error('[InstantGeneratorBar] 画像解析に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_ANALYZE_IMAGE);
      setErrorMessage('画像の解析に失敗しました。Energy を返還しました。もう一度試してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-5">
        <div className="relative mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">即時問題生成</h2>
            <p className="text-[11px] text-slate-500">
              テキスト作問 {isDeveloper ? '0 (Dev)' : ENERGY_COST_GENERATE_PROBLEM} Energy / 画像解析{' '}
              {isDeveloper ? '0 (Dev)' : ENERGY_COST_ANALYZE_IMAGE} Energy
            </p>
          </div>
        </div>

        <form onSubmit={handleTextSubmit} className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例: 共通テスト風のベクトルの難問を作って"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400/70 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 text-slate-600 transition-colors hover:border-cyan-400/60 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
              aria-label="カメラで撮影"
              title="カメラで撮影"
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 text-slate-600 transition-colors hover:border-cyan-400/60 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
              aria-label="画像をアップロード"
              title="画像をアップロード"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={prompt.trim().length === 0}
              className="flex h-12 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:border-slate-700 hover:bg-slate-800 disabled:opacity-40 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Send className="h-4 w-4" />
              生成
            </button>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleImageFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void handleImageFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {isAnalyzing && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            画像を解析しています...
          </p>
        )}
        {errorMessage && <p className="mt-2 text-xs font-semibold text-red-400">{errorMessage}</p>}
      </section>

      {analysis && (
        <ImageAnalysisModal
          result={analysis}
          onClose={() => {
            setAnalysis(null);
          }}
        />
      )}
    </>
  );
}

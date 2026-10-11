'use client';

// ==========================================
// Apex Suite: Math Lab - Photo Pattern Launch
// ==========================================
// ホーム最上部の「写真から類題・パターン生成」。テキスト自由記述は置かない。

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

import type { ImageAnalysisResult } from '@/types/mathLab';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_ANALYZE_IMAGE, formatEnergyShortage } from '@/lib/engine/energyCosts';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';
import { toPatternMatchDigest } from '@/data/patternsData';
import ImageAnalysisModal from './ImageAnalysisModal';

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export default function InstantGeneratorBar() {
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);

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
      form.append(
        'existingPatterns',
        JSON.stringify(discoveredPatterns.map((pattern) => toPatternMatchDigest(pattern)))
      );
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: withAiRouterHeaders(),
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
      <section className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-3 text-sm font-semibold tracking-tight text-cyan-800 transition-colors hover:bg-cyan-400/20 disabled:opacity-60 dark:text-cyan-100"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          写真から類題・パターン生成
        </button>
        <p className="text-[11px] text-slate-500">
          画像解析 {isDeveloper ? '0 (Dev)' : ENERGY_COST_ANALYZE_IMAGE} Energy
        </p>
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
        {isAnalyzing && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            画像を解析しています...
          </p>
        )}
        {errorMessage && <p className="text-xs font-semibold text-red-400">{errorMessage}</p>}
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

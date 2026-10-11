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
import {
  IMAGE_ANALYSIS_INVALID_ERROR,
  formatAiAnalysisError,
  isImageAnalysisBlocked,
  readImageAnalysisError,
  type ImageAnalysisBlocked,
} from '@/lib/llm/imageAnalysisVision';
import { compressImageFile, COMPRESS_MAX_SOURCE_BYTES } from '@/lib/utils/compressImageClient';
import ImageAnalysisModal from './ImageAnalysisModal';

export default function InstantGeneratorBar() {
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const discoveredPatterns = useUserStore((state) => state.discoveredPatterns);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | ImageAnalysisBlocked | null>(null);

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    if (!hasHydrated) {
      setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (file.size > COMPRESS_MAX_SOURCE_BYTES) {
      setErrorMessage('画像は 20MB 以下にしてください。');
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
      const compressed = await compressImageFile(file);
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          imageBase64: compressed.dataUrl,
          mimeType: compressed.mimeType,
          existingPatterns: discoveredPatterns.map((pattern) => toPatternMatchDigest(pattern)),
        }),
      });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (isImageAnalysisBlocked(data) || !response.ok) {
        useUserStore.getState().refundEnergy(ENERGY_COST_ANALYZE_IMAGE);
        setAnalysis({
          isValid: false,
          error: readImageAnalysisError(
            data,
            response.ok ? IMAGE_ANALYSIS_INVALID_ERROR : formatAiAnalysisError(`HTTP ${response.status}`)
          ),
        });
        return;
      }
      const result = data as ImageAnalysisResult;
      if (!result.variantProblem || !result.pattern) {
        useUserStore.getState().refundEnergy(ENERGY_COST_ANALYZE_IMAGE);
        setAnalysis({ isValid: false, error: formatAiAnalysisError('類題 JSON が不完全です') });
        return;
      }
      setAnalysis(result);
    } catch (error) {
      console.error('[InstantGeneratorBar] 画像解析に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_ANALYZE_IMAGE);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('画像')) {
        setErrorMessage(message);
        return;
      }
      setAnalysis({ isValid: false, error: formatAiAnalysisError(error) });
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

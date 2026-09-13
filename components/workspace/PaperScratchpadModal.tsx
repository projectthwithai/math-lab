'use client';

// ==========================================
// Apex Suite: Math Lab - Paper Notebook Red-Pen Modal
// ==========================================
// 手元のノート・計算用紙をカメラ撮影またはアップロードし、
// Gemini 1.5 Flash Vision で行単位の赤ペン添削を返す。

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImageUp, Loader2, X } from 'lucide-react';

import type { GeneratedProblem, ScratchpadCorrectionResult } from '@/types/mathLab';
import { requestScratchpadCorrection } from '@/lib/api/correctScratchpadClient';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_CORRECT_SCRATCHPAD, formatEnergyShortage } from '@/lib/engine/energyCosts';

const MAX_IMAGE_CHARS = 5_500_000;

interface PaperScratchpadModalProps {
  problem?: GeneratedProblem | null;
  onClose: () => void;
}

function commentTone(severity: ScratchpadCorrectionResult['comments'][number]['severity']): string {
  if (severity === 'error') return 'border-red-400/50 bg-red-500/10 text-red-200';
  if (severity === 'ok') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
}

async function fileToCompressedDataUrl(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('画像の圧縮に失敗しました');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > MAX_IMAGE_CHARS && quality > 0.35) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return { dataUrl, mimeType: 'image/jpeg' };
}

export default function PaperScratchpadModal({ problem = null, onClose }: PaperScratchpadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correction, setCorrection] = useState<ScratchpadCorrectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください。');
      return;
    }
    setErrorMessage(null);
    setCorrection(null);
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setPayload(compressed);
      setPreviewUrl(compressed.dataUrl);
    } catch (error) {
      console.error('[PaperScratchpadModal] 画像の読み込みに失敗しました', error);
      setErrorMessage('写真の読み込みに失敗しました。別の画像で試してください。');
    }
  };

  const handleCorrect = async () => {
    if (!payload) {
      setErrorMessage('先にノートの写真を撮影または選択してください。');
      return;
    }

    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (!store.consumeEnergy(ENERGY_COST_CORRECT_SCRATCHPAD)) {
      setErrorMessage(formatEnergyShortage(ENERGY_COST_CORRECT_SCRATCHPAD, store.energy));
      return;
    }

    setIsCorrecting(true);
    setErrorMessage(null);
    try {
      const result = await requestScratchpadCorrection({
        imageBase64: payload.dataUrl,
        mimeType: payload.mimeType,
        captureSource: 'paper-notebook',
        problem,
      });
      setCorrection(result);
    } catch (error) {
      console.error('[PaperScratchpadModal] 添削に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_CORRECT_SCRATCHPAD);
      setErrorMessage('添削に失敗したため、Energy を返還しました。もう一度試してください。');
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-red-400/30 bg-slate-950/95 p-5 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">Paper Notebook</p>
        <h3 className="mt-1 text-lg font-semibold text-red-100">紙のノートを撮って添削</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          計算用紙がよく見えるように撮影してください。行ごとの符号ミスや公式への代入誤りを赤ペンで指摘します（
          {ENERGY_COST_CORRECT_SCRATCHPAD} Energy）。
        </p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-500/20"
          >
            <Camera className="h-3.5 w-3.5" />
            カメラで撮る
          </button>
          <button
            type="button"
            onClick={() => albumInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 py-2.5 text-xs font-semibold text-slate-200 hover:border-red-400/40"
          >
            <ImageUp className="h-3.5 w-3.5" />
            写真を選ぶ
          </button>
        </div>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="提出するノート写真"
            className="mt-4 max-h-56 w-full rounded-xl border border-slate-800 object-contain bg-black"
          />
        )}

        <button
          type="button"
          onClick={() => {
            void handleCorrect();
          }}
          disabled={isCorrecting || !payload}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-400/50 bg-red-500/15 py-2.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:opacity-40"
        >
          {isCorrecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              赤ペン添削中...
            </>
          ) : (
            'この写真をAI添削する'
          )}
        </button>

        {errorMessage && <p className="mt-2 text-xs text-red-400">{errorMessage}</p>}

        <AnimatePresence>
          {correction && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-red-400/25 bg-black/40 p-3"
            >
              <p className="text-sm leading-relaxed text-slate-200">{correction.summary}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {correction.overall === 'good'
                  ? '大きな論理の穴は見当たりません'
                  : correction.overall === 'empty'
                    ? '途中式が不足しています'
                    : '直すべき行があります'}
                {correction.source === 'local' ? ' · 通信エラー時の予備添削' : ' · Gemini Vision'}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {correction.comments.map((comment, index) => (
                  <li
                    key={`${comment.line ?? 'x'}-${index}`}
                    className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${commentTone(comment.severity)}`}
                  >
                    <span className="mr-2 font-mono text-[10px] font-bold uppercase tracking-wide text-red-300">
                      {comment.line ? `ノートの${comment.line}行目` : '全体'}
                    </span>
                    {comment.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

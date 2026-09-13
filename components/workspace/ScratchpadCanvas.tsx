'use client';

// ==========================================
// Apex Suite: Math Lab - Scratchpad Canvas
// ==========================================
// 手書きで途中式を書き込めるHTML5 Canvas。
// 下部の「途中式をAI添削」で画像を Vision に送り、赤ペン指導ダイアログを出す。

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eraser, Loader2, Trash2, X } from 'lucide-react';

import type { GeneratedProblem, ScratchpadCorrectionResult } from '@/types/mathLab';
import { requestScratchpadCorrection } from '@/lib/api/correctScratchpadClient';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_CORRECT_SCRATCHPAD, formatEnergyShortage } from '@/lib/engine/energyCosts';

const PEN_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#f8fafc'];
const CANVAS_BG = '#0b1120';

interface ScratchpadCanvasProps {
  problem?: GeneratedProblem | null;
  /** 問題を行き来したときに復元するキャンバス画像（data URL） */
  snapshot?: string | null;
  onSnapshotChange?: (dataUrl: string) => void;
  ref?: Ref<ScratchpadCanvasHandle>;
}

export type ScratchpadCanvasHandle = {
  exportSnapshot: () => string | null;
};

function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const { width, height } = canvas;
  if (width < 2 || height < 2) return true;
  const sample = ctx.getImageData(0, 0, width, height).data;
  const step = Math.max(16, Math.floor(sample.length / 4000) * 4);
  for (let i = 0; i < sample.length; i += step) {
    const dr = Math.abs(sample[i] - 11);
    const dg = Math.abs(sample[i + 1] - 17);
    const db = Math.abs(sample[i + 2] - 32);
    if (dr > 10 || dg > 10 || db > 10) return false;
  }
  return true;
}

function commentTone(severity: ScratchpadCorrectionResult['comments'][number]['severity']): string {
  if (severity === 'error') return 'border-red-400/50 bg-red-500/10 text-red-200';
  if (severity === 'ok') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
}

export default function ScratchpadCanvas({
  problem = null,
  snapshot = null,
  onSnapshotChange,
  ref,
}: ScratchpadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const onSnapshotChangeRef = useRef(onSnapshotChange);
  onSnapshotChangeRef.current = onSnapshotChange;

  const [color, setColor] = useState(PEN_COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correction, setCorrection] = useState<ScratchpadCorrectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emitSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSnapshotChangeRef.current) return;
    onSnapshotChangeRef.current(canvas.toDataURL('image/png'));
  };

  useImperativeHandle(ref, () => ({
    exportSnapshot: () => canvasRef.current?.toDataURL('image/png') ?? null,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paintBackground = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const applySize = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect ? Math.max(1, Math.floor(rect.width)) : Math.max(1, canvas.width);
      canvas.height = 320;
      paintBackground(ctx);
      return ctx;
    };

    const restoreFrom = (src: string | null | undefined) => {
      const ctx = applySize();
      if (!ctx || !src) return;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = src;
    };

    restoreFrom(snapshotRef.current);

    const resizeCanvas = () => {
      const current = canvas.toDataURL('image/png');
      restoreFrom(current);
    };

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [problem?.id]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;

    const point = getPoint(event);
    ctx.strokeStyle = isEraser ? CANVAS_BG : color;
    ctx.lineWidth = isEraser ? 18 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    emitSnapshot();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    emitSnapshot();
  };

  const handleCorrect = async () => {
    if (isCorrecting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isCanvasBlank(canvas)) {
      setCorrection({
        overall: 'empty',
        summary: '途中式が描かれていません。計算過程を書いてから添削してください。',
        comments: [
          {
            severity: 'warning',
            text: '展開・場合分け・結論を行に分けて書くと、行番号つきの赤ペンが返ってきます。',
          },
        ],
        source: 'local',
      });
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
      const imageBase64 = canvas.toDataURL('image/png');
      const result = await requestScratchpadCorrection({ imageBase64, problem });
      setCorrection(result);
    } catch (error) {
      console.error('[ScratchpadCanvas] 添削に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_CORRECT_SCRATCHPAD);
      setErrorMessage('添削に失敗したため、Energy を返還しました。もう一度試してください。');
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {PEN_COLORS.map((penColor) => (
          <button
            key={penColor}
            type="button"
            onClick={() => {
              setColor(penColor);
              setIsEraser(false);
            }}
            aria-label={`ペンの色を${penColor}にする`}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${
              !isEraser && color === penColor ? 'scale-110 border-white' : 'border-slate-600'
            }`}
            style={{ backgroundColor: penColor }}
          />
        ))}
        <button
          type="button"
          onClick={() => setIsEraser(true)}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
            isEraser
              ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
              : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          <Eraser className="h-3.5 w-3.5" />
          消しゴム
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-400 transition-colors hover:border-red-500/60 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          全消去
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full touch-none rounded-xl border border-slate-200 dark:border-slate-800"
      />

      <button
        type="button"
        onClick={() => {
          void handleCorrect();
        }}
        disabled={isCorrecting}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-red-400/50 bg-red-500/10 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
      >
        {isCorrecting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            赤ペン添削中...
          </>
        ) : (
          <>
            🔍 途中式をAI添削（{ENERGY_COST_CORRECT_SCRATCHPAD} Energy）
          </>
        )}
      </button>

      {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}

      <AnimatePresence>
        {correction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-red-400/30 bg-slate-950/95 p-5 shadow-xl"
            >
              <button
                type="button"
                onClick={() => setCorrection(null)}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">Red Pen</p>
              <h3 className="mt-1 text-lg font-semibold text-red-200">AI赤ペン添削</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{correction.summary}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {correction.overall === 'good'
                  ? '大きな論理の穴は見当たりません'
                  : correction.overall === 'empty'
                    ? '途中式が不足しています'
                    : '直すべき行があります'}
                {correction.source === 'local' ? ' · 通信エラー時の予備添削' : ' · Gemini Vision'}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {correction.comments.map((comment, index) => (
                  <li
                    key={`${comment.line ?? 'x'}-${index}`}
                    className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${commentTone(comment.severity)}`}
                  >
                    <span className="mr-2 font-mono text-[10px] font-bold uppercase tracking-wide text-red-300">
                      {comment.line ? `${comment.line}行目` : '全体'}
                    </span>
                    {comment.text}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setCorrection(null)}
                className="mt-4 w-full rounded-lg border border-red-400/40 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10"
              >
                直して再挑戦
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

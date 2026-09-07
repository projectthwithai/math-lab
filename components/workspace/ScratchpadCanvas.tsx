'use client';

// ==========================================
// Apex Suite: Math Lab - Scratchpad Canvas
// ==========================================
// 手書きで途中式を書き込めるHTML5 Canvas。ペン色切り替え・消しゴム・全消去に対応。

import { useEffect, useRef, useState } from 'react';
import { Eraser, Trash2 } from 'lucide-react';

const PEN_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#f8fafc'];

export default function ScratchpadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState(PEN_COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const previous = document.createElement('canvas');
      previous.width = canvas.width;
      previous.height = canvas.height;
      previous.getContext('2d')?.drawImage(canvas, 0, 0);

      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect ? Math.max(1, Math.floor(rect.width)) : canvas.width;
      canvas.height = 320;

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(previous, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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
    ctx.strokeStyle = isEraser ? '#0b1120' : color;
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
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    </div>
  );
}

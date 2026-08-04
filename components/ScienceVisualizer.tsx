"use client";

import React from "react";

// 描画用の数値パラメータをまとめる型定義
export interface ProblemParams {
  theta?: number; // 物理: 斜面角度
  m?: number;     // 物理: 質量
  mu?: number;    // 物理: 摩擦
  a?: number;     // 数学: 二次関数 y = a(x-p)^2 + q の a
  p?: number;     // 数学: 頂点 x
  q?: number;     // 数学: 頂点 y
}

interface ScienceVisualizerProps {
  params: ProblemParams;
}

export const ScienceVisualizer: React.FC<ScienceVisualizerProps> = ({ params }) => {
  const width = 320;
  const height = 180;
  const margin = 20;

  // 1) 物理: 斜面パラメーターが存在する場合の描画
  if (params?.theta !== undefined && params?.theta > 0) {
    const theta = params.theta;
    const m = params.m ?? 5;
    const rad = (theta * Math.PI) / 180;
    const slopeLength = 240;
    const x1 = margin;
    const y1 = height - margin;
    const x2 = margin + slopeLength * Math.cos(rad);
    const y2 = height - margin - slopeLength * Math.sin(rad);

    const boxWidth = Math.min(30 + m * 2, 60);
    const boxHeight = Math.min(20 + m * 1.5, 40);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return (
      <div className="flex flex-col items-center p-4 bg-black/40 rounded-xl border border-amber-500/20 shadow-inner">
        <span className="text-[10px] text-amber-500/60 mb-2 font-mono tracking-widest">
          DYNAMIC PHYSICS VISUALIZER (θ: {theta}°, m: {m}kg)
        </span>
        <svg width={width} height={height} className="overflow-visible">
          <line x1={0} y1={y1} x2={width} y2={y1} stroke="#555" strokeWidth="1" strokeDasharray="4 4" />
          <polygon points={`${x1},${y1} ${x2},${y1} ${x2},${y2}`} fill="rgba(201, 168, 76, 0.05)" stroke="#C9A84C" strokeWidth="2" />
          <path d={`M ${x1 + 30} ${y1} A 30 30 0 0 0 ${x1 + 30 * Math.cos(rad)} ${y1 - 30 * Math.sin(rad)}`} fill="none" stroke="#F0D878" strokeWidth="1.5" />
          <text x={x1 + 35} y={y1 - 8} fill="#F0D878" className="text-xs font-mono">{theta}°</text>
          <g transform={`translate(${midX}, ${midY}) rotate(${-theta})`}>
            <rect x={-boxWidth / 2} y={-boxHeight} width={boxWidth} height={boxHeight} fill="#0d0d0d" stroke="#F0D878" strokeWidth="2" rx="1" />
            <line x1={0} y1={-boxHeight / 2} x2={0} y2={30 + m} stroke="#FF7777" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <text x={5} y={20 + m} fill="#FF7777" className="text-[10px] font-mono">mg</text>
          </g>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7777" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }

  // 2) 数学: 二次関数パラメーターが存在する場合の描画 (y = a*(x-p)^2 + q)
  if (params?.a !== undefined) {
    const { a = 0.5, p = 0, q = 0 } = params;

    const scaleX = 20; 
    const scaleY = 15;
    const originX = 160;
    const originY = 100;

    const points: string[] = [];
    for (let sx = -6; sx <= 6; sx += 0.25) {
      const sy = a * Math.pow(sx - p, 2) + q;
      const svgX = originX + sx * scaleX;
      const svgY = originY - sy * scaleY;
      if (svgX >= 0 && svgX <= width && svgY >= 0 && svgY <= height) {
        points.push(`${svgX},${svgY}`);
      }
    }
    const polylinePath = points.join(" ");

    return (
      <div className="flex flex-col items-center p-4 bg-black/40 rounded-xl border border-amber-500/20 shadow-inner">
        <span className="text-[10px] text-amber-500/60 mb-2 font-mono tracking-widest">
          DYNAMIC FUNCTION VISUALIZER (y = {a}(x - {p})² + {q})
        </span>
        <svg width={width} height={height} className="overflow-visible">
          <line x1={0} y1={originY} x2={width} y2={originY} stroke="#333" strokeWidth="1" />
          <line x1={originX} y1={0} x2={originX} y2={height} stroke="#333" strokeWidth="1" />
          <text x={width - 15} y={originY - 5} fill="#666" className="text-[10px] font-mono">x</text>
          <text x={originX + 5} y={15} fill="#666" className="text-[10px] font-mono">y</text>

          <circle cx={originX + p * scaleX} cy={originY - q * scaleY} r="4" fill="#F0D878" />
          <text x={originX + p * scaleX + 6} y={originY - q * scaleY - 6} fill="#F0D878" className="text-[10px] font-mono">
            ({p}, {q})
          </text>

          {points.length > 1 && (
            <polyline points={polylinePath} fill="none" stroke="#C9A84C" strokeWidth="2.5" />
          )}
        </svg>
      </div>
    );
  }

  // どちらのパラメータもない場合
  return (
    <div className="flex flex-col items-center justify-center p-4 h-[180px] bg-black/40 rounded-xl border border-dashed border-amber-500/10">
      <span className="text-[10px] text-slate-600 font-mono">MATH LAB LABELS VISUALIZER READY</span>
    </div>
  );
};
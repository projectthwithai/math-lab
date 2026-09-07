'use client';

// ==========================================
// Apex Suite: Math Lab - Physics SVG Canvas
// ==========================================
// 斜面上の力（W / N / f）、直列回路、P-V 図をクライアント SVG で描画する。

import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import type { GeneratedProblem } from '@/types/mathLab';
import {
  resolvePhysicsScene,
  type CircuitScene,
  type InclineScene,
  type PhysicsPvScene,
  type PhysicsScene,
} from '@/lib/engine/scienceVisual';

interface PhysicsCanvasSimProps {
  problem?: GeneratedProblem;
  scene?: PhysicsScene | null;
  className?: string;
}

const SVG_W = 720;
const SVG_H = 420;

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0 L8 4 L0 8 Z" fill={color} />
    </marker>
  );
}

function ForceArrow({
  x,
  y,
  dx,
  dy,
  color,
  label,
  markerId,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  label: string;
  markerId: string;
}) {
  const endX = x + dx;
  const endY = y + dy;
  const lx = endX + (dx === 0 ? 10 : Math.sign(dx) * 8);
  const ly = endY + (dy === 0 ? -10 : Math.sign(dy) * 8);
  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth="3.2"
        markerEnd={`url(#${markerId})`}
      />
      <text x={lx} y={ly} fill={color} fontSize="15" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function InclineFigure({ scene, uid }: { scene: InclineScene; uid: string }) {
  const [showComponents, setShowComponents] = useState(false);
  const theta = (scene.thetaDeg * Math.PI) / 180;
  const x0 = 70;
  const y0 = 368;
  const L = 540;
  const x1 = x0 + L * Math.cos(theta);
  const y1 = y0 - L * Math.sin(theta);
  const t = 0.58;
  const cx = x0 + (x1 - x0) * t;
  const cy = y0 + (y1 - y0) * t;
  const alongX = Math.cos(theta);
  const alongY = -Math.sin(theta);
  const nX = -Math.sin(theta);
  const nY = -Math.cos(theta);
  const blockW = 54;
  const blockH = 36;

  return (
    <div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <ArrowHead id={`${uid}-w`} color="#f472b6" />
          <ArrowHead id={`${uid}-n`} color="#a78bfa" />
          <ArrowHead id={`${uid}-f`} color="#fbbf24" />
          <ArrowHead id={`${uid}-comp`} color="#67e8f9" />
          <linearGradient id={`${uid}-slope`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>
        <rect width={SVG_W} height={SVG_H} fill="transparent" />
        <polygon points={`${x0},${y0} ${x1},${y1} ${x1},${y0}`} fill={`url(#${uid}-slope)`} opacity="0.55" />
        <line x1={x0} y1={y0} x2={Math.max(x1, 680)} y2={y0} stroke="#64748b" strokeWidth="3" />
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#c4b5fd" strokeWidth="4" />
        <path
          d={`M ${x0 + 70} ${y0} A 70 70 0 0 0 ${x0 + 70 * Math.cos(theta)} ${y0 - 70 * Math.sin(theta)}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.4"
        />
        <text x={x0 + 86} y={y0 - 18} fill="#cbd5e1" fontSize="14" fontWeight="600">
          {`θ = ${scene.thetaDeg}°`}
        </text>
        <g transform={`translate(${cx}, ${cy}) rotate(${-scene.thetaDeg})`}>
          <rect
            x={-blockW / 2}
            y={-blockH - 4}
            width={blockW}
            height={blockH}
            rx="6"
            fill="#7c3aed"
            stroke="#c4b5fd"
            strokeWidth="2"
          />
          <text x="0" y={-blockH / 2 + 2} textAnchor="middle" fill="#ede9fe" fontSize="13" fontWeight="700">
            {`${scene.massKg} kg`}
          </text>
        </g>
        <ForceArrow x={cx} y={cy - 18} dx={0} dy={88} color="#f472b6" label="W" markerId={`${uid}-w`} />
        <ForceArrow
          x={cx}
          y={cy - 18}
          dx={nX * 92}
          dy={nY * 92}
          color="#a78bfa"
          label="N"
          markerId={`${uid}-n`}
        />
        {scene.mu !== null && scene.mu > 0 && (
          <ForceArrow
            x={cx}
            y={cy - 18}
            dx={alongX * 80}
            dy={alongY * 80}
            color="#fbbf24"
            label="f"
            markerId={`${uid}-f`}
          />
        )}
        {showComponents && (
          <>
            <ForceArrow
              x={cx}
              y={cy - 18}
              dx={-alongX * 70}
              dy={-alongY * 70}
              color="#67e8f9"
              label="mg sinθ"
              markerId={`${uid}-comp`}
            />
            <ForceArrow
              x={cx}
              y={cy - 18}
              dx={-nX * 70}
              dy={-nY * 70}
              color="#67e8f9"
              label="mg cosθ"
              markerId={`${uid}-comp`}
            />
          </>
        )}
        <text x="24" y="32" fill="#c4b5fd" fontSize="14" fontWeight="700">
          斜面上の物体（力の矢印）
        </text>
        {scene.mu !== null && (
          <text x="24" y="54" fill="#fbbf24" fontSize="12">
            {`μ = ${scene.mu}`}
          </text>
        )}
      </svg>
      <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowComponents((value) => !value)}
          className="rounded-lg border border-violet-400/40 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300"
        >
          {showComponents ? '成分表示を隠す' : 'mg sinθ / mg cosθ を表示'}
        </button>
      </div>
    </div>
  );
}

function CircuitFigure({ scene, uid }: { scene: CircuitScene; uid: string }) {
  const req = scene.r1 + scene.r2;
  const current = Math.round((scene.voltage / Math.max(req, 0.01)) * 100) / 100;
  const path = 'M 120 80 H 600 V 300 H 120 V 80';

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <ArrowHead id={`${uid}-i`} color="#a78bfa" />
      </defs>
      <text x="24" y="32" fill="#c4b5fd" fontSize="14" fontWeight="700">
        直列回路
      </text>
      <path d={path} fill="none" stroke="#64748b" strokeWidth="4" />
      <motion.circle r="6" fill="#c4b5fd">
        <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
      </motion.circle>
      {/* Battery */}
      <line x1="110" y1="150" x2="110" y2="230" stroke="#e2e8f0" strokeWidth="3" />
      <line x1="130" y1="165" x2="130" y2="215" stroke="#a78bfa" strokeWidth="8" />
      <text x="78" y="198" fill="#c4b5fd" fontSize="13" fontWeight="700">
        {`${scene.voltage} V`}
      </text>
      {/* R1 */}
      <rect x="250" y="62" width="90" height="36" rx="6" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2" />
      <text x="295" y="85" textAnchor="middle" fill="#ede9fe" fontSize="13" fontWeight="700">
        {`R1 ${scene.r1}Ω`}
      </text>
      {/* R2 */}
      <rect x="582" y="160" width="36" height="90" rx="6" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2" />
      <text x="600" y="268" textAnchor="middle" fill="#ede9fe" fontSize="13" fontWeight="700">
        {`R2 ${scene.r2}Ω`}
      </text>
      <text x="360" y="340" fill="#a78bfa" fontSize="14" fontWeight="700">
        {`I = ${current} A`}
      </text>
    </svg>
  );
}

function PhysicsPvFigure({ scene }: { scene: PhysicsPvScene }) {
  const pad = { l: 70, r: 40, t: 50, b: 55 };
  const maxP = Math.max(scene.p1, scene.p2) * 1.25;
  const maxV = Math.max(scene.v1, scene.v2) * 1.25;
  const xOf = (v: number) => pad.l + (v / maxV) * (SVG_W - pad.l - pad.r);
  const yOf = (p: number) => SVG_H - pad.b - (p / maxP) * (SVG_H - pad.t - pad.b);
  const x1 = xOf(scene.v1);
  const y1 = yOf(scene.p1);
  const x2 = xOf(scene.v2);
  const y2 = yOf(scene.p2);

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
      <text x="24" y="32" fill="#c4b5fd" fontSize="14" fontWeight="700">
        P–V グラフ
      </text>
      <line x1={pad.l} y1={SVG_H - pad.b} x2={SVG_W - pad.r} y2={SVG_H - pad.b} stroke="#94a3b8" strokeWidth="2" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={SVG_H - pad.b} stroke="#94a3b8" strokeWidth="2" />
      <text x={SVG_W - 28} y={SVG_H - 28} fill="#cbd5e1" fontSize="13">
        V
      </text>
      <text x="28" y="64" fill="#cbd5e1" fontSize="13">
        P
      </text>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a78bfa" strokeWidth="3" />
      <circle cx={x1} cy={y1} r="7" fill="#c4b5fd" />
      <circle cx={x2} cy={y2} r="7" fill="#f472b6" />
      <text x={x1 + 10} y={y1 - 10} fill="#e2e8f0" fontSize="12">
        {`A (${scene.v1}, ${scene.p1})`}
      </text>
      <text x={x2 + 10} y={y2 - 10} fill="#e2e8f0" fontSize="12">
        {`B (${scene.v2}, ${scene.p2})`}
      </text>
    </svg>
  );
}

export default function PhysicsCanvasSim({ problem, scene, className }: PhysicsCanvasSimProps) {
  const uid = useId().replace(/:/g, '');
  const resolved = useMemo(() => {
    if (scene) return scene;
    if (problem) return resolvePhysicsScene(problem);
    return null;
  }, [problem, scene]);

  if (!resolved) return null;

  return (
    <figure
      className={`overflow-hidden rounded-xl border border-violet-400/30 bg-white/80 backdrop-blur-md dark:border-violet-400/20 dark:bg-slate-950/60 ${className ?? ''}`}
    >
      {resolved.kind === 'incline' && <InclineFigure scene={resolved} uid={uid} />}
      {resolved.kind === 'circuit' && <CircuitFigure scene={resolved} uid={uid} />}
      {resolved.kind === 'pv' && <PhysicsPvFigure scene={resolved} />}
    </figure>
  );
}

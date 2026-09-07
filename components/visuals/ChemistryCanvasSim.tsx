'use client';

// ==========================================
// Apex Suite: Math Lab - Chemistry SVG Canvas
// ==========================================
// 熱化学エネルギー図・P-V グラフ・電池の電極をクライアント SVG で描画する。

import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import type { GeneratedProblem } from '@/types/mathLab';
import {
  resolveChemistryScene,
  type BatteryScene,
  type ChemistryPvScene,
  type ChemistryScene,
  type EnergyScene,
} from '@/lib/engine/scienceVisual';

interface ChemistryCanvasSimProps {
  problem?: GeneratedProblem;
  scene?: ChemistryScene | null;
  className?: string;
}

const SVG_W = 720;
const SVG_H = 420;

function EnergyFigure({ scene }: { scene: EnergyScene }) {
  const minH = Math.min(scene.reactants, scene.products) - 20;
  const maxH = Math.max(scene.activation, scene.reactants, scene.products) + 15;
  const span = Math.max(40, maxH - minH);
  const yOf = (value: number) => 70 + ((maxH - value) / span) * 280;
  const yR = yOf(scene.reactants);
  const yP = yOf(scene.products);
  const yA = yOf(scene.activation);
  const dH = Math.round((scene.products - scene.reactants) * 10) / 10;
  const curve = `M 90 ${yR} C 220 ${yR}, 260 ${yA}, 360 ${yA} S 500 ${yP}, 630 ${yP}`;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
      <text x="24" y="32" fill="#6ee7b7" fontSize="14" fontWeight="700">
        {scene.mode === 'exothermic' ? '熱化学エネルギー図（発熱）' : '熱化学エネルギー図（吸熱）'}
      </text>
      <line x1="70" y1="50" x2="70" y2="370" stroke="#64748b" strokeWidth="2" />
      <text x="24" y="58" fill="#94a3b8" fontSize="12">
        E
      </text>
      <path d={curve} fill="none" stroke="#34d399" strokeWidth="3.4" />
      <line x1="90" y1={yR} x2="210" y2={yR} stroke="#a7f3d0" strokeWidth="4" />
      <line x1="510" y1={yP} x2="630" y2={yP} stroke="#6ee7b7" strokeWidth="4" />
      <text x="150" y={yR - 10} textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="700">
        反応物
      </text>
      <text x="570" y={yP - 10} textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="700">
        生成物
      </text>
      <text x="360" y={yA - 12} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">
        Ea
      </text>
      <motion.line
        x1="210"
        x2="510"
        y1={yR}
        y2={yP}
        stroke={scene.mode === 'exothermic' ? '#34d399' : '#f59e0b'}
        strokeWidth="2"
        strokeDasharray="5 5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <text x="360" y={(yR + yP) / 2 + 18} textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="700">
        {scene.qualitative
          ? scene.mode === 'exothermic'
            ? 'ΔH < 0（発熱）'
            : 'ΔH > 0（吸熱）'
          : `ΔH = ${dH > 0 ? '+' : ''}${dH}`}
      </text>
    </svg>
  );
}

function ChemistryPvFigure({ scene }: { scene: ChemistryPvScene }) {
  const pad = { l: 70, r: 40, t: 50, b: 55 };
  const maxP = Math.max(scene.p1, scene.p2) * 1.3;
  const maxV = Math.max(scene.v1, scene.v2) * 1.3;
  const xOf = (v: number) => pad.l + (v / maxV) * (SVG_W - pad.l - pad.r);
  const yOf = (p: number) => SVG_H - pad.b - (p / maxP) * (SVG_H - pad.t - pad.b);
  const samples = Array.from({ length: 24 }, (_, index) => {
    const t = index / 23;
    const v = scene.v1 + (scene.v2 - scene.v1) * t;
    const k = scene.p1 * scene.v1;
    const p = k / Math.max(v, 0.2);
    return `${index === 0 ? 'M' : 'L'} ${xOf(v)} ${yOf(p)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
      <text x="24" y="32" fill="#6ee7b7" fontSize="14" fontWeight="700">
        P–V グラフ（気体）
      </text>
      <line x1={pad.l} y1={SVG_H - pad.b} x2={SVG_W - pad.r} y2={SVG_H - pad.b} stroke="#94a3b8" strokeWidth="2" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={SVG_H - pad.b} stroke="#94a3b8" strokeWidth="2" />
      <text x={SVG_W - 28} y={SVG_H - 28} fill="#cbd5e1" fontSize="13">
        V
      </text>
      <text x="28" y="64" fill="#cbd5e1" fontSize="13">
        P
      </text>
      <path d={samples} fill="none" stroke="#34d399" strokeWidth="3" />
      <circle cx={xOf(scene.v1)} cy={yOf(scene.p1)} r="7" fill="#6ee7b7" />
      <circle cx={xOf(scene.v2)} cy={yOf(scene.p2)} r="7" fill="#fbbf24" />
      <text x={xOf(scene.v1) + 10} y={yOf(scene.p1) - 10} fill="#d1fae5" fontSize="12">
        {`① P=${scene.p1}, V=${scene.v1}`}
      </text>
      <text x={xOf(scene.v2) + 10} y={yOf(scene.p2) - 10} fill="#d1fae5" fontSize="12">
        {`② P=${scene.p2}, V=${scene.v2}`}
      </text>
    </svg>
  );
}

function BatteryFigure({ scene, uid }: { scene: BatteryScene; uid: string }) {
  const [flow, setFlow] = useState(true);
  const ionPath = 'M 250 250 C 300 210, 420 210, 470 250';

  return (
    <div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`${uid}-sol`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <text x="24" y="32" fill="#6ee7b7" fontSize="14" fontWeight="700">
          電池の電極（ボルタ電池型）
        </text>
        <rect x="160" y="90" width="400" height="250" rx="18" fill="none" stroke="#6ee7b7" strokeWidth="3" />
        <rect x="170" y="200" width="380" height="128" rx="8" fill={`url(#${uid}-sol)`} opacity="0.85" />
        <rect x="210" y="120" width="28" height="200" rx="4" fill="#94a3b8" />
        <rect x="480" y="120" width="28" height="200" rx="4" fill="#f59e0b" />
        <path d="M 224 120 C 224 70, 494 70, 494 120" fill="none" stroke="#34d399" strokeWidth="3" />
        <circle cx="359" cy="70" r="10" fill="#34d399" />
        <text x="224" y="110" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">
          {`負極 ${scene.anode}`}
        </text>
        <text x="494" y="110" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="700">
          {`正極 ${scene.cathode}`}
        </text>
        <text x="224" y="350" textAnchor="middle" fill="#a7f3d0" fontSize="12">
          酸化（電子放出）
        </text>
        <text x="494" y="350" textAnchor="middle" fill="#a7f3d0" fontSize="12">
          還元（電子受容）
        </text>
        {flow && (
          <motion.circle r="5" fill="#6ee7b7">
            <animateMotion dur="1.8s" repeatCount="indefinite" path={ionPath} />
          </motion.circle>
        )}
        <text x="360" y="188" textAnchor="middle" fill="#d1fae5" fontSize="12">
          塩橋 / イオン
        </text>
        <text x="360" y="58" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="700">
          e⁻ →
        </text>
      </svg>
      <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setFlow((value) => !value)}
          className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
        >
          {flow ? 'イオンの流れを止める' : 'イオンの流れを表示'}
        </button>
      </div>
    </div>
  );
}

export default function ChemistryCanvasSim({ problem, scene, className }: ChemistryCanvasSimProps) {
  const uid = useId().replace(/:/g, '');
  const resolved = useMemo(() => {
    if (scene) return scene;
    if (problem?.visualType === 'chemistry_animation') return resolveChemistryScene(problem);
    return null;
  }, [problem, scene]);

  if (!resolved) return null;

  return (
    <figure
      className={`overflow-hidden rounded-xl border border-emerald-400/30 bg-white/80 backdrop-blur-md dark:border-emerald-400/20 dark:bg-slate-950/60 ${className ?? ''}`}
    >
      {resolved.kind === 'energy' && <EnergyFigure scene={resolved} />}
      {resolved.kind === 'pv' && <ChemistryPvFigure scene={resolved} />}
      {resolved.kind === 'battery' && <BatteryFigure scene={resolved} uid={uid} />}
    </figure>
  );
}

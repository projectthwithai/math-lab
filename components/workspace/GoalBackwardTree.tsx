'use client';

// ==========================================
// Apex Suite: Math Lab - 逆算型思考ツリー
// ==========================================
// ゴール ➔ 武器 ➔ 不足条件 ➔ 逆算アプローチ をカード樹形図で描く。

import { useMemo, useState, type ReactNode } from 'react';
import { GitBranch, KeyRound, Target, Unplug } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import { buildGoalBackwardTree } from '@/lib/engine/goalBackwardTree';
import KaTeXText from './KaTeXText';

interface GoalBackwardTreeProps {
  problem: GeneratedProblem;
  compact?: boolean;
}

export default function GoalBackwardTree({ problem, compact = false }: GoalBackwardTreeProps) {
  const [open, setOpen] = useState(!compact);
  const tree = useMemo(() => buildGoalBackwardTree(problem), [problem]);

  return (
    <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-200">
          <GitBranch className="h-3.5 w-3.5" />
          思考の逆算プロセス
        </span>
        <span className="text-[10px] text-slate-500">{open ? '閉じる' : '1タップで開く'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col items-stretch gap-0">
          <TreeNode
            icon={Target}
            tone="cyan"
            title="求めたいゴール"
            body={<KaTeXText text={`${tree.goal.label} — ${tree.goal.detail}`} />}
          />
          <TreeStem />
          <TreeNode
            icon={KeyRound}
            tone="amber"
            title="必要な武器（定理・公式）"
            body={
              <ul className="space-y-1.5">
                {tree.weapons.map((weapon) => (
                  <li key={weapon.name}>
                    <p className="font-semibold text-amber-200">{weapon.name}</p>
                    <p className="text-[11px] text-slate-400">
                      <KaTeXText text={weapon.formula} />
                    </p>
                  </li>
                ))}
              </ul>
            }
          />
          <TreeStem />
          <TreeNode
            icon={Unplug}
            tone="rose"
            title="不足している条件"
            body={
              <ul className="list-disc space-y-1 pl-4">
                {tree.missingConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            }
          />
          <TreeStem />
          <TreeNode
            icon={GitBranch}
            tone="emerald"
            title="逆算アプローチ"
            body={
              <ol className="list-decimal space-y-1 pl-4">
                {tree.approach.map((step) => (
                  <li key={step}>
                    <KaTeXText text={step} />
                  </li>
                ))}
              </ol>
            }
          />
        </div>
      )}
    </div>
  );
}

function TreeStem() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg width="12" height="18" viewBox="0 0 12 18">
        <line x1="6" y1="0" x2="6" y2="18" stroke="#22d3ee" strokeWidth="2" strokeOpacity="0.55" />
      </svg>
    </div>
  );
}

function TreeNode({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: typeof Target;
  tone: 'cyan' | 'amber' | 'rose' | 'emerald';
  title: string;
  body: ReactNode;
}) {
  const toneClass = {
    cyan: 'border-cyan-400/40 bg-slate-950/40',
    amber: 'border-amber-400/40 bg-slate-950/40',
    rose: 'border-rose-400/40 bg-slate-950/40',
    emerald: 'border-emerald-400/40 bg-slate-950/40',
  }[tone];

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed text-slate-200 ${toneClass}`}>
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <Icon className="h-3 w-3" />
        {title}
      </p>
      {body}
    </div>
  );
}

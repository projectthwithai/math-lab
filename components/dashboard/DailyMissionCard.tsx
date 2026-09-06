'use client';

// ==========================================
// Apex Suite: Math Lab - Daily Mission Card
// ==========================================
// 「🎯 本日のデイリーミッション」に表示する、未攻略パターン1件のカード。
// ワンタップでそのパターンのWorkspaceへ遷移する。

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import type { SolutionPattern } from '@/types/mathLab';
import { PATTERN_LEVEL_LABELS } from '@/data/patternsData';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';

const SUBJECT_LABEL: Record<SolutionPattern['subject'], string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

interface DailyMissionCardProps {
  pattern: SolutionPattern;
  missionIndex: number;
}

export default function DailyMissionCard({ pattern, missionIndex }: DailyMissionCardProps) {
  const router = useRouter();
  const accent = SUBJECT_ACCENT[pattern.subject];

  const handleStart = () => {
    const params = new URLSearchParams();
    if (pattern.unitId) params.set('unitId', pattern.unitId);
    params.set('patternId', pattern.id);
    router.push(`/workspace?${params.toString()}`);
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border ${accent.border} bg-slate-900/70 p-4 transition-all ${accent.borderHover} ${accent.shadowBase} ${accent.shadowHover}`}
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${accent.text}`}>
            ミッション {missionIndex + 1} ・ {SUBJECT_LABEL[pattern.subject]}
          </span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
            {PATTERN_LEVEL_LABELS[pattern.level]}
          </span>
        </div>
        <p className="text-xs text-slate-500">{pattern.unit}</p>
        <h3 className="mt-0.5 text-sm font-bold text-white">{pattern.patternName}</h3>
      </div>

      <button
        type="button"
        onClick={handleStart}
        className={`mt-4 flex items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
      >
        挑戦する
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

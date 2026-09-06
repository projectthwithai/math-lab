'use client';

// ==========================================
// Apex Suite: Math Lab - Solution Pattern Grid（本物の解法パターン図鑑）
// ==========================================
// 「基本/標準/応用」レベルフィルター・科目タブ・検索バー付きのパターン一覧。
// 各カードで「✍️ 自分流のコツ・解き方に書き換える」インライン編集ができる。

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Pencil, ArrowRight } from 'lucide-react';

import type { Subject } from '@/types/mathLab';
import { SOLUTION_PATTERNS, PATTERN_LEVEL_LABELS } from '@/data/patternsData';
import type { SolutionPattern } from '@/types/mathLab';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import {
  getAllPatternOverrides,
  saveCustomStrategyText,
  resetCustomStrategyText,
  type PatternOverride,
} from '@/lib/storage/patternStrategyStore';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];
const LEVEL_FILTERS: Array<SolutionPattern['level'] | 'all'> = ['all', 'basic', 'standard', 'advanced'];

interface PatternCardProps {
  pattern: SolutionPattern;
  isCleared: boolean;
  override: PatternOverride | null;
  onToggleCleared: (patternId: string) => void;
  onSaveOverride: (patternId: string, text: string) => void;
  onResetOverride: (patternId: string) => void;
}

function PatternCard({
  pattern,
  isCleared,
  override,
  onToggleCleared,
  onSaveOverride,
  onResetOverride,
}: PatternCardProps) {
  const router = useRouter();
  const accent = SUBJECT_ACCENT[pattern.subject];
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(override?.customStrategyText ?? pattern.strategyText);

  const displayedStrategy = override?.customStrategyText ?? pattern.strategyText;

  const handleStartEdit = () => {
    setDraft(override?.customStrategyText ?? pattern.strategyText);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveOverride(pattern.id, draft);
    setIsEditing(false);
  };

  const handleReset = () => {
    onResetOverride(pattern.id);
    setDraft(pattern.strategyText);
    setIsEditing(false);
  };

  const handleSolve = () => {
    const params = new URLSearchParams();
    if (pattern.unitId) params.set('unitId', pattern.unitId);
    params.set('patternId', pattern.id);
    router.push(`/workspace?${params.toString()}`);
  };

  return (
    <div className={`flex flex-col gap-3 rounded-xl border ${accent.border} bg-slate-900/70 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border ${accent.border} px-2 py-0.5 text-[10px] font-bold ${accent.text}`}>
            {SUBJECT_LABEL[pattern.subject]}
          </span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
            {PATTERN_LEVEL_LABELS[pattern.level]}
          </span>
          <span className="text-[11px] text-slate-500">{pattern.unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleCleared(pattern.id)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
            isCleared ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {isCleared ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {isCleared ? '攻略済み' : '未攻略'}
        </button>
      </div>

      <h3 className="text-sm font-bold text-white">{pattern.patternName}</h3>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 focus:border-fuchsia-400/60 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-300"
            >
              保存する
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400"
            >
              キャンセル
            </button>
            {override && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-500 hover:text-red-300"
              >
                AI版に戻す
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-slate-400">{displayedStrategy}</p>
          {override && (
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-fuchsia-400/30 bg-fuchsia-400/5 px-2 py-0.5 text-[10px] text-fuchsia-300">
              ✍️ 自分流にカスタマイズ済み
            </span>
          )}
        </>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-fuchsia-400/50 hover:text-fuchsia-300"
          >
            <Pencil className="h-3.5 w-3.5" />
            自分流のコツに書き換える
          </button>
        )}
        <button
          type="button"
          onClick={handleSolve}
          className={`ml-auto flex items-center gap-1 rounded-lg border ${accent.border} px-3 py-1.5 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          この問題を解く
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SolutionPatternGrid() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const toggleClearedPattern = useUserStore((state) => state.toggleClearedPattern);

  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<SolutionPattern['level'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrides, setOverrides] = useState<Record<string, PatternOverride>>({});

  useEffect(() => {
    // ローカルストレージからの初期読み込みのみで、レンダー中の連鎖的な更新は発生しない。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverrides(getAllPatternOverrides());
  }, []);

  const clearedSet = useMemo(() => new Set(clearedPatternIds), [clearedPatternIds]);

  const filteredPatterns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SOLUTION_PATTERNS.filter((pattern) => {
      const matchesSubject = subjectFilter === 'all' || pattern.subject === subjectFilter;
      const matchesLevel = levelFilter === 'all' || pattern.level === levelFilter;
      const matchesQuery =
        query.length === 0 ||
        pattern.patternName.toLowerCase().includes(query) ||
        pattern.unit.toLowerCase().includes(query);
      return matchesSubject && matchesLevel && matchesQuery;
    });
  }, [subjectFilter, levelFilter, searchQuery]);

  const handleSaveOverride = (patternId: string, text: string) => {
    const saved = saveCustomStrategyText(patternId, text);
    setOverrides((prev) => ({ ...prev, [patternId]: saved }));
  };

  const handleResetOverride = (patternId: string) => {
    resetCustomStrategyText(patternId);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[patternId];
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_FILTERS.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => setSubjectFilter(subject)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                subjectFilter === subject
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {subject === 'all' ? '全科目' : SUBJECT_LABEL[subject]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="パターン名で検索..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none sm:w-64"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {LEVEL_FILTERS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setLevelFilter(level)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              levelFilter === level
                ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {level === 'all' ? 'すべて' : PATTERN_LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{filteredPatterns.length}件のパターン</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            isCleared={clearedSet.has(pattern.id)}
            override={overrides[pattern.id] ?? null}
            onToggleCleared={toggleClearedPattern}
            onSaveOverride={handleSaveOverride}
            onResetOverride={handleResetOverride}
          />
        ))}

        {filteredPatterns.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">
            条件に一致するパターンが見つかりませんでした。
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - 階層型パターン図鑑
// ==========================================
// ① 単元を選ぶ → ② サブトピックを選ぶ → ③ パターンカードが展開。
// 各パターンカードは「具体例題（LaTeX）」「アプローチ方針」「自分流メモ」「このパターンを解く」。

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Loader2, Pencil, Sparkles, FileText, Cpu, Zap, Layers } from 'lucide-react';

import type { Subject } from '@/types/mathLab';
import type { SolutionPattern } from '@/types/mathLab';
import {
  SOLUTION_PATTERNS,
  getSolutionPatternsByUnit,
  getSolutionPatternsBySubtopic,
  getPatternStarDifficulty,
  getPatternStarTypeLabel,
  PATTERN_STAR_TYPE_LABELS,
} from '@/data/patternsData';
import { UNIT_CATEGORIES, UNITS_DATA, type UnitInfo } from '@/data/unitsData';
import { getUnitIcon } from '@/components/unit/unitIcons';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_DISCOVER_PATTERNS } from '@/lib/engine/energyCosts';
import KaTeXText from '@/components/workspace/KaTeXText';
import AiSolutionCheckPanel from '@/components/workspace/AiSolutionCheckPanel';
import {
  getAllPatternOverrides,
  saveCustomStrategyText,
  resetCustomStrategyText,
  type PatternOverride,
} from '@/lib/storage/patternStrategyStore';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];
const STAR_FILTERS: Array<1 | 2 | 3 | 4 | 'all'> = ['all', 1, 2, 3, 4];

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
    if (pattern.subtopicId) params.set('subtopicId', pattern.subtopicId);
    params.set('patternId', pattern.id);
    params.set('difficulty', String(getPatternStarDifficulty(pattern)));
    router.push(`/workspace?${params.toString()}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 rounded-xl border ${accent.border} bg-white/80 p-4 backdrop-blur-md dark:bg-slate-900/60`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border ${accent.border} px-2 py-0.5 text-[10px] font-bold ${accent.text}`}>
            {SUBJECT_LABEL[pattern.subject]}
          </span>
          <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
            {getPatternStarTypeLabel(pattern)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleCleared(pattern.id)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
            isCleared ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {isCleared ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {isCleared ? '攻略済み' : '未攻略'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{pattern.patternName}</h3>
        {pattern.discovered && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-amber-300">
            <Layers className="h-3 w-3 text-amber-500" />
            新パターン
          </span>
        )}
      </div>

      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          <FileText className="h-3 w-3 text-amber-500 dark:text-amber-400" />
          具体例題
        </p>
        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          <KaTeXText text={pattern.exampleQuestion} />
        </p>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              className="w-full min-w-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-fuchsia-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            />
            <div className="sm:w-52">
              <AiSolutionCheckPanel
                customText={draft}
                context={{
                  mode: 'pattern',
                  unit: pattern.unit,
                  patternName: pattern.patternName,
                  patternId: pattern.id,
                  strategyText: pattern.strategyText,
                  exampleQuestion: pattern.exampleQuestion,
                }}
                buttonLabel="解法ロジック検証"
              />
            </div>
          </div>
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
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-400"
            >
              キャンセル
            </button>
            {override && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-500 hover:text-red-300"
              >
                公式版に戻す
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">アプローチ方針</p>
              <p className="text-xs leading-relaxed text-slate-400">{displayedStrategy}</p>
            </div>
            {override && (
              <div className="sm:w-52">
                <AiSolutionCheckPanel
                  customText={displayedStrategy}
                  context={{
                    mode: 'pattern',
                    unit: pattern.unit,
                    patternName: pattern.patternName,
                    patternId: pattern.id,
                    strategyText: pattern.strategyText,
                    exampleQuestion: pattern.exampleQuestion,
                  }}
                  buttonLabel="解法ロジック検証"
                />
              </div>
            )}
          </div>
          {override && (
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-fuchsia-600 dark:border-slate-700 dark:bg-slate-950 dark:text-fuchsia-300">
              <Pencil className="h-3 w-3" />
              自分流にカスタマイズ済み
            </span>
          )}
        </>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:border-fuchsia-400/50 hover:text-fuchsia-300"
          >
            <Pencil className="h-3.5 w-3.5" />
            自分流メモ書き換え保存
          </button>
        )}
        <button
          type="button"
          onClick={handleSolve}
          className={`ml-auto flex items-center gap-1 rounded-lg border ${accent.border} px-3 py-1.5 text-xs font-medium tracking-tight ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          このパターンの問題を解く
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function UnitGlyph({ iconName, className }: { iconName: string; className?: string }) {
  /* lucide アイコンは静的マップから解決するだけ */
  /* eslint-disable react-hooks/static-components */
  const Icon = getUnitIcon(iconName);
  return <Icon className={className} />;
  /* eslint-enable react-hooks/static-components */
}

function UnitBranchCard({
  unit,
  clearedCount,
  totalCount,
  onSelect,
}: {
  unit: UnitInfo;
  clearedCount: number;
  totalCount: number;
  onSelect: (unitId: string) => void;
}) {
  const accent = SUBJECT_ACCENT[unit.subject];
  const progressPercent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2 }}
      onClick={() => onSelect(unit.id)}
      className={`flex flex-col justify-between rounded-xl border ${accent.border} bg-white/80 p-4 text-left backdrop-blur-md transition-colors dark:bg-slate-900/60 ${accent.borderHover}`}
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bgSoft} ${accent.text}`}>
            <UnitGlyph iconName={unit.iconName} className="h-4 w-4" />
          </span>
          <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
            {unit.category}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{unit.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{unit.description}</p>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>パターン攻略</span>
          <span>
            {clearedCount}/{totalCount}本
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full rounded-full ${accent.bg}`} style={{ width: `${progressPercent}%` }} />
        </div>
        <p className={`mt-3 text-xs font-semibold ${accent.text}`}>この単元のパターンを見る →</p>
      </div>
    </motion.button>
  );
}

export default function SolutionPatternGrid() {
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const toggleClearedPattern = useUserStore((state) => state.toggleClearedPattern);
  const discovered = useUserStore((state) => state.discoveredPatterns);
  const appendDiscoveredPatterns = useUserStore((state) => state.appendDiscoveredPatterns);

  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [starFilter, setStarFilter] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, PatternOverride>>({});
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverNotice, setDiscoverNotice] = useState<string | null>(null);

  useEffect(() => {
    // ローカルストレージからの初期読み込みのみ。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverrides(getAllPatternOverrides());
  }, []);

  const clearedSet = useMemo(() => new Set(clearedPatternIds), [clearedPatternIds]);
  const selectedUnit = selectedUnitId ? UNITS_DATA.find((unit) => unit.id === selectedUnitId) : undefined;

  const patternsForUnit = (unitId: string): SolutionPattern[] => {
    const staticOnes = getSolutionPatternsByUnit(unitId);
    const extra = discovered.filter((pattern) => pattern.unitId === unitId);
    return [...extra, ...staticOnes];
  };

  const unitsInView = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return UNITS_DATA.filter((unit) => {
      const patterns = [
        ...getSolutionPatternsByUnit(unit.id),
        ...discovered.filter((pattern) => pattern.unitId === unit.id),
      ];
      if (patterns.length === 0) return false;
      const matchesSubject = subjectFilter === 'all' || unit.subject === subjectFilter;
      const matchesQuery =
        query.length === 0 ||
        unit.title.toLowerCase().includes(query) ||
        unit.description.toLowerCase().includes(query) ||
        patterns.some(
          (pattern) =>
            pattern.patternName.toLowerCase().includes(query) ||
            pattern.exampleQuestion.toLowerCase().includes(query)
        );
      return matchesSubject && matchesQuery;
    });
  }, [subjectFilter, searchQuery, discovered]);

  const filteredPatterns = useMemo(() => {
    if (!selectedUnitId || !selectedSubtopicId) return [];
    const query = searchQuery.trim().toLowerCase();
    const merged = [
      ...discovered.filter(
        (pattern) => pattern.unitId === selectedUnitId && pattern.subtopicId === selectedSubtopicId
      ),
      ...getSolutionPatternsBySubtopic(selectedSubtopicId),
    ];
    return merged.filter((pattern) => {
      const matchesStar =
        starFilter === 'all' || getPatternStarDifficulty(pattern) === starFilter;
      const matchesQuery =
        query.length === 0 ||
        pattern.patternName.toLowerCase().includes(query) ||
        pattern.exampleQuestion.toLowerCase().includes(query) ||
        pattern.strategyText.toLowerCase().includes(query);
      return matchesStar && matchesQuery;
    });
  }, [selectedUnitId, selectedSubtopicId, starFilter, searchQuery, discovered]);

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

  const handleDiscoverPatterns = async () => {
    if (!selectedUnitId || isDiscovering) return;

    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      setDiscoverNotice('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (!store.useEnergy(ENERGY_COST_DISCOVER_PATTERNS)) {
      setDiscoverNotice('Energyが不足しています。デイリークエストをクリアして回復しましょう');
      return;
    }

    setIsDiscovering(true);
    setDiscoverNotice(null);
    const analysisDelay = new Promise((resolve) => {
      window.setTimeout(resolve, 1500);
    });

    try {
      const existingNames = patternsForUnit(selectedUnitId).map((pattern) => pattern.patternName);
      const fetchPatterns = fetch('/api/generate-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: selectedUnitId,
          subject: selectedUnit?.subject,
          existingNames,
          count: 4,
          subtopicId: selectedSubtopicId,
        }),
      });
      const [, response] = await Promise.all([analysisDelay, fetchPatterns]);
      if (!response.ok) throw new Error('発掘APIが失敗しました');
      const data = (await response.json()) as { patterns?: SolutionPattern[]; source?: string };
      const incoming = (data.patterns ?? []).map((pattern) => ({ ...pattern, discovered: true }));
      if (incoming.length === 0) {
        useUserStore.getState().refundEnergy(ENERGY_COST_DISCOVER_PATTERNS);
        setDiscoverNotice('新しいパターンを見つけられませんでした。Energy を返還しました。');
        return;
      }
      const stamped = incoming.map((pattern) => ({
        ...pattern,
        unitId: pattern.unitId ?? selectedUnitId,
        subtopicId: pattern.subtopicId ?? selectedSubtopicId ?? undefined,
        discovered: true as const,
      }));
      const added = appendDiscoveredPatterns(stamped);
      const sourceLabel = data.source === 'llm' ? 'Apexガイド' : 'ローカルエンジン';
      setDiscoverNotice(
        `${sourceLabel}が ${added.length || incoming.length} 件の新パターンを図鑑に追加しました。すぐ下から自分流メモに編集できます。`
      );
    } catch (error) {
      console.error('[SolutionPatternGrid] パターン発掘に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_DISCOVER_PATTERNS);
      setDiscoverNotice('発掘に失敗したため、Energy を返還しました。通信状況を確認して再試行してください。');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_FILTERS.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => {
                setSubjectFilter(subject);
                setSelectedUnitId(null);
                setSelectedSubtopicId(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                subjectFilter === subject
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-500'
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
          placeholder={selectedUnitId ? 'パターン名・例題で検索...' : '単元名・パターン名で検索...'}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none sm:w-64"
        />
      </div>

      <AnimatePresence mode="wait">
        {!selectedUnitId ? (
          <motion.div
            key="units"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex flex-col gap-4"
          >
            <p className="text-xs text-slate-500">
              単元を選ぶと、その中の解法パターンが枝分かれして展開されます（静的
              {SOLUTION_PATTERNS.length}＋発掘{discovered.length}パターン）
            </p>
            {UNIT_CATEGORIES.filter((category) => unitsInView.some((unit) => unit.category === category)).map(
              (category) => (
                <section key={category}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{category}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {unitsInView
                      .filter((unit) => unit.category === category)
                      .map((unit) => {
                        const patterns = [
                          ...getSolutionPatternsByUnit(unit.id),
                          ...discovered.filter((pattern) => pattern.unitId === unit.id),
                        ];
                        const clearedCount = patterns.filter((pattern) => clearedSet.has(pattern.id)).length;
                        return (
                          <UnitBranchCard
                            key={unit.id}
                            unit={unit}
                            clearedCount={clearedCount}
                            totalCount={patterns.length}
                            onSelect={(unitId) => {
                              setSelectedUnitId(unitId);
                              setSelectedSubtopicId(null);
                            }}
                          />
                        );
                      })}
                  </div>
                </section>
              )
            )}
            {unitsInView.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">条件に一致する単元が見つかりませんでした。</p>
            )}
          </motion.div>
        ) : !selectedSubtopicId ? (
          <motion.div
            key={`${selectedUnitId}-subtopics`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedUnitId(null)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-400/50 dark:border-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                単元を選ぶ
              </button>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {selectedUnit?.category} / {selectedUnit?.title}
                </p>
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  サブトピックを選ぶ
                </h2>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {(selectedUnit?.subtopics ?? []).map((subtopic) => {
                const patterns = [
                  ...getSolutionPatternsBySubtopic(subtopic.id),
                  ...discovered.filter((pattern) => pattern.subtopicId === subtopic.id),
                ];
                const clearedCount = patterns.filter((pattern) => clearedSet.has(pattern.id)).length;
                return (
                  <button
                    key={subtopic.id}
                    type="button"
                    onClick={() => setSelectedSubtopicId(subtopic.id)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{subtopic.title}</p>
                      <p className="text-xs text-slate-500">{subtopic.description}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {clearedCount}/{patterns.length} · ★{subtopic.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedUnitId}-${selectedSubtopicId}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedSubtopicId(null)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-400/50 dark:border-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                サブトピックを選ぶ
              </button>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {selectedUnit?.title} / {selectedUnit?.subtopics.find((item) => item.id === selectedSubtopicId)?.title}
                </p>
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  このサブトピックのパターン（{filteredPatterns.length}件）
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => {
                  void handleDiscoverPatterns();
                }}
                disabled={isDiscovering}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold tracking-tight text-slate-800 transition-colors hover:border-slate-300 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-slate-700"
              >
                {isDiscovering ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />}
                {isDiscovering ? '解析中...' : '新パターン解析 (-10 Energy)'}
              </button>
              <AnimatePresence>
                {isDiscovering && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <span className="relative flex h-10 w-10 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-500 dark:text-cyan-400" />
                    </span>
                    <p className="flex items-center gap-1.5 text-center text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                      <Cpu className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                      未攻略パターンを深層解析中...
                    </p>
                    <p className="text-[11px] text-slate-500">解法構造をスキャンしています</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {discoverNotice && (
                <p
                  className={`mt-2 flex items-center justify-center gap-1.5 text-center text-xs ${
                    discoverNotice.includes('Energyが不足')
                      ? 'font-medium text-amber-600 dark:text-amber-300'
                      : 'text-slate-500'
                  }`}
                >
                  {discoverNotice.includes('Energyが不足') && <Zap className="h-3.5 w-3.5 text-amber-400" />}
                  {discoverNotice}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STAR_FILTERS.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter(star)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    starFilter === star
                      ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {star === 'all' ? 'すべて' : PATTERN_STAR_TYPE_LABELS[star]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

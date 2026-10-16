'use client';

// ==========================================
// Apex Suite: Math Lab - 統合パターン図鑑
// ==========================================
// 教科タブ → 単元（総復習） → サブトピック（ランダム演習） → パターン展開。
// パターン名はインラインリネーム。新パターン解析は件数上限なし。

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Crown,
  Flame,
  Loader2,
  Pencil,
  Sparkles,
  FileText,
  Cpu,
  Zap,
  Layers,
  AlertTriangle,
  VenetianMask,
  FolderPlus,
} from 'lucide-react';

import type { GeneratedProblem, PatternVariant, SolutionPattern } from '@/types/mathLab';
import {
  SOLUTION_PATTERNS,
  getPatternStarDifficulty,
  getPatternStarTypeLabel,
  PATTERN_STAR_TYPE_LABELS,
  resolveMasteredPatternIds,
  getCatalogPatternsForUnit,
  getCatalogPatternsForSubtopic,
} from '@/data/patternsData';
import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory, type UnitInfo } from '@/data/unitsData';
import { getUnitIcon } from '@/components/unit/unitIcons';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import {
  ENERGY_COST_DISCOVER_PATTERNS,
  ENERGY_COST_GENERATE_VARIANT,
  formatEnergyShortage,
} from '@/lib/engine/energyCosts';
import { hasDeveloperPrivileges } from '@/lib/auth/developerAccess';
import {
  BASE_VARIANT_STYLE_LABEL,
  buildVariantTabLabel,
} from '@/lib/engine/patternVariant';
import { stripBannedVariantMeta } from '@/lib/engine/variantQuality';
import { withAiRouterHeaders } from '@/lib/api/aiRouterClient';
import { startUnitReviewExam } from '@/lib/engine/unitReview';
import { resolvePatternDisplayName } from '@/lib/engine/patternDisplay';
import KaTeXText from '@/components/workspace/KaTeXText';
import AiSolutionCheckPanel from '@/components/workspace/AiSolutionCheckPanel';
import AddToFileModal from '@/components/library/AddToFileModal';
import { problemFromPatternExample } from '@/lib/engine/customFileProblem';

const COURSE_TABS: Array<'all' | UnitCategory> = ['all', ...UNIT_CATEGORIES];
const STAR_FILTERS: Array<1 | 2 | 3 | 4 | 'all'> = ['all', 1, 2, 3, 4];
const EMPTY_PATTERN_VARIANTS: PatternVariant[] = [];

interface PatternCardProps {
  pattern: SolutionPattern;
  isCleared: boolean;
  onToggleCleared: (patternId: string) => void;
}

function PatternCard({ pattern, isCleared, onToggleCleared }: PatternCardProps) {
  const router = useRouter();
  const accent = SUBJECT_ACCENT[pattern.subject];
  const note = useUserStore((state) => state.patternNotes[pattern.id]);
  const customName = useUserStore((state) => state.patternCustomNames[pattern.id]);
  const variantExtra = useUserStore((state) => state.patternVariantCounts[pattern.id] ?? 0);
  const storedVariants = useUserStore(
    (state) => state.patternVariants[pattern.id] ?? EMPTY_PATTERN_VARIANTS
  );
  const isDeveloper = useUserStore((state) => state.isDeveloper);
  const upsertPatternNote = useUserStore((state) => state.upsertPatternNote);
  const clearPatternNote = useUserStore((state) => state.clearPatternNote);
  const renamePattern = useUserStore((state) => state.renamePattern);
  const appendPatternVariant = useUserStore((state) => state.appendPatternVariant);
  const [isEditing, setIsEditing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(note?.customText ?? pattern.strategyText);
  const displayName = resolvePatternDisplayName(pattern, customName);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [selectedVariantId, setSelectedVariantId] = useState<string | 'base'>('base');
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [variantNotice, setVariantNotice] = useState<string | null>(null);
  const [isAddToFileOpen, setIsAddToFileOpen] = useState(false);
  const variantsCount = Math.max(pattern.variantsCount ?? 0, variantExtra, storedVariants.length);
  const variantCost =
    isDeveloper || hasDeveloperPrivileges() ? 0 : ENERGY_COST_GENERATE_VARIANT;
  const selectedStored =
    selectedVariantId === 'base'
      ? null
      : storedVariants.find((item) => item.id === selectedVariantId) ?? null;
  const exampleText = selectedStored
    ? stripBannedVariantMeta(selectedStored.problem.questionText)
    : pattern.exampleQuestion;
  const fileProblem = selectedStored
    ? selectedStored.problem
    : problemFromPatternExample(pattern, displayName);

  const displayedStrategy = note?.customText ?? pattern.strategyText;

  useEffect(() => {
    if (isEditing) return;
    setDraft(note?.customText ?? pattern.strategyText);
  }, [note?.customText, note?.updatedAt, pattern.strategyText, isEditing]);

  useEffect(() => {
    if (isRenaming) return;
    setNameDraft(displayName);
  }, [displayName, isRenaming]);

  const handleStartEdit = () => {
    setDraft(note?.customText ?? pattern.strategyText);
    setIsEditing(true);
  };

  const handleSave = () => {
    upsertPatternNote(pattern.id, draft);
    setIsEditing(false);
  };

  const handleReset = () => {
    clearPatternNote(pattern.id);
    setDraft(pattern.strategyText);
    setIsEditing(false);
  };

  const commitRename = () => {
    renamePattern(pattern.id, nameDraft);
    setIsRenaming(false);
  };

  const handleSolve = () => {
    const params = new URLSearchParams();
    if (pattern.unitId) params.set('unitId', pattern.unitId);
    if (pattern.subtopicId) params.set('subtopicId', pattern.subtopicId);
    params.set('patternId', pattern.id);
    params.set('difficulty', String(getPatternStarDifficulty(pattern)));
    if (selectedStored) {
      params.set('variantId', selectedStored.id);
      params.set('source', 'variant');
    }
    router.push(`/workspace?${params.toString()}`);
  };

  const handleAnalyzeVariant = async () => {
    if (isGeneratingVariant) return;
    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      setVariantNotice('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (!store.useEnergy(ENERGY_COST_GENERATE_VARIANT)) {
      setVariantNotice(formatEnergyShortage(ENERGY_COST_GENERATE_VARIANT, store.energy));
      return;
    }

    setIsGeneratingVariant(true);
    setVariantNotice(null);
    try {
      const response = await fetch('/api/generate-variant', {
        method: 'POST',
        headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          patternId: pattern.id,
          patternName: displayName,
          strategyText: displayedStrategy,
          unitId: pattern.unitId,
          subject: pattern.subject,
          existingCount: storedVariants.length,
        }),
      });
      if (!response.ok) throw new Error(`generate-variant ${response.status}`);
      const data = (await response.json()) as { problem?: GeneratedProblem; styleLabel?: string };
      if (!data.problem?.questionText) throw new Error('empty variant');
      const styleLabel = data.styleLabel?.trim() || '変装';
      const saved = appendPatternVariant(pattern.id, {
        id: data.problem.id || `variant-${pattern.id}-${Date.now()}`,
        patternId: pattern.id,
        label: buildVariantTabLabel(storedVariants.length + 2, styleLabel),
        styleLabel,
        problem: { ...data.problem, patternId: pattern.id },
        createdAt: new Date().toISOString(),
      });
      setSelectedVariantId(saved.id);
      setVariantNotice(`「${saved.label}」を蓄積しました。ワークスペースで数字を変えて反復できます。`);
    } catch (error) {
      console.error('[PatternCard] 新バリエーション解析に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_GENERATE_VARIANT);
      setVariantNotice('解析に失敗したため、Energy を返還しました。通信状況を確認して再試行してください。');
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 rounded-xl border ${accent.border} bg-white/80 p-4 backdrop-blur-md dark:bg-[#12141f] dark:shadow-lg dark:shadow-black/40`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">
            {getPatternStarTypeLabel(pattern)}
          </span>
          {variantsCount > 0 && (
            <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-700">
              形式違い {variantsCount}問
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleCleared(pattern.id)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
            isCleared ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
          }`}
        >
          {isCleared ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {isCleared ? '攻略済み' : '未攻略'}
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {isRenaming ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === 'Escape') setIsRenaming(false);
              }}
              className="min-w-0 flex-1 rounded-lg surface-input px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none dark:text-white"
              autoFocus
            />
            <button
              type="button"
              onClick={commitRename}
              className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200"
            >
              保存
            </button>
          </div>
        ) : (
          <h3 className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white">{displayName}</h3>
        )}
        <button
          type="button"
          onClick={() => {
            setNameDraft(displayName);
            setIsRenaming((open) => !open);
          }}
          aria-label="名前を編集"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-cyan-400/60 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-400"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {pattern.trapPattern && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            罠パターン
          </span>
        )}
        {pattern.discovered && !pattern.trapPattern && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-slate-700 dark:bg-slate-950 dark:text-amber-300">
            <Layers className="h-3 w-3 text-amber-500" />
            新パターン
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedVariantId('base')}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              selectedVariantId === 'base'
                ? `${accent.border} ${accent.bgSoft} ${accent.text}`
                : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            {buildVariantTabLabel(1, BASE_VARIANT_STYLE_LABEL)}
          </button>
          {storedVariants.map((variant, index) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedVariantId(variant.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                selectedVariantId === variant.id
                  ? `${accent.border} ${accent.bgSoft} ${accent.text}`
                  : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {variant.label || buildVariantTabLabel(index + 2, variant.styleLabel)}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            <FileText className="h-3 w-3 text-amber-500 dark:text-amber-400" />
            {selectedStored ? selectedStored.label : '具体例題'}
          </p>
          <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_strong]:font-semibold">
            <KaTeXText text={exampleText} />
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              className="w-full min-w-0 flex-1 resize-none rounded-lg surface-input p-3 text-xs leading-relaxed text-slate-800 focus:border-fuchsia-400/60 focus:outline-none dark:text-slate-200"
            />
            <div className="sm:w-52">
              <AiSolutionCheckPanel
                customText={draft}
                context={{
                  mode: 'pattern',
                  unit: pattern.unit,
                  patternName: displayName,
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
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-400 dark:border-slate-700"
            >
              キャンセル
            </button>
            {note && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:text-red-300 dark:border-slate-700"
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
            {note && (
              <div className="sm:w-52">
                <AiSolutionCheckPanel
                  customText={displayedStrategy}
                  context={{
                    mode: 'pattern',
                    unit: pattern.unit,
                    patternName: displayName,
                    patternId: pattern.id,
                    strategyText: pattern.strategyText,
                    exampleQuestion: pattern.exampleQuestion,
                  }}
                  buttonLabel="解法ロジック検証"
                />
              </div>
            )}
          </div>
          {note && (
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-fuchsia-600 dark:border-slate-700 dark:bg-slate-950 dark:text-fuchsia-300">
              <Pencil className="h-3 w-3" />
              自分流にカスタマイズ済み
            </span>
          )}
        </>
      )}

      <div className="mt-1 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-fuchsia-400/50 hover:text-fuchsia-300 dark:border-slate-700 dark:text-slate-300"
            >
              <Pencil className="h-3.5 w-3.5" />
              自分流メモ
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleAnalyzeVariant()}
            disabled={isGeneratingVariant}
            className="flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:border-violet-400/70 disabled:opacity-60 dark:text-violet-200"
          >
            {isGeneratingVariant ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <VenetianMask className="h-3.5 w-3.5" />
            )}
            {isGeneratingVariant
              ? '解析中...'
              : `新バリエーション解析 (-${variantCost} Energy)`}
          </button>
          <button
            type="button"
            onClick={() => setIsAddToFileOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-400/50 dark:border-slate-700 dark:text-slate-300"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            ファイルに追加
          </button>
          <button
            type="button"
            onClick={handleSolve}
            className={`ml-auto flex items-center gap-1.5 rounded-lg border ${accent.border} px-3 py-1.5 text-xs font-medium tracking-tight ${accent.text} transition-colors ${accent.bgSoftHover}`}
          >
            <Flame className="h-3.5 w-3.5" />
            {selectedStored ? 'このバリエーションを演習' : 'このパターンを集中的に演習'}
          </button>
        </div>
        {variantNotice && (
          <p className="text-[11px] text-violet-600 dark:text-violet-300">{variantNotice}</p>
        )}
      </div>
      {isAddToFileOpen && (
        <AddToFileModal problem={fileProblem} onClose={() => setIsAddToFileOpen(false)} />
      )}
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
      className={`flex flex-col justify-between rounded-xl border ${accent.border} bg-white/80 p-4 text-left backdrop-blur-md transition-colors dark:bg-[#0b0d14] dark:shadow-lg dark:shadow-black/40 ${accent.borderHover}`}
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bgSoft} ${accent.text}`}>
            <UnitGlyph iconName={unit.iconName} className="h-4 w-4" />
          </span>
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">
            {unit.category}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{unit.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{unit.description}</p>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
          <span>攻略達成率 {progressPercent}%</span>
          <span>
            {clearedCount}/{totalCount}本
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800/80">
          <div className={`h-full rounded-full ${accent.bg}`} style={{ width: `${progressPercent}%` }} />
        </div>
        <p className={`mt-3 text-xs font-semibold ${accent.text}`}>この単元を開く</p>
      </div>
    </motion.button>
  );
}

export default function SolutionPatternGrid() {
  const router = useRouter();
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const toggleClearedPattern = useUserStore((state) => state.toggleClearedPattern);
  const discovered = useUserStore((state) => state.discoveredPatterns);
  const appendDiscoveredPatterns = useUserStore((state) => state.appendDiscoveredPatterns);
  const patternCustomNames = useUserStore((state) => state.patternCustomNames);

  const [courseFilter, setCourseFilter] = useState<'all' | UnitCategory>('all');
  const [starFilter, setStarFilter] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverNotice, setDiscoverNotice] = useState<string | null>(null);

  const clearedSet = useMemo(() => resolveMasteredPatternIds(clearedPatternIds), [clearedPatternIds]);
  const selectedUnit = selectedUnitId ? UNITS_DATA.find((unit) => unit.id === selectedUnitId) : undefined;

  const unitsInView = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return UNITS_DATA.filter((unit) => {
      const patterns = getCatalogPatternsForUnit(unit.id, discovered);
      const matchesCourse = courseFilter === 'all' || unit.category === courseFilter;
      const matchesQuery =
        query.length === 0 ||
        unit.title.toLowerCase().includes(query) ||
        unit.description.toLowerCase().includes(query) ||
        patterns.some((pattern) => {
          const name = resolvePatternDisplayName(pattern, patternCustomNames[pattern.id]);
          return (
            name.toLowerCase().includes(query) ||
            pattern.exampleQuestion.toLowerCase().includes(query)
          );
        });
      return matchesCourse && matchesQuery;
    });
  }, [courseFilter, searchQuery, discovered, patternCustomNames]);

  const handleDiscoverPatterns = async (subtopicId: string) => {
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

    try {
      const existing = getCatalogPatternsForSubtopic(subtopicId, discovered);
      const existingNames = existing.flatMap((pattern) =>
        [pattern.patternName, pattern.customName, patternCustomNames[pattern.id]].filter(
          (name): name is string => Boolean(name && name.trim())
        )
      );
      const response = await fetch('/api/generate-patterns', {
        method: 'POST',
        headers: withAiRouterHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          unitId: selectedUnitId,
          subject: selectedUnit?.subject,
          existingNames,
          count: 4,
          subtopicId,
        }),
      });
      if (!response.ok) throw new Error('発掘APIが失敗しました');
      const data = (await response.json()) as { patterns?: SolutionPattern[] };
      const incoming = (data.patterns ?? []).map((pattern) => ({
        ...pattern,
        unitId: pattern.unitId ?? selectedUnitId,
        subtopicId: pattern.subtopicId ?? subtopicId,
        discovered: true as const,
      }));
      if (incoming.length === 0) {
        useUserStore.getState().refundEnergy(ENERGY_COST_DISCOVER_PATTERNS);
        setDiscoverNotice('新しいパターンを見つけられませんでした。Energy を返還しました。');
        return;
      }
      const added = appendDiscoveredPatterns(incoming);
      setDiscoverNotice(`${added.length || incoming.length} 件の新パターンを追加しました。件数に上限はありません。`);
    } catch (error) {
      console.error('[SolutionPatternGrid] パターン発掘に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_DISCOVER_PATTERNS);
      setDiscoverNotice('発掘に失敗したため、Energy を返還しました。通信状況を確認して再試行してください。');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleUnitReview = (unitId: string) => {
    startUnitReviewExam(unitId);
    router.push('/mock-exam/play');
  };

  const handleSubtopicDrill = (unitId: string, subtopicId: string) => {
    const params = new URLSearchParams({ unitId, subtopicId });
    router.push(`/workspace?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {COURSE_TABS.map((course) => (
            <button
              key={course}
              type="button"
              onClick={() => {
                setCourseFilter(course);
                setSelectedUnitId(null);
                setExpandedSubtopicId(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                courseFilter === course
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                  : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
              }`}
            >
              {course === 'all' ? 'すべて' : course}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={selectedUnitId ? 'パターン名・例題で検索...' : '単元名・パターン名で検索...'}
          className="w-full rounded-lg surface-input px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none dark:text-white sm:w-64"
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
              静的 {SOLUTION_PATTERNS.length} ＋発掘 {discovered.length} パターン（上限なし）
            </p>
            {UNIT_CATEGORIES.filter((category) => unitsInView.some((unit) => unit.category === category)).map(
              (category) => (
                <section key={category}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{category}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {unitsInView
                      .filter((unit) => unit.category === category)
                      .map((unit) => {
                        const patterns = getCatalogPatternsForUnit(unit.id, discovered);
                        const clearedCount = patterns.filter((pattern) => clearedSet.has(pattern.id)).length;
                        return (
                          <UnitBranchCard
                            key={unit.id}
                            unit={unit}
                            clearedCount={clearedCount}
                            totalCount={patterns.length}
                            onSelect={(unitId) => {
                              setSelectedUnitId(unitId);
                              setExpandedSubtopicId(null);
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
        ) : (
          <motion.div
            key={selectedUnitId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitId(null);
                  setExpandedSubtopicId(null);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-400/50 dark:border-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                単元一覧
              </button>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {selectedUnit?.category} / {selectedUnit?.title}
                </p>
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  サブトピックとパターン
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleUnitReview(selectedUnitId)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm font-semibold tracking-tight text-amber-800 transition-colors hover:bg-amber-400/20 dark:text-amber-100"
            >
              <Crown className="h-4 w-4" />
              この単元の総復習テスト（全範囲）
            </button>

            <div className="flex flex-col gap-2">
              {(selectedUnit?.subtopics ?? []).map((subtopic) => {
                const patterns = getCatalogPatternsForSubtopic(subtopic.id, discovered).filter((pattern) => {
                  const query = searchQuery.trim().toLowerCase();
                  const name = resolvePatternDisplayName(pattern, patternCustomNames[pattern.id]);
                  const matchesStar =
                    starFilter === 'all' || getPatternStarDifficulty(pattern) === starFilter;
                  const matchesQuery =
                    query.length === 0 ||
                    name.toLowerCase().includes(query) ||
                    pattern.exampleQuestion.toLowerCase().includes(query) ||
                    pattern.strategyText.toLowerCase().includes(query);
                  return matchesStar && matchesQuery;
                });
                const allPatterns = getCatalogPatternsForSubtopic(subtopic.id, discovered);
                const clearedCount = allPatterns.filter((pattern) => clearedSet.has(pattern.id)).length;
                const isExpanded = expandedSubtopicId === subtopic.id;

                return (
                  <div
                    key={subtopic.id}
                    className="overflow-hidden rounded-xl surface-panel"
                  >
                    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedSubtopicId(isExpanded ? null : subtopic.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {subtopic.title}
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </p>
                        <p className="text-xs text-slate-500">{subtopic.description}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {clearedCount}/{allPatterns.length} · ★{subtopic.difficulty}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubtopicDrill(selectedUnitId, subtopic.id)}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-100"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        このサブトピックを演習
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex flex-col gap-3 p-4">
                            <div className="flex flex-wrap gap-1.5">
                              {STAR_FILTERS.map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setStarFilter(star)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    starFilter === star
                                      ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300'
                                      : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
                                  }`}
                                >
                                  {star === 'all' ? 'すべて' : PATTERN_STAR_TYPE_LABELS[star]}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                void handleDiscoverPatterns(subtopic.id);
                              }}
                              disabled={isDiscovering}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold tracking-tight text-slate-800 transition-colors hover:border-slate-300 disabled:opacity-60 dark:border-slate-800 dark:bg-[#12141f] dark:text-slate-100"
                            >
                              {isDiscovering ? (
                                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                              )}
                              {isDiscovering ? '解析中...' : '新パターン解析 (-10 Energy)'}
                            </button>
                            {isDiscovering && (
                              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                                未攻略パターンを深層解析中...
                              </p>
                            )}
                            {discoverNotice && expandedSubtopicId === subtopic.id && (
                              <p className="text-center text-xs text-slate-500">{discoverNotice}</p>
                            )}

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              {patterns.map((pattern) => (
                                <PatternCard
                                  key={pattern.id}
                                  pattern={pattern}
                                  isCleared={clearedSet.has(pattern.id)}
                                  onToggleCleared={toggleClearedPattern}
                                />
                              ))}
                              {patterns.length === 0 && (
                                <p className="col-span-full py-6 text-center text-sm text-slate-500">
                                  条件に一致するパターンがありません。新パターン解析で追加できます。
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - Unit Selection Grid
// ==========================================
// 単元カード ➔ サブトピック一覧（ボスバトル＋縦スクロール）➔ 演習開始。

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Crown, Play, Search, Star } from 'lucide-react';

import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory, type UnitInfo } from '@/data/unitsData';
import { getSolutionPatternsBySubtopic, getSolutionPatternsByUnit } from '@/data/patternsData';
import { getUnitIcon } from '@/components/unit/unitIcons';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';
import { startUnitReviewExam } from '@/lib/engine/unitReview';
import type { SubtopicItem } from '@/types/mathLab';

const ALL_CATEGORIES_LABEL = 'すべて';
type CategoryFilter = UnitCategory | typeof ALL_CATEGORIES_LABEL;

export default function UnitSelectionGrid() {
  const router = useRouter();
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORIES_LABEL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const clearedSet = useMemo(() => new Set(clearedPatternIds), [clearedPatternIds]);
  const selectedUnit = UNITS_DATA.find((unit) => unit.id === selectedUnitId) ?? null;

  const filteredUnits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return UNITS_DATA.filter((unit) => {
      const matchesCategory = activeCategory === ALL_CATEGORIES_LABEL || unit.category === activeCategory;
      const matchesQuery =
        query.length === 0 ||
        unit.title.toLowerCase().includes(query) ||
        unit.description.toLowerCase().includes(query) ||
        unit.subtopics.some((subtopic) => subtopic.title.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleStartSubtopic = (unitId: string, subtopicId: string) => {
    const params = new URLSearchParams({ unitId, subtopicId });
    router.push(`/workspace?${params.toString()}`);
  };

  const handleBossBattle = (unitId: string) => {
    startUnitReviewExam(unitId);
    router.push('/mock-exam/play');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([ALL_CATEGORIES_LABEL, ...UNIT_CATEGORIES] as CategoryFilter[]).map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-300 text-slate-500 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="単元・サブトピックで検索..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedUnit ? (
          <motion.div
            key="units"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                clearedSet={clearedSet}
                onOpen={() => setSelectedUnitId(unit.id)}
              />
            ))}
            {filteredUnits.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-500">
                条件に一致する単元が見つかりませんでした。
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={selectedUnit.id}
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
                単元一覧へ戻る
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {selectedUnit.category} / {selectedUnit.title}
                </p>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  サブトピックを選ぶ
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBossBattle(selectedUnit.id)}
              className="relative overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-500/20 via-yellow-300/10 to-amber-600/20 p-5 text-left shadow-[0_0_24px_rgba(251,191,36,0.35)]"
            >
              <div className="pointer-events-none absolute inset-0 animate-pulse bg-amber-300/5" />
              <p className="relative flex items-center gap-2 text-sm font-black tracking-tight text-amber-200">
                <Crown className="h-5 w-5 text-amber-300" />
                🏆 この単元の総復習テスト（全サブトピック網羅）
              </p>
              <p className="relative mt-1 text-xs text-amber-100/80">
                ボスバトル: 全サブトピックから満遍なく5問。制限時間25分。
              </p>
            </button>

            <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
              {selectedUnit.subtopics.map((subtopic) => (
                <SubtopicCard
                  key={subtopic.id}
                  unitId={selectedUnit.id}
                  subtopic={subtopic}
                  clearedSet={clearedSet}
                  onStart={handleStartSubtopic}
                />
              ))}
              {selectedUnit.subtopics.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">サブトピックがまだありません。</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitCard({
  unit,
  clearedSet,
  onOpen,
}: {
  unit: UnitInfo;
  clearedSet: Set<string>;
  onOpen: () => void;
}) {
  const Icon = getUnitIcon(unit.iconName);
  const accent = SUBJECT_ACCENT[unit.subject];
  const patterns = getSolutionPatternsByUnit(unit.id);
  const clearedCount = patterns.filter((pattern) => clearedSet.has(pattern.id)).length;
  const totalCount = patterns.length;
  const progressPercent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border ${accent.border} bg-white/80 p-4 backdrop-blur-md transition-colors ${accent.borderHover} dark:bg-slate-900/60`}
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bgSoft} ${accent.text}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">
            {unit.recommendedGrade}
          </span>
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${accent.text}`}>{unit.category}</p>
        <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{unit.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{unit.description}</p>
        <p className="mt-2 text-[10px] text-slate-400">サブトピック {unit.subtopics.length} 本</p>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>攻略度</span>
          <span>{totalCount > 0 ? `${clearedCount}/${totalCount}パターン` : `全${unit.patternCount}パターン`}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full rounded-full ${accent.bg}`} style={{ width: `${progressPercent}%` }} />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className={`mt-3 w-full rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          サブトピックを見る
        </button>
      </div>
    </div>
  );
}

function SubtopicCard({
  unitId,
  subtopic,
  clearedSet,
  onStart,
}: {
  unitId: string;
  subtopic: SubtopicItem;
  clearedSet: Set<string>;
  onStart: (unitId: string, subtopicId: string) => void;
}) {
  const patterns = getSolutionPatternsBySubtopic(subtopic.id);
  const cleared = patterns.length > 0 && patterns.every((pattern) => clearedSet.has(pattern.id));
  const started = patterns.some((pattern) => clearedSet.has(pattern.id));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              cleared ? 'bg-emerald-400' : started ? 'bg-amber-400' : 'bg-slate-500'
            }`}
            title={cleared ? '攻略済み' : started ? '演習中' : '未演習'}
          />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{subtopic.title}</h3>
          <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={`h-3 w-3 ${index < subtopic.difficulty ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
              />
            ))}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">{subtopic.description}</p>
        <p className="mt-1 text-[10px] text-slate-400">
          {cleared ? '攻略済み' : started ? '演習中' : '未演習'} · パターン {patterns.length} 本
        </p>
      </div>
      <button
        type="button"
        onClick={() => onStart(unitId, subtopic.id)}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200"
      >
        <Play className="h-3.5 w-3.5" />
        演習を開始
      </button>
    </div>
  );
}

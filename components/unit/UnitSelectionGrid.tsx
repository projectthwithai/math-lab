'use client';

// ==========================================
// Apex Suite: Math Lab - Unit Selection Grid
// ==========================================
// 単元選択画面。科目タブ＋検索バー＋攻略度プログレスバー付き単元カード一覧。
// カードクリックで `/workspace?unitId=xxx` へ遷移する。

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { UNIT_CATEGORIES, UNITS_DATA, type UnitCategory } from '@/data/unitsData';
import { getSolutionPatternsByUnit } from '@/data/patternsData';
import { getUnitIcon } from '@/components/unit/unitIcons';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';
import { useUserStore } from '@/lib/store/userStore';

const ALL_CATEGORIES_LABEL = 'すべて';
type CategoryFilter = UnitCategory | typeof ALL_CATEGORIES_LABEL;

export default function UnitSelectionGrid() {
  const router = useRouter();
  const clearedPatternIds = useUserStore((state) => state.clearedPatternIds);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORIES_LABEL);
  const [searchQuery, setSearchQuery] = useState('');

  const clearedSet = useMemo(() => new Set(clearedPatternIds), [clearedPatternIds]);

  const filteredUnits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return UNITS_DATA.filter((unit) => {
      const matchesCategory = activeCategory === ALL_CATEGORIES_LABEL || unit.category === activeCategory;
      const matchesQuery =
        query.length === 0 ||
        unit.title.toLowerCase().includes(query) ||
        unit.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectUnit = (unitId: string) => {
    router.push(`/workspace?unitId=${encodeURIComponent(unitId)}`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 科目タブ + 検索バー */}
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
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
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
            placeholder="単元名で検索..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
        </div>
      </div>

      {/* 単元カード一覧 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUnits.map((unit) => {
          const Icon = getUnitIcon(unit.iconName);
          const accent = SUBJECT_ACCENT[unit.subject];
          const patterns = getSolutionPatternsByUnit(unit.id);
          const clearedCount = patterns.filter((pattern) => clearedSet.has(pattern.id)).length;
          const totalCount = patterns.length;
          const progressPercent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

          return (
            <div
              key={unit.id}
              className={`flex flex-col justify-between rounded-xl border ${accent.border} bg-slate-900/70 p-4 transition-all ${accent.borderHover} ${accent.shadowBase} ${accent.shadowHover}`}
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bgSoft} ${accent.text}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                    {unit.recommendedGrade}
                  </span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${accent.text}`}>{unit.category}</p>
                <h3 className="mt-0.5 text-sm font-bold text-white">{unit.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{unit.description}</p>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>攻略度</span>
                  <span>
                    {totalCount > 0 ? `${clearedCount}/${totalCount}パターン` : `全${unit.patternCount}パターン`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${accent.bg}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectUnit(unit.id)}
                  className={`mt-3 w-full rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
                >
                  この単元を解く
                </button>
              </div>
            </div>
          );
        })}

        {filteredUnits.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">
            条件に一致する単元が見つかりませんでした。
          </p>
        )}
      </div>
    </div>
  );
}

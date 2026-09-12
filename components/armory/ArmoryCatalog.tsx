'use client';

// ==========================================
// Apex Suite: Math Lab - 武器庫カタログ
// ==========================================
// 図鑑タブ内と /armory の両方から使う定理・公式一覧。

import { useMemo, useState } from 'react';
import type { Subject, WeaponItem } from '@/types/mathLab';
import { WEAPONS_DATA } from '@/data/weaponsData';
import WeaponCard from '@/components/armory/WeaponCard';
import WeaponDetailModal from '@/components/armory/WeaponDetailModal';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];

export default function ArmoryCatalog() {
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponItem | null>(null);

  const categoriesForSubject = useMemo(() => {
    const relevant =
      subjectFilter === 'all' ? WEAPONS_DATA : WEAPONS_DATA.filter((weapon) => weapon.subject === subjectFilter);
    return Array.from(new Set(relevant.map((weapon) => weapon.category)));
  }, [subjectFilter]);

  const filteredWeapons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return WEAPONS_DATA.filter((weapon) => {
      const matchesSubject = subjectFilter === 'all' || weapon.subject === subjectFilter;
      const matchesCategory = categoryFilter === 'all' || weapon.category === categoryFilter;
      const matchesQuery =
        query.length === 0 ||
        weapon.name.toLowerCase().includes(query) ||
        weapon.usageScenario.toLowerCase().includes(query);
      return matchesSubject && matchesCategory && matchesQuery;
    });
  }, [subjectFilter, categoryFilter, searchQuery]);

  return (
    <div>
      <p className="mb-6 text-sm text-slate-500">
        収録数: {WEAPONS_DATA.length}種類（全て解放済み）。クリックすると使いどころ・発動条件・成り立ちが見られます。
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {SUBJECT_FILTERS.map((subject) => (
          <button
            key={subject}
            type="button"
            onClick={() => {
              setSubjectFilter(subject);
              setCategoryFilter('all');
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              subjectFilter === subject
                ? 'border-violet-400/60 bg-violet-400/10 text-violet-300'
                : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
            }`}
          >
            {subject === 'all' ? '全科目' : SUBJECT_LABEL[subject]}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              categoryFilter === 'all'
                ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
            }`}
          >
            すべての分野
          </button>
          {categoriesForSubject.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                categoryFilter === category
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                  : 'border-slate-300 text-slate-400 hover:border-slate-500 dark:border-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="公式名で検索..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-64"
        />
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3">
        {filteredWeapons.map((weapon) => (
          <WeaponCard key={weapon.id} weapon={weapon} onClick={() => setSelectedWeapon(weapon)} />
        ))}
        {filteredWeapons.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">
            条件に一致する公式が見つかりませんでした。
          </p>
        )}
      </div>

      {selectedWeapon && (
        <WeaponDetailModal weapon={selectedWeapon} onClose={() => setSelectedWeapon(null)} />
      )}
    </div>
  );
}

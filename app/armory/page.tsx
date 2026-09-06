'use client';

// ==========================================
// Apex Suite: Math Lab - 武器庫（定理・公式図鑑）
// ==========================================
// 科目タブ・分野フィルター・キーワード検索。全カード解放済み、
// クリックで詳細モーダル（使いどころ・発動条件・成り立ち）を表示する。

import { useMemo, useState } from 'react';
import type { Subject, WeaponItem } from '@/types/mathLab';
import { WEAPONS_DATA } from '@/data/weaponsData';
import WeaponCard from '@/components/armory/WeaponCard';
import WeaponDetailModal from '@/components/armory/WeaponDetailModal';

const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', chemistry: '化学' };
const SUBJECT_FILTERS: Array<Subject | 'all'> = ['all', 'math', 'physics', 'chemistry'];

export default function ArmoryPage() {
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponItem | null>(null);

  const categoriesForSubject = useMemo(() => {
    const relevant =
      subjectFilter === 'all' ? WEAPONS_DATA : WEAPONS_DATA.filter((w) => w.subject === subjectFilter);
    return Array.from(new Set(relevant.map((w) => w.category)));
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-white">🗡️ 武器庫</h1>
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
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
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
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
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
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
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
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none sm:w-64"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
  );
}

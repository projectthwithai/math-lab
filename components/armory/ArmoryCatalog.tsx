'use client';

// ==========================================
// Apex Suite: Math Lab - 武器庫カタログ
// ==========================================
// 数I〜数C / 物理 / 化学のタブで絞り込む、静かな公式一覧。

import { useMemo, useState } from 'react';
import type { WeaponItem } from '@/types/mathLab';
import { UNIT_CATEGORIES, type UnitCategory } from '@/data/unitsData';
import { WEAPONS_DATA } from '@/data/weaponsData';
import WeaponCard from '@/components/armory/WeaponCard';
import WeaponDetailModal from '@/components/armory/WeaponDetailModal';
import { useUserStore } from '@/lib/store/userStore';

function weaponCourse(weapon: WeaponItem): UnitCategory {
  if (weapon.subject === 'physics') return '物理';
  if (weapon.subject === 'chemistry') return '化学';
  const match = UNIT_CATEGORIES.find((course) => weapon.category === course || weapon.category.startsWith(`${course}・`));
  return match ?? '数I';
}

export default function ArmoryCatalog() {
  const [course, setCourse] = useState<UnitCategory>('数I');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponItem | null>(null);
  const masteredWeaponIds = useUserStore((state) => state.masteredWeaponIds);
  const masteredSet = useMemo(() => new Set(masteredWeaponIds), [masteredWeaponIds]);

  const filteredWeapons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return WEAPONS_DATA.filter((weapon) => {
      if (weaponCourse(weapon) !== course) return false;
      if (query.length === 0) return true;
      return (
        weapon.name.toLowerCase().includes(query) ||
        weapon.usageScenario.toLowerCase().includes(query)
      );
    });
  }, [course, searchQuery]);

  return (
    <div>
      <p className="mb-6 text-sm text-zinc-500">
        {filteredWeapons.length}件 · {course}
      </p>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-800 pb-px scrollbar-none">
        {UNIT_CATEGORIES.map((item) => {
          const active = course === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCourse(item)}
              className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm tracking-wide transition ${
                active
                  ? 'border-cyan-400 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>

      <div className="mb-5">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="公式名で探す"
          className="w-full rounded-xl surface-input px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none sm:max-w-xs"
        />
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3">
        {filteredWeapons.map((weapon) => (
          <WeaponCard
            key={weapon.id}
            weapon={weapon}
            mastered={masteredSet.has(weapon.id)}
            onClick={() => setSelectedWeapon(weapon)}
          />
        ))}
        {filteredWeapons.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-zinc-500">
            この分野に一致する公式はありません。
          </p>
        )}
      </div>

      {selectedWeapon && (
        <WeaponDetailModal weapon={selectedWeapon} onClose={() => setSelectedWeapon(null)} />
      )}
    </div>
  );
}

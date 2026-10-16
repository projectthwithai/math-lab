'use client';

// ==========================================
// Apex Suite: Math Lab - 模試セットアップ
// ==========================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

import { UNITS_DATA, UNIT_CATEGORIES, getUnitsBySubject, type UnitCategory } from '@/data/unitsData';
import type { Subject } from '@/types/mathLab';
import { DIFFICULTY_STAR_META } from '@/lib/engine/difficultyScale';
import {
  MOCK_EXAM_DEFAULTS,
  saveMockExamConfig,
  type MockExamDifficultyPreset,
  type MockExamStyle,
} from '@/lib/engine/mockExam';

const DIFFICULTY_OPTIONS = DIFFICULTY_STAR_META.map((meta) => ({
  id: meta.value as MockExamDifficultyPreset,
  label: `${meta.starLabel} ${meta.label}`,
  hint: meta.hint,
}));

const TIME_OPTIONS = [30, 60, 90];
const COUNT_OPTIONS = [3, 5, 10];
const STYLE_OPTIONS: Array<{ id: MockExamStyle; label: string }> = [
  { id: 'common_test', label: '共通テスト型（誘導・選択）' },
  { id: 'descriptive', label: '記述・数値入力型' },
  { id: 'mixed', label: '混合' },
];

const SUBJECT_LABEL: Record<Subject, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

export default function MockExamSetup() {
  const router = useRouter();
  const mathIds = useMemo(() => getUnitsBySubject('math').map((unit) => unit.id), []);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(mathIds);
  const [difficulty, setDifficulty] = useState<MockExamDifficultyPreset>(MOCK_EXAM_DEFAULTS.difficulty);
  const [minutes, setMinutes] = useState(MOCK_EXAM_DEFAULTS.minutes);
  const [questionCount, setQuestionCount] = useState(MOCK_EXAM_DEFAULTS.questionCount);
  const [style, setStyle] = useState<MockExamStyle>(MOCK_EXAM_DEFAULTS.style);

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId]
    );
  };

  const selectCategoryAll = (category: UnitCategory) => {
    const ids = UNITS_DATA.filter((unit) => unit.category === category).map((unit) => unit.id);
    setSelectedUnitIds((current) => [...new Set([...current, ...ids])]);
  };

  const clearCategory = (category: UnitCategory) => {
    const ids = new Set(UNITS_DATA.filter((unit) => unit.category === category).map((unit) => unit.id));
    setSelectedUnitIds((current) => current.filter((id) => !ids.has(id)));
  };

  const selectSubject = (subject: Subject) => {
    const ids = getUnitsBySubject(subject).map((unit) => unit.id);
    setSelectedUnitIds((current) => [...new Set([...current, ...ids])]);
  };

  const clearSubject = (subject: Subject) => {
    const ids = new Set(getUnitsBySubject(subject).map((unit) => unit.id));
    setSelectedUnitIds((current) => current.filter((id) => !ids.has(id)));
  };

  const handleStart = () => {
    if (selectedUnitIds.length === 0) return;
    saveMockExamConfig({
      unitIds: selectedUnitIds,
      difficulty,
      minutes,
      questionCount,
      style,
    });
    router.push('/mock-exam/play');
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl surface-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">単元選択</h2>
          <div className="flex flex-wrap gap-2">
            {(['math', 'physics', 'chemistry'] as Subject[]).map((subject) => (
              <div key={subject} className="inline-flex overflow-hidden rounded-xl surface-card">
                <button
                  type="button"
                  onClick={() => selectSubject(subject)}
                  className="min-h-11 px-3 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40"
                >
                  {SUBJECT_LABEL[subject]} 全選択
                </button>
                <button
                  type="button"
                  onClick={() => clearSubject(subject)}
                  className="min-h-11 border-l border-zinc-800 px-3 text-xs font-semibold text-zinc-500 hover:bg-zinc-900"
                >
                  全解除
                </button>
              </div>
            ))}
          </div>
        </div>
        <p className="mb-4 text-xs text-zinc-500">単元をタップして範囲に含めます。</p>
        <div className="flex flex-col gap-6">
          {UNIT_CATEGORIES.map((category: UnitCategory) => {
            const units = UNITS_DATA.filter((unit) => unit.category === category);
            const selectedInCategory = units.filter((unit) => selectedUnitIds.includes(unit.id)).length;
            return (
              <div key={category}>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-zinc-400">
                    {category}
                    <span className="ml-2 text-zinc-600">
                      {selectedInCategory}/{units.length}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectCategoryAll(category)}
                      className="text-[11px] font-semibold text-cyan-400/90 hover:text-cyan-300"
                    >
                      全選択
                    </button>
                    <button
                      type="button"
                      onClick={() => clearCategory(category)}
                      className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300"
                    >
                      全解除
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {units.map((unit) => {
                    const checked = selectedUnitIds.includes(unit.id);
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleUnit(unit.id)}
                        className={`min-h-14 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium tracking-tight transition ${
                          checked
                            ? 'border-cyan-500 bg-cyan-950/30 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.28)]'
                            : 'border-zinc-700/60 bg-[#12141f] text-zinc-400 shadow-lg shadow-black/40 hover:border-zinc-600 hover:text-zinc-200'
                        }`}
                      >
                        {unit.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl surface-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">設定</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-[11px] font-bold text-slate-500">難易度</legend>
            <div className="flex flex-col gap-1.5">
              {DIFFICULTY_OPTIONS.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="difficulty"
                    checked={difficulty === option.id}
                    onChange={() => setDifficulty(option.id)}
                    className="accent-cyan-400"
                  />
                  {option.label}
                  <span className="text-slate-400">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[11px] font-bold text-slate-500">制限時間</legend>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMinutes(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    minutes === value
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {value}分
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-[11px] font-bold text-slate-500">問題数</p>
            <div className="flex flex-wrap gap-2">
              {COUNT_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuestionCount(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    questionCount === value
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {value}問
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-[11px] font-bold text-slate-500">スタイル</p>
            <div className="flex flex-col gap-1.5">
              {STYLE_OPTIONS.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="style"
                    checked={style === option.id}
                    onChange={() => setStyle(option.id)}
                    className="accent-cyan-400"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        disabled={selectedUnitIds.length === 0}
        className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/15 py-4 text-sm font-medium tracking-tight text-cyan-200 transition-colors hover:bg-cyan-400/25 disabled:opacity-40"
      >
        <Rocket className="h-5 w-5" />
        模試をスタートする ({minutes}分/{questionCount}問)
      </motion.button>
    </div>
  );
}

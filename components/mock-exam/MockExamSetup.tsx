'use client';

// ==========================================
// Apex Suite: Math Lab - 模試セットアップ
// ==========================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket, CheckSquare } from 'lucide-react';

import { UNITS_DATA, UNIT_CATEGORIES, getUnitsBySubject, type UnitCategory } from '@/data/unitsData';
import type { Subject } from '@/types/mathLab';
import {
  MOCK_EXAM_DEFAULTS,
  saveMockExamConfig,
  type MockExamDifficultyPreset,
  type MockExamStyle,
} from '@/lib/engine/mockExam';

const DIFFICULTY_OPTIONS: Array<{ id: MockExamDifficultyPreset; label: string; hint: string }> = [
  { id: 'basic', label: '基礎（教科書）', hint: '★3' },
  { id: 'standard', label: '標準（共通テストレベル）', hint: '★5' },
  { id: 'advanced', label: '応用（二次・私大）', hint: '★7' },
  { id: 'hard', label: '難関（最難関）', hint: '★9' },
];

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

  const selectSubject = (subject: Subject) => {
    const ids = getUnitsBySubject(subject).map((unit) => unit.id);
    setSelectedUnitIds(ids);
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
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckSquare className="h-4 w-4 text-cyan-400" />
            単元選択
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(['math', 'physics', 'chemistry'] as Subject[]).map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => selectSubject(subject)}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-cyan-400/50 dark:border-slate-700 dark:text-slate-300"
              >
                {SUBJECT_LABEL[subject]}全範囲
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedUnitIds(UNITS_DATA.map((unit) => unit.id))}
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300"
            >
              全教科
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-500">数学・物理・化学の全範囲、または特定単元をチェックしてください。</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {UNIT_CATEGORIES.map((category: UnitCategory) => {
            const units = UNITS_DATA.filter((unit) => unit.category === category);
            return (
              <div key={category} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="mb-2 text-[11px] font-bold tracking-wide text-slate-500">{category}</p>
                <div className="flex flex-col gap-1.5">
                  {units.map((unit) => {
                    const checked = selectedUnitIds.includes(unit.id);
                    return (
                      <label key={unit.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUnit(unit.id)}
                          className="h-3.5 w-3.5 accent-cyan-400"
                        />
                        {unit.title}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
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
        className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/15 py-4 text-sm font-bold text-cyan-200 transition-colors hover:bg-cyan-400/25 disabled:opacity-40"
      >
        <Rocket className="h-5 w-5" />
        模試をスタートする ({minutes}分/{questionCount}問)
      </motion.button>
    </div>
  );
}

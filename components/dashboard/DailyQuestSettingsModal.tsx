'use client';

// ==========================================
// Math Lab - Daily Quest Settings Modal
// ==========================================
// 全画面フルスクリーンで、クエスト総数と各クエストの教科・単元・難易度を編集する。

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';

import type { CustomDailyQuest, Subject } from '@/types/mathLab';
import { UNIT_CATEGORIES, UNITS_DATA } from '@/data/unitsData';
import {
  MAX_DAILY_QUEST_COUNT,
  MIN_DAILY_QUEST_COUNT,
  SUBJECT_LABEL,
  buildQuestTitle,
  normalizeDailyQuests,
} from '@/data/dailyQuests';
import { DIFFICULTY_STAR_META, clampDifficulty, formatStarDifficulty } from '@/lib/engine/difficultyScale';

interface DailyQuestSettingsModalProps {
  questCount: number;
  quests: CustomDailyQuest[];
  onClose: () => void;
  onSave: (questCount: number, quests: CustomDailyQuest[]) => void;
}

const SUBJECTS: Subject[] = ['math', 'physics', 'chemistry'];

const SUBJECT_CHIP: Record<Subject, string> = {
  math: 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200',
  physics: 'border-violet-400/50 bg-violet-400/15 text-violet-200',
  chemistry: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200',
};

export default function DailyQuestSettingsModal({
  questCount,
  quests,
  onClose,
  onSave,
}: DailyQuestSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(questCount);
  const [drafts, setDrafts] = useState<CustomDailyQuest[]>(() => normalizeDailyQuests(quests, questCount));
  const [openQuestNumber, setOpenQuestNumber] = useState(1);

  const visibleQuests = useMemo(() => normalizeDailyQuests(drafts, count), [drafts, count]);

  useEffect(() => {
    setMounted(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const updateQuest = (questNumber: number, patch: Partial<CustomDailyQuest>) => {
    setDrafts((current) =>
      normalizeDailyQuests(current, MAX_DAILY_QUEST_COUNT).map((quest) => {
        if (quest.questNumber !== questNumber) return quest;
        const next = { ...quest, ...patch };
        if (!patch.title) next.title = buildQuestTitle(next);
        return next;
      })
    );
  };

  const toggleSubject = (quest: CustomDailyQuest, subject: Subject) => {
    const subjects = quest.subjects.includes(subject)
      ? quest.subjects.filter((item) => item !== subject)
      : [...quest.subjects, subject];
    const allowed = new Set(
      UNITS_DATA.filter((unit) => subjects.includes(unit.subject)).map((unit) => unit.id)
    );
    const unitIds = quest.unitIds.filter((id) => allowed.has(id));
    updateQuest(quest.questNumber, { subjects, unitIds });
  };

  const toggleUnit = (quest: CustomDailyQuest, unitId: string) => {
    const unitIds = quest.unitIds.includes(unitId)
      ? quest.unitIds.filter((id) => id !== unitId)
      : [...quest.unitIds, unitId];
    updateQuest(quest.questNumber, { unitIds });
  };

  const handleDiscard = () => {
    setCount(questCount);
    setDrafts(normalizeDailyQuests(quests, questCount));
    onClose();
  };

  const handleSave = () => {
    onSave(count, visibleQuests);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col p-6 md:p-10">
        <button
          type="button"
          onClick={handleDiscard}
          className="absolute right-6 top-6 rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white md:right-10 md:top-10"
          aria-label="保存せずに閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="pr-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
             デイリークエストを編集
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            クエストは「問題を解く」のみ。Energy報酬は1日最大3回まで受け取れます。
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <p className="text-base font-semibold text-white">クエスト総数</p>
            <span className="text-2xl font-bold text-cyan-300">{count}問</span>
          </div>
          <input
            type="range"
            min={MIN_DAILY_QUEST_COUNT}
            max={MAX_DAILY_QUEST_COUNT}
            value={count}
            onChange={(event) => {
              const nextCount = Number(event.target.value);
              setCount(nextCount);
              if (openQuestNumber > nextCount) setOpenQuestNumber(1);
            }}
            className="w-full accent-cyan-400"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: MAX_DAILY_QUEST_COUNT - MIN_DAILY_QUEST_COUNT + 1 }, (_, index) => {
              const value = MIN_DAILY_QUEST_COUNT + index;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setCount(value);
                    if (openQuestNumber > value) setOpenQuestNumber(1);
                  }}
                  className={`min-w-11 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    count === value
                      ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </section>

        <ol className="mt-8 flex flex-1 flex-col gap-4">
          {visibleQuests.map((quest) => {
            const isOpen = openQuestNumber === quest.questNumber;
            const unitPool = UNITS_DATA.filter(
              (unit) => quest.subjects.length === 0 || quest.subjects.includes(unit.subject)
            );
            return (
              <li
                key={quest.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
              >
                <button
                  type="button"
                  onClick={() => setOpenQuestNumber(isOpen ? 0 : quest.questNumber)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8"
                  aria-expanded={isOpen}
                >
                  <span>
                    <span className="block text-lg font-semibold text-white">
                      クエスト {String(quest.questNumber).padStart(2, '0')}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {quest.subjects.map((subject) => SUBJECT_LABEL[subject]).join('・') || '教科未選択'}
                      {' / '}
                      {formatStarDifficulty(quest.difficulty)}
                      {' / '}
                      単元 {quest.unitIds.length}件
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-8 border-t border-slate-800 px-6 py-6 md:px-8 md:py-8">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">教科</p>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {SUBJECTS.map((subject) => {
                              const checked = quest.subjects.includes(subject);
                              return (
                                <label
                                  key={subject}
                                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                    checked
                                      ? SUBJECT_CHIP[subject]
                                      : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-500'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSubject(quest, subject)}
                                    className="h-4 w-4 accent-cyan-400"
                                  />
                                  {SUBJECT_LABEL[subject]}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            単元（複数選択・ランダム出題）
                          </p>
                          <div className="mt-3 space-y-6">
                            {UNIT_CATEGORIES.map((category) => {
                              const units = unitPool.filter((unit) => unit.category === category);
                              if (units.length === 0) return null;
                              return (
                                <div key={category}>
                                  <p className="mb-3 text-sm font-bold text-slate-300">{category}</p>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {units.map((unit) => {
                                      const checked = quest.unitIds.includes(unit.id);
                                      return (
                                        <label
                                          key={unit.id}
                                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-snug transition ${
                                            checked
                                              ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                                              : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-600'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleUnit(quest, unit.id)}
                                            className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-400"
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
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">難易度</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {DIFFICULTY_STAR_META.map((meta) => (
                              <button
                                key={meta.value}
                                type="button"
                                title={meta.hint}
                                onClick={() =>
                                  updateQuest(quest.questNumber, { difficulty: clampDifficulty(meta.value) })
                                }
                                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                  quest.difficulty === meta.value
                                    ? 'border-amber-400/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.18)]'
                                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                }`}
                              >
                                {meta.starLabel}
                                <span className="mt-1 block text-xs font-medium opacity-80">{meta.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>

        <div className="sticky bottom-0 mt-10 grid grid-cols-2 gap-3 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 py-4 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            ✕ 保存せずに閉じる
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/15 py-4 text-sm font-bold text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.35)] transition hover:bg-cyan-400/25"
          >
            <Check className="h-4 w-4" />
            ✓ 設定を保存して閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

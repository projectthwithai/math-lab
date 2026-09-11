'use client';

// ==========================================
// Apex Suite: Math Lab - Daily Quest Settings Modal
// ==========================================
// クエスト総数（3〜10）と、各クエストの教科・単元・難易度（★1〜★5）を編集する。

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

import type { CustomDailyQuest, Subject } from '@/types/mathLab';
import { UNIT_CATEGORIES, UNITS_DATA } from '@/data/unitsData';
import {
  MAX_DAILY_QUEST_COUNT,
  MIN_DAILY_QUEST_COUNT,
  SUBJECT_LABEL,
  buildQuestTitle,
  normalizeDailyQuests,
} from '@/data/dailyQuests';
import { DIFFICULTY_STAR_META, clampDifficulty } from '@/lib/engine/difficultyScale';

interface DailyQuestSettingsModalProps {
  questCount: number;
  quests: CustomDailyQuest[];
  onClose: () => void;
  onSave: (questCount: number, quests: CustomDailyQuest[]) => void;
}

const SUBJECTS: Subject[] = ['math', 'physics', 'chemistry'];

export default function DailyQuestSettingsModal({
  questCount,
  quests,
  onClose,
  onSave,
}: DailyQuestSettingsModalProps) {
  const [count, setCount] = useState(questCount);
  const [drafts, setDrafts] = useState<CustomDailyQuest[]>(() => normalizeDailyQuests(quests, questCount));

  const visibleQuests = useMemo(() => normalizeDailyQuests(drafts, count), [drafts, count]);

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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <button
          type="button"
          onClick={handleDiscard}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
          aria-label="保存せずに閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-6">

        <h2 className="pr-10 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          ⚙️ デイリークエストを編集
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          クエストは「問題を解く」のみ。Energy報酬は1日最大3回まで受け取れます。
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">クエスト総数</p>
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-300">{count}問</span>
          </div>
          <input
            type="range"
            min={MIN_DAILY_QUEST_COUNT}
            max={MAX_DAILY_QUEST_COUNT}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: MAX_DAILY_QUEST_COUNT - MIN_DAILY_QUEST_COUNT + 1 }, (_, index) => {
              const value = MIN_DAILY_QUEST_COUNT + index;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCount(value)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    count === value
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <ol className="mt-4 flex flex-col gap-3">
          {visibleQuests.map((quest) => {
            const unitPool = UNITS_DATA.filter(
              (unit) => quest.subjects.length === 0 || quest.subjects.includes(unit.subject)
            );
            return (
              <li
                key={quest.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {String(quest.questNumber).padStart(2, '0')}. {quest.title}
                </p>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">教科</p>
                <div className="mt-1.5 flex flex-wrap gap-3">
                  {SUBJECTS.map((subject) => (
                    <label key={subject} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={quest.subjects.includes(subject)}
                        onChange={() => toggleSubject(quest, subject)}
                        className="h-3.5 w-3.5 accent-cyan-400"
                      />
                      {SUBJECT_LABEL[subject]}
                    </label>
                  ))}
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">単元（複数選択・ランダム出題）</p>
                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                  {UNIT_CATEGORIES.map((category) => {
                    const units = unitPool.filter((unit) => unit.category === category);
                    if (units.length === 0) return null;
                    return (
                      <div key={category} className="mb-2 last:mb-0">
                        <p className="mb-1 text-[10px] font-bold text-slate-400">{category}</p>
                        <div className="flex flex-col gap-1">
                          {units.map((unit) => (
                            <label key={unit.id} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                              <input
                                type="checkbox"
                                checked={quest.unitIds.includes(unit.id)}
                                onChange={() => toggleUnit(quest, unit.id)}
                                className="h-3.5 w-3.5 accent-cyan-400"
                              />
                              {unit.title}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">難易度</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DIFFICULTY_STAR_META.map((meta) => (
                    <button
                      key={meta.value}
                      type="button"
                      title={meta.hint}
                      onClick={() => updateQuest(quest.questNumber, { difficulty: clampDifficulty(meta.value) })}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        quest.difficulty === meta.value
                          ? 'border-amber-400/60 bg-amber-400/15 text-amber-800 dark:text-amber-200'
                          : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {meta.starLabel} {meta.label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>

        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-2 sm:p-5">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            保存せずに閉じる
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-400/15 py-3 text-sm font-bold text-cyan-800 shadow-[0_0_28px_rgba(34,211,238,0.28)] transition hover:bg-cyan-400/25 dark:text-cyan-100"
          >
            <Check className="h-4 w-4" />
            設定を保存して閉じる
          </button>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - Daily Mission Widget
// ==========================================
// ホームのデイリークエスト。設定した教科・単元・★1〜★5でワークスペースへ直行する。

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Gift, Sparkles, Target, Zap } from 'lucide-react';

import { useDailyQuestStore } from '@/lib/store/dailyQuestStore';
import {
  MAX_DAILY_QUEST_REWARDS_PER_DAY,
  SUBJECT_LABEL,
  buildQuestWorkspaceHref,
} from '@/data/dailyQuests';
import { formatStarDifficulty } from '@/lib/engine/difficultyScale';
import { getUnitById } from '@/data/unitsData';
import { DAILY_QUEST_ENERGY_REWARD } from '@/lib/engine/energyCosts';
import DailyQuestSettingsModal from './DailyQuestSettingsModal';

export default function DailyMissionWidget() {
  const hasHydrated = useDailyQuestStore((state) => state.hasHydrated);
  const quests = useDailyQuestStore((state) => state.quests);
  const rewardsClaimedToday = useDailyQuestStore((state) => state.rewardsClaimedToday);
  const claimQuest = useDailyQuestStore((state) => state.claimQuest);
  const saveQuestSettings = useDailyQuestStore((state) => state.saveQuestSettings);
  const ensureToday = useDailyQuestStore((state) => state.ensureToday);
  const questCount = useDailyQuestStore((state) => state.questCount);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flash, setFlash] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (hasHydrated) ensureToday();
  }, [hasHydrated, ensureToday]);

  const completedCount = quests.filter((quest) => quest.isCompleted).length;
  const canClaimMore = rewardsClaimedToday < MAX_DAILY_QUEST_REWARDS_PER_DAY;

  const handleClaim = (id: string) => {
    const result = claimQuest(id);
    if (!result) return;
    setFlash({ id, label: `Energy +${result.energyAmount}` });
    window.setTimeout(() => setFlash(null), 2200);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:p-7">
      <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Daily Quest</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            <Target className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            本日のデイリークエスト
            <span className="text-lg font-medium text-slate-400">
              ({completedCount}/{quests.length})
            </span>
          </h2>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
            <Zap className="h-3.5 w-3.5" />
             本日のエネルギー報酬受取枠: {rewardsClaimedToday}/{MAX_DAILY_QUEST_REWARDS_PER_DAY}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-400/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          ⚙️ クエストを編集
        </button>
      </div>

      <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const canClaim = quest.isCompleted && !quest.isRewardClaimed && canClaimMore;
          const unitSummary = quest.unitIds
            .map((id) => getUnitById(id)?.title)
            .filter(Boolean)
            .slice(0, 2)
            .join(' / ');

          return (
            <li
              key={quest.id}
              className={`group relative flex flex-col rounded-xl border p-4 backdrop-blur-md transition-colors ${
                quest.isRewardClaimed
                  ? 'border-emerald-400/30 bg-emerald-50/70 dark:bg-emerald-400/5'
                  : quest.isCompleted
                    ? 'border-slate-300 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70'
                    : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40'
              }`}
            >
            {!quest.isCompleted ? (
              <Link href={buildQuestWorkspaceHref(quest)} className="flex h-full flex-col">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                    {String(quest.questNumber).padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                    {formatStarDifficulty(quest.difficulty)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{quest.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {quest.subjects.map((subject) => SUBJECT_LABEL[subject]).join('・') || '理数'}
                  {unitSummary ? ` ／ ${unitSummary}${quest.unitIds.length > 2 ? ' 他' : ''}` : ''}
                </p>
                <span className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 transition-colors group-hover:border-cyan-400/60 group-hover:text-cyan-700 dark:border-slate-600 dark:text-slate-300">
                  問題を解く（0 Energy）
                </span>
              </Link>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                    {String(quest.questNumber).padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                    {formatStarDifficulty(quest.difficulty)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{quest.title}</h3>
                <p className="mt-1 flex-1 text-xs text-slate-500">
                  {quest.subjects.map((subject) => SUBJECT_LABEL[subject]).join('・') || '理数'}
                  {unitSummary ? ` ／ ${unitSummary}${quest.unitIds.length > 2 ? ' 他' : ''}` : ''}
                </p>
                <div className="mt-4">
                  {quest.isRewardClaimed ? (
                    <p className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      報酬受け取り済み
                    </p>
                  ) : canClaim ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(quest.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-950"
                    >
                      <Gift className="h-3.5 w-3.5" />
                      報酬を受け取る（Energy +{DAILY_QUEST_ENERGY_REWARD}）
                    </button>
                  ) : (
                    <p className="rounded-lg border border-slate-300 py-2 text-center text-[11px] font-semibold text-slate-500 dark:border-slate-700">
                      本日の報酬枠は使い切りました
                    </p>
                  )}
                </div>
              </>
            )}

              <AnimatePresence>
                {flash?.id === quest.id && (
                  <motion.p
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute inset-x-3 top-2 z-10 flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-tight text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {flash.label} 獲得！
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {settingsOpen && (
        <DailyQuestSettingsModal
          questCount={questCount}
          quests={quests}
          onClose={() => setSettingsOpen(false)}
          onSave={(nextCount, nextQuests) => saveQuestSettings(nextCount, nextQuests)}
        />
      )}
    </section>
  );
}

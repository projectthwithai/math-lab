'use client';

// ==========================================
// Apex Suite: Math Lab - 武器マスター試練（成り立ち4択）
// ==========================================
// API コスト 0。静的プリセットをその場で出題し、正解で MASTERED にする。

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Swords, XCircle } from 'lucide-react';

import type { WeaponItem } from '@/types/mathLab';
import KaTeXText from '@/components/workspace/KaTeXText';
import { useUserStore } from '@/lib/store/userStore';

interface WeaponMasteryQuizProps {
  weapon: WeaponItem;
}

const CHOICE_MARKS = ['①', '②', '③', '④'];

function FanfareBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        const distance = 70 + (i % 4) * 28;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-amber-300"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 1.05, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export default function WeaponMasteryQuiz({ weapon }: WeaponMasteryQuizProps) {
  const challenge = weapon.masteryChallenge;
  const isMastered = useUserStore((state) => state.masteredWeaponIds.includes(weapon.id));
  const markWeaponMastered = useUserStore((state) => state.markWeaponMastered);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [fanfare, setFanfare] = useState(false);

  if (!challenge || challenge.choices.length < 2) return null;

  const handleJudge = () => {
    if (selected == null || result === 'correct') return;
    const ok = selected === challenge.correctAnswerIndex;
    if (!ok) {
      setResult('wrong');
      return;
    }
    setResult('correct');
    markWeaponMastered(weapon.id);
    setFanfare(true);
    window.setTimeout(() => setFanfare(false), 1400);
  };

  const handleRetry = () => {
    setSelected(null);
    setResult(null);
  };

  return (
    <section className="relative mt-5 overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-slate-950/40 to-cyan-400/10 p-4">
      <AnimatePresence>{fanfare && <FanfareBurst />}</AnimatePresence>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-amber-200">
          <Swords className="h-4 w-4 text-amber-300" />
          武器マスター試練
        </h3>
        {isMastered && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-400/20 px-2 py-0.5 text-[10px] font-black tracking-wide text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.45)]">
            💎 MASTERED
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        公式の成り立ち・本質を静的4択で確認します。Energy は使いません。
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/15 px-3 py-2.5 text-xs font-bold text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.25)] transition hover:shadow-[0_0_22px_rgba(34,211,238,0.3)]"
        >
          <Swords className="h-3.5 w-3.5" />
          ⚔️ この武器の成り立ち試練に挑む (0 Energy)
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-slate-100">
            <KaTeXText text={challenge.questionText} />
          </p>
          <div className="flex flex-col gap-2">
            {challenge.choices.map((choice, index) => {
              const active = selected === index;
              const showCorrect = result === 'correct' && index === challenge.correctAnswerIndex;
              const showWrong = result === 'wrong' && active;
              return (
                <button
                  key={`${weapon.id}-choice-${index}`}
                  type="button"
                  disabled={result === 'correct'}
                  onClick={() => {
                    setSelected(index);
                    setResult(null);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    showCorrect
                      ? 'border-amber-300/80 bg-amber-400/20 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.4)]'
                      : showWrong
                        ? 'border-red-400/70 bg-red-400/10 text-red-100'
                        : active
                          ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-100'
                          : 'border-slate-700 bg-slate-950/70 text-slate-200 hover:border-amber-400/40'
                  }`}
                >
                  <span className="mr-2 text-[11px] font-bold text-slate-500">{CHOICE_MARKS[index] ?? `${index + 1}.`}</span>
                  <KaTeXText text={choice} />
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleJudge}
              disabled={selected == null || result === 'correct'}
              className="flex-1 rounded-xl border border-cyan-400/50 bg-cyan-400/15 py-2 text-xs font-bold text-cyan-100 disabled:opacity-40"
            >
              {result === 'correct' ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  正解
                </span>
              ) : (
                '判定する'
              )}
            </button>
            {result === 'wrong' && (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl border border-slate-600 px-3 py-2 text-xs text-slate-300"
              >
                やり直す
              </button>
            )}
          </div>

          <AnimatePresence>
            {result === 'wrong' && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                ちがう。導出の「なぜ」をもう一度たどろう。
              </motion.p>
            )}
            {result === 'correct' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-amber-300/40 bg-amber-400/10 p-3"
              >
                <p className="text-sm font-black tracking-tight text-amber-200">🎉 成り立ちをマスターした！</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  <KaTeXText text={challenge.explanation} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

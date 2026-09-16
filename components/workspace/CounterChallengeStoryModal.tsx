'use client';

// ==========================================
// Apex Suite: Math Lab - 反例克服ストーリーモード
// ==========================================
// インスタストーリー風のフルスクリーン連続出題。
// 正解で次の反例へ進み、生成パターンは図鑑へ「⚠️ 罠パターン」登録。
// 全問クリア後に祝賀演出を出して、元の採点モーダルへ状態を保ったまま復帰する。

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import KaTeXText from '@/components/workspace/KaTeXText';
import LaTeXKeypad from '@/components/workspace/LaTeXKeypad';
import { requestCounterProblems } from '@/lib/api/generateCounterProblemsClient';
import { checkProblemAnswer } from '@/lib/engine/answerChecker';
import { ENERGY_COST_COUNTER_CHALLENGE, formatEnergyShortage } from '@/lib/engine/energyCosts';
import { trapPatternFromProblem, resolveTrapSourceMeta } from '@/lib/engine/trapPatternFromProblem';
import { useUserStore } from '@/lib/store/userStore';

interface CounterChallengeStoryModalProps {
  questionText: string;
  customNote: string;
  aiFeedback: string;
  sourceProblem?: GeneratedProblem | null;
  userEmail?: string | null;
  onAbort: () => void;
  onComplete: () => void;
}

type FlashKind = 'correct' | 'wrong' | null;

const CHOICE_MARKS = ['①', '②', '③', '④', '⑤'];

function StoryScratchpad({ resetKey }: { resetKey: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [resetKey]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">手書きメモ</p>
        <button
          type="button"
          onClick={clearPad}
          className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-cyan-400/40 hover:text-cyan-200"
        >
          消す
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="h-28 w-full touch-none rounded-xl border border-cyan-400/25 bg-slate-950"
      />
    </div>
  );
}

export default function CounterChallengeStoryModal({
  questionText,
  customNote,
  aiFeedback,
  sourceProblem,
  userEmail,
  onAbort,
  onComplete,
}: CounterChallengeStoryModalProps) {
  const [problems, setProblems] = useState<GeneratedProblem[]>([]);
  const [index, setIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashKind>(null);
  const [cleared, setCleared] = useState(false);
  const [barReady, setBarReady] = useState(false);
  const completeTimer = useRef<number | null>(null);

  const current = problems[index] ?? null;
  const total = problems.length;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const store = useUserStore.getState();
      if (!store.hasHydrated) {
        setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
        setLoading(false);
        return;
      }
      if (!store.canAffordEnergy(ENERGY_COST_COUNTER_CHALLENGE)) {
        setErrorMessage(formatEnergyShortage(ENERGY_COST_COUNTER_CHALLENGE, store.energy));
        setLoading(false);
        return;
      }

      try {
        const next = await requestCounterProblems({
          questionText,
          customNote,
          aiFeedback,
          subject: sourceProblem?.subject,
          unit: sourceProblem?.unit,
          difficulty: sourceProblem?.difficulty,
          userEmail,
        });
        if (cancelled) return;
        if (!store.consumeEnergy(ENERGY_COST_COUNTER_CHALLENGE)) {
          setErrorMessage(formatEnergyShortage(ENERGY_COST_COUNTER_CHALLENGE, store.energy));
          setLoading(false);
          return;
        }
        setProblems(next);
        const meta = resolveTrapSourceMeta(sourceProblem);
        store.appendDiscoveredPatterns(next.map((problem) => trapPatternFromProblem(problem, meta)));
        window.setTimeout(() => {
          if (!cancelled) setBarReady(true);
        }, 40);
      } catch (error) {
        console.error('[CounterChallengeStoryModal] 反例生成に失敗しました', error);
        if (!cancelled) {
          setErrorMessage('罠パターンの生成に失敗しました。もう一度試してください。');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (completeTimer.current) window.clearTimeout(completeTimer.current);
    };
  }, [aiFeedback, customNote, questionText, sourceProblem, userEmail]);

  const finishAll = useCallback(() => {
    setCleared(true);
    completeTimer.current = window.setTimeout(() => {
      onComplete();
    }, 2200);
  }, [onComplete]);

  const handleJudge = () => {
    if (!current || flash || cleared) return;
    const ok = checkProblemAnswer(answerInput, current);
    if (!ok) {
      setFlash('wrong');
      window.setTimeout(() => setFlash(null), 700);
      return;
    }
    setFlash('correct');
    window.setTimeout(() => {
      setFlash(null);
      setAnswerInput('');
      setBarReady(false);
      if (index + 1 >= problems.length) {
        finishAll();
        return;
      }
      setIndex((prev) => prev + 1);
      window.setTimeout(() => setBarReady(true), 40);
    }, 520);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-950 text-white">
      <div className="flex gap-1.5 px-4 pt-3">
        {(total > 0 ? problems : [null, null]).map((item, barIndex) => {
          const filled =
            total === 0
              ? 0
              : barIndex < index || cleared
                ? 100
                : barIndex === index
                  ? flash === 'correct'
                    ? 100
                    : barReady
                      ? 55
                      : 8
                  : 0;
          const active = total > 0 && barIndex === index && !cleared;
          return (
            <div key={item?.id ?? `empty-${barIndex}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className={`h-full rounded-full ${
                  active || barIndex < index
                    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.95)]'
                    : 'bg-white/30'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${filled}%` }}
                transition={{ duration: active ? 0.55 : 0.25, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-bold tracking-wide text-cyan-200">
          反例試練 {total > 0 ? `${Math.min(index + 1, total)}/${total}` : '…'}
        </p>
        <button
          type="button"
          onClick={onAbort}
          className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="中断"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {flash === 'wrong' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-red-500"
          />
        )}
        {flash === 'correct' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.28 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-cyan-400"
          />
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-300">罠パターンを生成しています…</p>
        </div>
      )}

      {!loading && errorMessage && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="text-center text-sm text-red-300">{errorMessage}</p>
          <button
            type="button"
            onClick={onAbort}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
          >
            採点画面に戻る
          </button>
        </div>
      )}

      {!loading && !errorMessage && current && !cleared && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-5 pt-2">
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              {current.title}
            </p>
            <p className="text-sm leading-relaxed text-slate-100">
              <KaTeXText text={current.questionText} />
            </p>
          </div>

          <StoryScratchpad resetKey={current.id} />

          <div className="flex flex-col gap-2">
            {current.format === 'choice' && current.choices && current.choices.length > 0 ? (
              current.choices.map((choice, choiceIndex) => {
                const selected = answerInput === choice;
                return (
                  <button
                    key={`${choice}-${choiceIndex}`}
                    type="button"
                    onClick={() => setAnswerInput(choice)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      selected
                        ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/40'
                    }`}
                  >
                    <span className="mr-2 text-[11px] font-bold text-slate-500">
                      {CHOICE_MARKS[choiceIndex] ?? `${choiceIndex + 1}.`}
                    </span>
                    <KaTeXText text={choice} />
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                <LaTeXKeypad value={answerInput} onChange={setAnswerInput} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleJudge}
            disabled={!answerInput.trim() || Boolean(flash)}
            className="mt-auto rounded-xl border border-cyan-400/50 bg-cyan-400/15 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.25)] disabled:opacity-40"
          >
            判定する
          </button>
          {flash === 'wrong' && (
            <p className="text-center text-xs font-semibold text-red-300">ちがう。この解法が崩れる条件を見抜こう。</p>
          )}
        </div>
      )}

      <AnimatePresence>
        {cleared && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 28 }, (_, i) => {
                const angle = (i / 28) * Math.PI * 2;
                const distance = 90 + (i % 4) * 36;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-cyan-300"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                    }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />
                );
              })}
            </div>
            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-black tracking-tight text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.8)]"
            >
              🎉 罠パターン完全克服！
            </motion.p>
            <p className="mt-3 text-xs text-slate-400">パターン図鑑に登録しました。採点画面へ戻ります…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

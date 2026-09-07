'use client';

// ==========================================
// Apex Suite: Math Lab - 模試ワークスペース
// ==========================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronRight } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import KaTeXText from '@/components/workspace/KaTeXText';
import ScratchpadCanvas from '@/components/workspace/ScratchpadCanvas';
import LaTeXKeypad from '@/components/workspace/LaTeXKeypad';
import MathGraphPlotter from '@/components/visuals/MathGraphPlotter';
import GeometrySvgPlotter from '@/components/visuals/GeometrySvgPlotter';
import PhysicsCanvasSim from '@/components/visuals/PhysicsCanvasSim';
import ChemistryCanvasSim from '@/components/visuals/ChemistryCanvasSim';
import MockReportModal from '@/components/mock-exam/MockReportModal';
import { resolveMathGraphModel } from '@/lib/engine/mathGraphVisual';
import { resolveGeometryScene } from '@/lib/engine/geometryVisual';
import { resolvePhysicsScene } from '@/lib/engine/scienceVisual';
import { resolveChemistryScene } from '@/lib/engine/scienceVisual';
import { isActiveVisualType } from '@/lib/engine/visualNeed';
import {
  buildMockExamProblems,
  buildMockExamReport,
  formatExamClock,
  loadMockExamConfig,
  type MockExamReport,
} from '@/lib/engine/mockExam';
import { useUserStore } from '@/lib/store/userStore';
import { addSolvedProblemRecord } from '@/lib/storage/solvedProblemsStore';

export default function MockExamPlay() {
  const router = useRouter();
  const recordAnswer = useUserStore((state) => state.recordAnswer);
  const [problems, setProblems] = useState<GeneratedProblem[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [limit, setLimit] = useState(0);
  const [report, setReport] = useState<MockExamReport | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const config = loadMockExamConfig();
    if (!config) {
      router.replace('/mock-exam');
      return;
    }
    const generated = buildMockExamProblems(config);
    const timeLimit = config.minutes * 60;
    setProblems(generated);
    setAnswers(Array.from({ length: generated.length }, () => ''));
    setRemaining(timeLimit);
    setLimit(timeLimit);
    setElapsed(0);
  }, [router]);

  useEffect(() => {
    if (!problems || report) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [problems, report]);

  const finishExam = (nextAnswers: string[], elapsedSeconds: number) => {
    if (!problems || report) return;
    const config = loadMockExamConfig();
    const built = buildMockExamReport({
      problems,
      answers: nextAnswers,
      elapsedSeconds,
      timeLimitSeconds: limit,
      difficulty: config?.difficulty ?? 'standard',
    });
    built.questions.forEach((item) => {
      recordAnswer({
        isCorrect: item.isCorrect,
        difficulty: item.problem.difficulty,
        hintsUsed: 0,
        patternId: item.problem.patternId,
      });
      addSolvedProblemRecord(item.problem, item.isCorrect);
    });
    setReport(built);
  };

  useEffect(() => {
    if (problems && remaining === 0 && !report && answers.length === problems.length && elapsed > 0) {
      finishExam(answersRef.current, elapsed);
    }
    // 制限時間ゼロで自動採点。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, problems, report, elapsed]);

  const problem = problems?.[index] ?? null;
  const visualEnabled = isActiveVisualType(problem?.visualType);
  const geometryScene = useMemo(
    () => (problem?.visualType === 'geometry_svg' ? resolveGeometryScene(problem) : null),
    [problem]
  );
  const graphModel = useMemo(
    () => (problem?.visualType === 'math_graph' ? resolveMathGraphModel(problem) : null),
    [problem]
  );
  const physicsScene = useMemo(
    () => (problem?.visualType === 'physics_simulation' ? resolvePhysicsScene(problem) : null),
    [problem]
  );
  const chemistryScene = useMemo(
    () => (problem?.visualType === 'chemistry_animation' ? resolveChemistryScene(problem) : null),
    [problem]
  );
  const hasVisual =
    visualEnabled && Boolean(geometryScene || graphModel || physicsScene || chemistryScene);

  if (!problems || !problem) {
    return <div className="py-20 text-center text-sm text-slate-500">模試を準備しています...</div>;
  }

  const isLast = index === problems.length - 1;
  const currentAnswer = answers[index] ?? '';

  const goNext = () => {
    if (isLast) {
      finishExam(answers, elapsed);
      return;
    }
    setIndex((value) => value + 1);
    setVisualOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          第{index + 1}問 / {problems.length}問
        </p>
        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${remaining <= 60 ? 'text-rose-400' : 'text-cyan-300'}`}>
          <Clock className="h-4 w-4" />
          残り {formatExamClock(remaining)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-[11px] text-slate-500">
            {problem.unit}　★{problem.difficulty}
          </p>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">{problem.title}</h1>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed dark:border-slate-800 dark:bg-slate-950/50">
            <KaTeXText text={problem.questionText} />
          </div>
          {hasVisual && (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVisualOpen((open) => !open)}
                className="w-full bg-slate-50 px-3 py-2 text-xs font-semibold dark:bg-slate-950/80"
              >
                📈 グラフ・図形を表示する (タップで展開)
              </button>
              {visualOpen && (
                <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                  {geometryScene && <GeometrySvgPlotter problem={problem} scene={geometryScene} />}
                  {graphModel && <MathGraphPlotter problem={problem} isSolved={false} />}
                  {physicsScene && <PhysicsCanvasSim problem={problem} scene={physicsScene} />}
                  {chemistryScene && <ChemistryCanvasSim problem={problem} scene={chemistryScene} />}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          {problem.format === 'choice' && problem.choices ? (
            <div className="flex flex-col gap-2">
              {problem.choices.map((choice, choiceIndex) => {
                const selected = currentAnswer === choice;
                return (
                  <button
                    key={`${choice}-${choiceIndex}`}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[index] = choice;
                        return next;
                      })
                    }
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm ${
                      selected
                        ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span className="mr-2 text-[11px] font-bold text-slate-500">
                      {['①', '②', '③', '④'][choiceIndex] ?? `${choiceIndex + 1}.`}
                    </span>
                    <KaTeXText text={choice} />
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={currentAnswer}
                onChange={(event) =>
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[index] = event.target.value;
                    return next;
                  })
                }
                placeholder="解答を入力..."
                className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-base dark:border-slate-700 dark:bg-slate-950"
              />
              <LaTeXKeypad
                onInsert={(symbol) =>
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[index] = `${next[index] ?? ''}${symbol}`;
                    return next;
                  })
                }
              />
            </>
          )}
          <div className="min-h-[180px]">
            <ScratchpadCanvas key={problem.id} problem={problem} />
          </div>
          <button
            type="button"
            onClick={goNext}
            className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-semibold text-white dark:border-slate-200 dark:bg-white dark:text-slate-950"
          >
            {isLast ? '採点する' : '次の問題へ'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {report && (
        <MockReportModal
          report={report}
          onClose={() => router.push('/')}
        />
      )}
    </div>
  );
}

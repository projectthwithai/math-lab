'use client';

// ==========================================
// Apex Suite: Math Lab - Workspace View（スプリット・ワークスペース画面）
// ==========================================
// [左] 問題文・難易度バッジ・タイマー・「数字を変えて再生成」ボタン
// [右] タブ切り替え（手書きメモ / 解答入力・テンキー / 3段階ヒント / AI解法壁打ち）
// 「解答を送信する」で採点結果モーダル(ScoreResultModal)を表示する。

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, RefreshCw, Lightbulb, PenLine, Keyboard, MessageCircle } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import type { XpGainResult } from '@/lib/engine/adaptiveEngine';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { useUserStore } from '@/lib/store/userStore';
import { SUBJECT_ACCENT } from '@/lib/theme/subjectAccent';

import KaTeXText from '@/components/workspace/KaTeXText';
import ScratchpadCanvas from '@/components/workspace/ScratchpadCanvas';
import LaTeXKeypad from '@/components/workspace/LaTeXKeypad';
import AISolutionChat from '@/components/workspace/AISolutionChat';
import ScoreResultModal from '@/components/workspace/ScoreResultModal';

type WorkspaceTab = 'memo' | 'input' | 'hints' | 'chat';

const TABS: { id: WorkspaceTab; label: string; icon: typeof PenLine }[] = [
  { id: 'memo', label: '手書きメモ', icon: PenLine },
  { id: 'input', label: '解答入力', icon: Keyboard },
  { id: 'hints', label: '3段階ヒント', icon: Lightbulb },
  { id: 'chat', label: 'AI解法壁打ち', icon: MessageCircle },
];

function checkAnswer(userInput: string, correctAnswer: string | number): boolean {
  const trimmed = userInput.trim();
  if (trimmed.length === 0) return false;

  if (typeof correctAnswer === 'number') {
    const parsed = Number(trimmed.replace(/,/g, ''));
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - correctAnswer) < 0.05;
  }

  const normalize = (value: string) => value.replace(/[\s、。，,]/g, '').toLowerCase();
  return normalize(trimmed) === normalize(String(correctAnswer));
}

interface WorkspaceViewProps {
  unitId?: string;
  patternId?: string;
}

export default function WorkspaceView({ unitId, patternId }: WorkspaceViewProps) {
  const router = useRouter();
  const recordAnswer = useUserStore((state) => state.recordAnswer);
  const currentDifficulty = useUserStore((state) => state.currentDifficulty);

  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('input');
  const [answerInput, setAnswerInput] = useState('');
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submission, setSubmission] = useState<{ isCorrect: boolean; xpResult: XpGainResult } | null>(
    null
  );

  const accent = useMemo(() => SUBJECT_ACCENT[problem?.subject ?? 'math'], [problem?.subject]);

  const fetchProblem = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (unitId) params.set('unitId', unitId);
      if (patternId) params.set('patternId', patternId);
      params.set('difficulty', String(currentDifficulty));

      const response = await fetch(`/api/generate-problem?${params.toString()}`);
      const data = (await response.json()) as GeneratedProblem;
      setProblem(data);
    } catch (error) {
      console.error('[WorkspaceView] 問題の取得に失敗しました', error);
    } finally {
      setIsLoading(false);
      setAnswerInput('');
      setRevealedHintCount(0);
      setElapsedSeconds(0);
      setSubmission(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, patternId]);

  useEffect(() => {
    // unitId/patternIdが変わるたびに問題を再取得する（マウント時含む）。
    // fetchProblem内部のsetStateは非同期完了後に実行されるため意図的。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblem();
  }, [fetchProblem]);

  useEffect(() => {
    if (submission) return;
    const timer = window.setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [submission]);

  const handleRegenerateLocally = () => {
    if (!problem) return;
    const regenerated = regenerateProblemLocally({
      ...problem,
      id: `${problem.id}-regen-${Date.now()}`,
    });
    setProblem(regenerated);
    setAnswerInput('');
    setRevealedHintCount(0);
    setElapsedSeconds(0);
    setSubmission(null);
  };

  const handleSubmitAnswer = () => {
    if (!problem || submission) return;
    const isCorrect = checkAnswer(answerInput, problem.correctAnswer);
    const xpResult = recordAnswer({
      isCorrect,
      difficulty: problem.difficulty,
      hintsUsed: revealedHintCount,
      patternId: problem.patternId ?? patternId,
    });
    setSubmission({ isCorrect, xpResult });
  };

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(
    elapsedSeconds % 60
  ).padStart(2, '0')}`;

  if (isLoading || !problem) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        問題を生成中...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* 左: 問題エリア */}
      <div className={`flex flex-col gap-4 rounded-2xl border ${accent.border} bg-slate-900/60 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border ${accent.border} px-2.5 py-1 text-[11px] font-bold ${accent.text}`}>
              難易度 {problem.difficulty}/10
            </span>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">
              {problem.unit}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {formattedTime}
          </span>
        </div>

        <h1 className="text-lg font-bold text-white">{problem.title}</h1>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-200">
          <KaTeXText text={problem.questionText} />
        </div>

        <button
          type="button"
          onClick={handleRegenerateLocally}
          className={`flex items-center justify-center gap-1.5 rounded-lg border ${accent.border} py-2 text-xs font-semibold ${accent.text} transition-colors ${accent.bgSoftHover}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          🔄 数値を変えて再生成（APIコスト0）
        </button>
      </div>

      {/* 右: タブ切り替えエリア */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[340px] flex-1">
          {activeTab === 'memo' && <ScratchpadCanvas />}

          {activeTab === 'input' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs text-slate-500">解答を入力してください</label>
              <input
                type="text"
                value={answerInput}
                onChange={(event) => setAnswerInput(event.target.value)}
                disabled={Boolean(submission)}
                placeholder="ここに解答を入力..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50"
              />
              <LaTeXKeypad onInsert={(symbol) => setAnswerInput((prev) => prev + symbol)} />
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="flex flex-col gap-3">
              {problem.hints.map((hint, index) => {
                const isRevealed = revealedHintCount > index;
                return (
                  <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="mb-1 text-xs font-bold text-amber-300">ヒント {index + 1}</p>
                    {isRevealed ? (
                      <p className="text-sm text-slate-200">
                        <KaTeXText text={hint} />
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealedHintCount(index + 1)}
                        className="text-xs text-slate-500 underline hover:text-slate-300"
                      >
                        タップして表示する
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'chat' && <AISolutionChat problem={problem} />}
        </div>

        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={Boolean(submission)}
          className="mt-auto rounded-xl bg-cyan-400 py-3 text-sm font-bold text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          解答を送信する
        </button>
      </div>

      {submission && (
        <ScoreResultModal
          problem={problem}
          isCorrect={submission.isCorrect}
          xpResult={submission.xpResult}
          onClose={() => setSubmission(null)}
          onNextProblem={() => {
            fetchProblem();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

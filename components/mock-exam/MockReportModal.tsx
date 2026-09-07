'use client';

// ==========================================
// Apex Suite: Math Lab - 模試結果レポート
// ==========================================

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, X, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import KaTeXText from '@/components/workspace/KaTeXText';
import type { MockExamReport } from '@/lib/engine/mockExam';
import { formatExamClock } from '@/lib/engine/mockExam';

interface MockReportModalProps {
  report: MockExamReport;
  onClose: () => void;
}

const GRADE_TONE: Record<MockExamReport['grade'], string> = {
  A: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  B: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
  C: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
  D: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  E: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
};

function renderReportImage(report: MockExamReport): Promise<Blob> {
  const width = 1080;
  const height = 1480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('canvas'));

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(48, 48, width - 96, height - 96);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '600 28px "Noto Sans JP", sans-serif';
  ctx.fillText('Apex Suite 全国統一 AI実践模試', 88, 130);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 64px "Noto Sans JP", sans-serif';
  ctx.fillText(`偏差値 ${report.deviation.toFixed(1)}`, 88, 230);

  ctx.fillStyle = '#67e8f9';
  ctx.font = '600 36px "Noto Sans JP", sans-serif';
  ctx.fillText(`${report.grade}判定  ${report.gradeLabel}`, 88, 290);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '400 26px "Noto Sans JP", sans-serif';
  ctx.fillText(
    `正答 ${report.correctCount}/${report.totalCount}　所要 ${formatExamClock(report.elapsedSeconds)} / ${formatExamClock(report.timeLimitSeconds)}`,
    88,
    350
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 28px "Noto Sans JP", sans-serif';
  ctx.fillText('大問別正否', 88, 430);

  report.questions.forEach((item, index) => {
    const y = 480 + index * 72;
    ctx.fillStyle = item.isCorrect ? '#34d399' : '#fb7185';
    ctx.font = '600 24px "Noto Sans JP", sans-serif';
    ctx.fillText(item.isCorrect ? '○' : '×', 88, y);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    const label = `第${index + 1}問  ${item.problem.unit}  ${item.problem.title}`;
    ctx.fillText(label.slice(0, 28), 130, y);
  });

  const weakStart = 480 + report.questions.length * 72 + 40;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 28px "Noto Sans JP", sans-serif';
  ctx.fillText('弱点パターン', 88, weakStart);

  const weaknesses = report.weakPatterns.length > 0 ? report.weakPatterns : [{ title: 'なし', unit: '-', advice: '今回の範囲は安定しています。' }];
  weaknesses.slice(0, 3).forEach((item, index) => {
    const y = weakStart + 50 + index * 90;
    ctx.fillStyle = '#fde68a';
    ctx.font = '600 22px "Noto Sans JP", sans-serif';
    ctx.fillText(`${item.unit} / ${item.title}`.slice(0, 32), 88, y);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 20px "Noto Sans JP", sans-serif';
    ctx.fillText(item.advice.slice(0, 36), 88, y + 34);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Noto Sans JP", sans-serif';
  ctx.fillText('保護者共有レポート  /  Apex Suite: Math Lab', 88, height - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('blob'));
    }, 'image/png');
  });
}

function reportSummaryText(report: MockExamReport): string {
  const lines = [
    '【Apex Suite 全国統一AI実践模試】',
    `予想偏差値 ${report.deviation.toFixed(1)} / ${report.grade}判定`,
    report.gradeLabel,
    `正答 ${report.correctCount}/${report.totalCount}`,
    ...report.questions.map(
      (item) => `第${item.index + 1}問 ${item.problem.unit}: ${item.isCorrect ? '正解' : '不正解'}`
    ),
  ];
  if (report.weakPatterns.length > 0) {
    lines.push('弱点: ' + report.weakPatterns.map((item) => item.unit).join('、'));
  }
  return lines.join('\n');
}

export default function MockReportModal({ report, onClose }: MockReportModalProps) {
  const router = useRouter();
  const sharing = useRef(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleParentShare = async () => {
    if (sharing.current) return;
    sharing.current = true;
    try {
      const blob = await renderReportImage(report);
      const file = new File([blob], 'apex-mock-exam-report.png', { type: 'image/png' });
      const text = reportSummaryText(report);

      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '全国統一AI実践模試レポート',
          text,
        });
        setShareNotice('共有シートを開きました（LINEを選んで送信できます）');
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = '保護者共有レポート.png';
      link.click();
      URL.revokeObjectURL(objectUrl);
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      setShareNotice('画像を保存し、LINE投稿画面を開きました');
    } catch (error) {
      console.error('[MockReportModal] 保護者共有に失敗しました', error);
      setShareNotice('共有に失敗しました。もう一度お試しください。');
    } finally {
      sharing.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950/95"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-500">National AI Mock Exam</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">模試結果レポート</h2>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
            <p className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-300">予想偏差値</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {report.deviation.toFixed(1)}
            </p>
          </div>
          <div className={`rounded-2xl border p-4 ${GRADE_TONE[report.grade]}`}>
            <p className="text-[11px] font-semibold">志望校判定</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{report.grade}</p>
            <p className="mt-1 text-xs">{report.gradeLabel}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          正答 {report.correctCount}/{report.totalCount}　所要 {formatExamClock(report.elapsedSeconds)} /{' '}
          {formatExamClock(report.timeLimitSeconds)}
        </p>

        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">大問別正否</h3>
          <ol className="space-y-2">
            {report.questions.map((item) => (
              <li
                key={item.problem.id}
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-start gap-2">
                  {item.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      第{item.index + 1}問　{item.problem.unit} / {item.problem.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      解答: {item.userAnswer ? <KaTeXText text={item.userAnswer} /> : '未解答'}
                      {' ／ 正解: '}
                      <KaTeXText text={String(item.problem.correctAnswer)} />
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">弱点パターン</h3>
          {report.weakPatterns.length === 0 ? (
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              大きな穴は見つかりませんでした。この調子で定着させましょう。
            </p>
          ) : (
            <ul className="space-y-2">
              {report.weakPatterns.map((item) => (
                <li
                  key={`${item.unit}-${item.title}`}
                  className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-amber-200">
                    {item.unit} / {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    <KaTeXText text={item.advice} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={() => {
            void handleParentShare();
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-400/15 py-3 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/25"
        >
          <Share2 className="h-4 w-4" />
          👨‍👩‍👦 保護者共有レポート
        </button>
        {shareNotice && <p className="mt-2 text-center text-[11px] text-slate-400">{shareNotice}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={() => router.push('/mock-exam')}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-2.5 text-sm font-semibold text-white dark:border-slate-200 dark:bg-white dark:text-slate-950"
          >
            設定に戻る
          </button>
        </div>
      </motion.div>
    </div>
  );
}

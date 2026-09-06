'use client';

// ==========================================
// Apex Suite: Math Lab - Derivation Animator（成り立ちアニメーション）
// ==========================================
// 定理・公式の導出過程を1ステップずつアニメーション表示する
// （Zero-Cost Visuals: framer-motionによるトランジションのみ、外部アニメAPIは使わない）。

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import KaTeXText from '@/components/workspace/KaTeXText';

interface DerivationAnimatorProps {
  steps: string[];
}

export default function DerivationAnimator({ steps }: DerivationAnimatorProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {steps.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= currentStep ? 'bg-cyan-400' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      <div className="relative min-h-[100px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cyan-400">
              STEP {currentStep + 1} / {steps.length}
            </p>
            <p className="text-sm leading-relaxed text-slate-200">
              <KaTeXText text={steps[currentStep]} />
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={isFirst}
          className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          前へ
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          最初から
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
          disabled={isLast}
          className="flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300 disabled:opacity-30"
        >
          次へ
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

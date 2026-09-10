'use client';

// ==========================================
// Apex Suite: Math Lab - 呼び出し式スライドイン電卓
// ==========================================

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, Delete, X } from 'lucide-react';

import {
  evaluateCalculatorExpression,
  formatCalculatorResult,
  type AngleMode,
} from '@/lib/engine/calculator';

interface ScientificCalculatorProps {
  open: boolean;
  onClose: () => void;
  onApply: (value: string) => void;
}

const OP_KEYS = [
  { label: 'C', insert: 'clear' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '÷', insert: '÷' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '×', insert: '×' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '-', insert: '-' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '+', insert: '+' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: '√', insert: 'sqrt(' },
  { label: '=', insert: '=' },
  { label: 'sin', insert: 'sin(' },
  { label: 'cos', insert: 'cos(' },
  { label: 'tan', insert: 'tan(' },
  { label: 'x²', insert: '^2' },
] as const;

export default function ScientificCalculator({ open, onClose, onApply }: ScientificCalculatorProps) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');

  const runEquals = (source = expression) => {
    try {
      const value = evaluateCalculatorExpression(source, angleMode);
      const formatted = formatCalculatorResult(value);
      setResult(formatted);
      setError(null);
      return formatted;
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : '計算できませんでした');
      return null;
    }
  };

  const handleKey = (insert: string) => {
    if (insert === 'clear') {
      setExpression('');
      setResult(null);
      setError(null);
      return;
    }
    if (insert === '=') {
      runEquals();
      return;
    }
    setResult(null);
    setError(null);
    setExpression((prev) => prev + insert);
  };

  const handleApply = () => {
    const value = result ?? runEquals();
    if (value == null) return;
    onApply(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="電卓を閉じる"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-[80] flex h-full w-[min(100vw,22rem)] flex-col border-l border-cyan-400/20 bg-slate-950/95 p-4 shadow-[-12px_0_40px_rgba(8,47,73,0.45)] backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-cyan-200">
                <Calculator className="h-4 w-4" />
                電卓
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <p className="min-h-[1.25rem] break-all font-mono text-xs text-slate-400">
                {expression || '0'}
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-white">
                {error ? 'Error' : (result ?? '')}
              </p>
              {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
            </div>

            <div className="mb-3 flex gap-1.5">
              {(['deg', 'rad'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAngleMode(mode)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    angleMode === mode
                      ? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {mode === 'deg' ? 'DEG' : 'RAD'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpression((prev) => prev.slice(0, -1))}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300"
              >
                <Delete className="h-3.5 w-3.5" />
                BS
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {OP_KEYS.map((key) => (
                <button
                  key={key.label}
                  type="button"
                  onClick={() => handleKey(key.insert)}
                  className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                    key.insert === '='
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : key.insert === 'clear'
                        ? 'bg-rose-400/15 text-rose-200 hover:bg-rose-400/25'
                        : 'border border-slate-800 bg-slate-900 text-slate-100 hover:border-cyan-400/40'
                  }`}
                >
                  {key.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="mt-4 rounded-xl border border-cyan-400/50 bg-cyan-400/10 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/20"
            >
              計算結果を解答欄に反映
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

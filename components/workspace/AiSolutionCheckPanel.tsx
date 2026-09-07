'use client';

// ==========================================
// Apex Suite: Math Lab - 解法ロジック検証パネル
// ==========================================
// 自分流メモ / パターン方針を API で検証し、
// 判定バッジ + 親身なフィードバックを表示する共通UI。

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import type {
  CustomSolutionVerifyContext,
  CustomSolutionVerifyResult,
  CustomSolutionVerifyStatus,
} from '@/types/mathLab';
import { requestCustomSolutionVerify } from '@/lib/api/verifyCustomSolutionClient';
import { useUserStore } from '@/lib/store/userStore';
import { ENERGY_COST_VERIFY_LOGIC, formatEnergyShortage } from '@/lib/engine/energyCosts';

const STATUS_BADGE: Record<
  CustomSolutionVerifyStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  perfect: {
    label: '完璧。全類似問題で適用可能',
    className: 'border-slate-200 bg-emerald-50 text-emerald-700 dark:border-slate-800 dark:bg-emerald-400/10 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  warning: {
    label: '注意点あり',
    className: 'border-slate-200 bg-amber-50 text-amber-700 dark:border-slate-800 dark:bg-amber-400/10 dark:text-amber-300',
    icon: AlertTriangle,
  },
  invalid: {
    label: '飛躍あり',
    className: 'border-slate-200 bg-red-50 text-red-700 dark:border-slate-800 dark:bg-red-400/10 dark:text-red-300',
    icon: XCircle,
  },
};

interface AiSolutionCheckPanelProps {
  customText: string;
  context: CustomSolutionVerifyContext;
  buttonLabel: string;
  disabled?: boolean;
}

export default function AiSolutionCheckPanel({
  customText,
  context,
  buttonLabel,
  disabled = false,
}: AiSolutionCheckPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CustomSolutionVerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheck = async () => {
    if (disabled || isChecking) return;
    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      setErrorMessage('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (!store.consumeEnergy(ENERGY_COST_VERIFY_LOGIC)) {
      setErrorMessage(formatEnergyShortage(ENERGY_COST_VERIFY_LOGIC, store.energy));
      return;
    }
    setIsChecking(true);
    setErrorMessage(null);
    try {
      const next = await requestCustomSolutionVerify(customText, context);
      setResult(next);
    } catch (error) {
      console.error('[AiSolutionCheckPanel] 検証に失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_VERIFY_LOGIC);
      setErrorMessage('検証に失敗したため、Energy を返還しました。もう一度試してみてください。');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          void handleCheck();
        }}
        disabled={disabled || isChecking}
        className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-400/20 disabled:opacity-40 dark:text-cyan-300"
      >
        {isChecking ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            検証中...
          </span>
        ) : (
          `${buttonLabel}（${ENERGY_COST_VERIFY_LOGIC} Energy）`
        )}
      </button>

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400"
          >
            {errorMessage}
          </motion.p>
        )}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border p-3 ${STATUS_BADGE[result.status].className}`}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
              {(() => {
                const Icon = STATUS_BADGE[result.status].icon;
                return <Icon className="h-3.5 w-3.5" />;
              })()}
              {STATUS_BADGE[result.status].label}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {result.feedback}
            </p>
            {result.edgeCaseNote && (
              <p className="mt-2 rounded-lg border border-slate-300/60 bg-black/5 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-600 dark:border-slate-600 dark:bg-white/5 dark:text-slate-300">
                罠・反例: {result.edgeCaseNote}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

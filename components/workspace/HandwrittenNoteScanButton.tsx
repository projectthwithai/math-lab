'use client';

// ==========================================
// Apex Suite: Math Lab - Paper notebook scan for solution memo
// ==========================================

import { useRef, useState } from 'react';
import { AlertCircle, Camera, Check, Loader2 } from 'lucide-react';

import type { GeneratedProblem, HandwrittenNoteAnalysis } from '@/types/mathLab';
import { requestHandwrittenNoteAnalysis } from '@/lib/api/analyzeHandwrittenNoteClient';
import { ENERGY_COST_ANALYZE_HANDWRITTEN_NOTE, formatEnergyShortage } from '@/lib/engine/energyCosts';
import { useUserStore } from '@/lib/store/userStore';

interface HandwrittenNoteScanButtonProps {
  problem?: GeneratedProblem | null;
  userEmail?: string | null;
  onSummary: (summaryNote: string) => void;
  compact?: boolean;
}

export default function HandwrittenNoteScanButton({
  problem,
  userEmail,
  onSummary,
  compact = false,
}: HandwrittenNoteScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [audit, setAudit] = useState<HandwrittenNoteAnalysis | null>(null);

  const flashNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handlePick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!file.type.startsWith('image/')) {
      flashNotice('画像ファイルを選んでください');
      return;
    }

    const store = useUserStore.getState();
    if (!store.hasHydrated) {
      flashNotice('ステータスを読み込み中です。少し待ってから再試行してください。');
      return;
    }
    if (!store.consumeEnergy(ENERGY_COST_ANALYZE_HANDWRITTEN_NOTE)) {
      flashNotice(formatEnergyShortage(ENERGY_COST_ANALYZE_HANDWRITTEN_NOTE, store.energy));
      return;
    }

    setBusy(true);
    try {
      const imageBase64 = await readFileAsDataUrl(file);
      const result = await requestHandwrittenNoteAnalysis({
        imageBase64,
        mimeType: file.type || 'image/jpeg',
        problem,
        userEmail,
      });
      setAudit(result);
      onSummary(result.summaryNote);
    } catch (error) {
      console.error('[HandwrittenNoteScanButton] 読み取りに失敗しました', error);
      useUserStore.getState().refundEnergy(ENERGY_COST_ANALYZE_HANDWRITTEN_NOTE);
      flashNotice('紙ノートの読み取りに失敗しました');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        aria-label="紙ノートを撮影して読み取り"
        title="紙ノートを撮影して読み取り"
        className={`inline-flex items-center justify-center rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 text-cyan-400 transition hover:bg-fuchsia-400/20 disabled:opacity-60 ${
          compact ? 'h-7 w-7' : 'h-8 w-8'
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-cyan-400" />}
      </button>
      {audit && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-tight ${
            audit.isSound
              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
              : 'border-amber-400/50 bg-amber-400/10 text-amber-200'
          }`}
          title={audit.logicAudit}
        >
          {audit.isSound ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {audit.isSound ? '論理完璧' : '飛躍あり'}
        </span>
      )}
      {audit?.logicAudit && (
        <p className="text-right text-[10px] leading-relaxed text-fuchsia-200/80">{audit.logicAudit}</p>
      )}
      {notice && <p className="text-right text-[10px] text-red-300">{notice}</p>}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('画像の読み込みに失敗しました'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

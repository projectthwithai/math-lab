'use client';

import { AlertCircle } from 'lucide-react';

import { HANDWRITING_IRRELEVANT_ERROR, HANDWRITING_RESHOOT_HEADING } from '@/lib/llm/handwritingVision';
import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';

interface HandwritingReshootAlertProps {
  heading?: string;
  message?: string | null;
  compact?: boolean;
}

export default function HandwritingReshootAlert({
  heading,
  message,
  compact = false,
}: HandwritingReshootAlertProps) {
  const detail = stripUnicodeEmoji(message ?? '').trim() || HANDWRITING_IRRELEVANT_ERROR;
  const title = stripUnicodeEmoji(heading ?? '').trim() || HANDWRITING_RESHOOT_HEADING;
  return (
    <div
      role="alert"
      className={`flex gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 text-amber-100 ${
        compact ? 'items-start px-2.5 py-2' : 'items-start px-3 py-3'
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="min-w-0">
        <p className={`font-semibold tracking-tight ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {title}
        </p>
        <p className={`mt-0.5 leading-relaxed text-amber-100/80 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {detail}
        </p>
      </div>
    </div>
  );
}

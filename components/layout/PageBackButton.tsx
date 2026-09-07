'use client';

// ==========================================
// Apex Suite: Math Lab - 画面左上の戻るボタン
// ==========================================
// 同一オリジンからの遷移なら router.back()、直リンク等は単元選択へ退避する。

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageBackButtonProps {
  fallbackHref?: string;
}

export default function PageBackButton({ fallbackHref = '/units' }: PageBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const fromSameOrigin = Boolean(referrer) && referrer.startsWith(window.location.origin);
      if (fromSameOrigin && window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-400/50 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-cyan-300"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      ⬅️ 戻る
    </button>
  );
}

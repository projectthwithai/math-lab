'use client';

// ==========================================
// Apex Suite: Math Lab - 画面左上の戻るボタン
// ==========================================
// 同一オリジンからの遷移なら router.back()、直リンク等はパターン図鑑へ退避する。

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageBackButtonProps {
  fallbackHref?: string;
  /** 指定時は履歴を使わず、このパスへ直接戻る */
  href?: string;
}

export default function PageBackButton({ fallbackHref = '/patterns', href }: PageBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
      return;
    }
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
      aria-label="戻る"
      className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white/80 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#0b0d14]"
    >
      <ArrowLeft className="h-5 w-5 text-zinc-400 transition-colors hover:text-zinc-100" />
    </button>
  );
}

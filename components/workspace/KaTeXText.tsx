'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXText（インライン数式表示）
// ==========================================
// 文中の `$...$` 区間だけを数式としてインライン表示する。
// 内部は SafeKaTeX に委譲し、破損LaTeXを修復してから描画する。

import SafeKaTeX from '@/components/ui/SafeKaTeX';

interface KaTeXTextProps {
  text: string;
  className?: string;
}

export default function KaTeXText({ text, className }: KaTeXTextProps) {
  return <SafeKaTeX latex={text} className={className} />;
}

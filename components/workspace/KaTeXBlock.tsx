'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXBlock（ブロック数式表示）
// ==========================================
// 解説パネルの「鍵となる公式」等、ブロック単位で表示する数式。
// 内部は SafeKaTeX に委譲し、破損LaTeXを修復してから描画する。

import SafeKaTeX from '@/components/ui/SafeKaTeX';

interface KaTeXBlockProps {
  content: string;
  className?: string;
}

export default function KaTeXBlock({ content, className }: KaTeXBlockProps) {
  return <SafeKaTeX latex={content} displayMode className={className} />;
}

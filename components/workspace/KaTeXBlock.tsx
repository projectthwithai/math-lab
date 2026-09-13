'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXBlock（ブロック数式表示）
// ==========================================
// 解説パネルの「鍵となる公式」等、ブロック単位で表示する数式。
// 剥き出しの `\text{}` 等は sanitizeLatex 側で `$...$` に自動修復する。

import SafeKaTeX from '@/components/ui/SafeKaTeX';

interface KaTeXBlockProps {
  content: string;
  className?: string;
}

export default function KaTeXBlock({ content, className }: KaTeXBlockProps) {
  return <SafeKaTeX latex={content} displayMode className={className} />;
}

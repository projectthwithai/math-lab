'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXBlock（ブロック数式表示）
// ==========================================
// 解説パネルの「鍵となる公式」等、ブロック単位で表示する数式。
// 文中の `$...$` 区間はdisplayModeで数式表示し、それ以外はプレーンテキスト。

import 'katex/dist/katex.min.css';
import { renderMixedMathToHtml } from './katexUtils';

interface KaTeXBlockProps {
  content: string;
  className?: string;
}

export default function KaTeXBlock({ content, className }: KaTeXBlockProps) {
  const html = renderMixedMathToHtml(content, true);
  return (
    <div className={`formula-surface ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

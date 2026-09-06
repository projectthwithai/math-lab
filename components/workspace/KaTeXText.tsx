'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXText（インライン数式表示）
// ==========================================
// 文中の `$...$` 区間だけを数式としてインライン表示する。

import 'katex/dist/katex.min.css';
import { renderMixedMathToHtml } from './katexUtils';

interface KaTeXTextProps {
  text: string;
  className?: string;
}

export default function KaTeXText({ text, className }: KaTeXTextProps) {
  const html = renderMixedMathToHtml(text, false);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

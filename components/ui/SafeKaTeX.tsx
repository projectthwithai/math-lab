'use client';

// ==========================================
// Apex Suite: Math Lab - SafeKaTeX
// ==========================================
// 破損したバックスラッシュを自動修復し、throwOnError: false で描画する。
// KaTeX オプションは strict: false / trust: true（日本語・ハイフン混在を許容）。
// 赤文字の生コードエラー（\vec / \dfrac 等）を画面に出さない。

import 'katex/dist/katex.min.css';
import { sanitizeAndRenderLatex } from '@/lib/utils/sanitizeLatex';

interface SafeKaTeXProps {
  latex: string;
  className?: string;
  displayMode?: boolean;
}

export default function SafeKaTeX({ latex, className, displayMode = false }: SafeKaTeXProps) {
  const html = sanitizeAndRenderLatex(latex ?? '', displayMode);
  const Tag = displayMode ? 'div' : 'span';
  const overflowClass = displayMode ? 'w-full max-w-full overflow-x-auto scrollbar-none' : '';
  return (
    <Tag
      className={`formula-surface ${overflowClass} ${className ?? ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

'use client';

// ==========================================
// Apex Suite: Math Lab - SafeKaTeX
// ==========================================
// 破損したバックスラッシュを自動修復し、throwOnError: false で描画する。
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
  return <Tag className={`formula-surface ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

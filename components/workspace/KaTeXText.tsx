'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXText（インライン数式表示）
// ==========================================
// 文中の `$...$` 区間だけを数式としてインライン表示する。
// `$` の外側に剥き出しの `\text{}` / `\mathrm{}` / `\frac{}{}` があれば
// wrapBareLatexOutsideMath で自動的に `$...$` へ包んでから描画する。

import SafeKaTeX from '@/components/ui/SafeKaTeX';
import { wrapBareLatexOutsideMath } from '@/lib/utils/sanitizeLatex';

interface KaTeXTextProps {
  text: string;
  className?: string;
}

export default function KaTeXText({ text, className }: KaTeXTextProps) {
  return <SafeKaTeX latex={wrapBareLatexOutsideMath(text ?? '')} className={className} />;
}

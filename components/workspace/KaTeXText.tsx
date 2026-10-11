'use client';

// ==========================================
// Apex Suite: Math Lab - KaTeXText（インライン数式表示）
// ==========================================
// `$...$` / `$$...$$` と Markdown の **太字** を描画する。
// `$` の外側に剥き出しの `\frac` / `\sum` / `\displaystyle` があれば
// wrapBareLatexOutsideMath で自動的に数式区間へ包んでから描画する。

import SafeKaTeX from '@/components/ui/SafeKaTeX';
import { wrapBareLatexOutsideMath } from '@/lib/utils/sanitizeLatex';

interface KaTeXTextProps {
  text: string;
  className?: string;
}

export default function KaTeXText({ text, className }: KaTeXTextProps) {
  return <SafeKaTeX latex={wrapBareLatexOutsideMath(text ?? '')} className={className} />;
}

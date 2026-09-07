// ==========================================
// Apex Suite: Math Lab - KaTeX Mixed Text Renderer
// ==========================================
// `$...$` で囲まれた区間だけをKaTeXで数式レンダリングし、
// それ以外はプレーンテキストとして安全にエスケープするユーティリティ。
// LaTeXを含まないプレーンテキスト（Unicode数式記号のみ）を渡しても
// そのまま安全に表示される。

import katex from 'katex';
import { cleanLatexFormula } from '@/lib/utils/mathFormatter';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * テキスト中の `$...$` 区間をKaTeXでHTMLレンダリングし、残りはエスケープした
 * プレーンテキストとして結合したHTML文字列を返す。
 * `dangerouslySetInnerHTML` での利用を想定。
 */
export function renderMixedMathToHtml(text: string, displayMode: boolean): string {
  const segments = cleanLatexFormula(text).split(/\$([^$]+)\$/g);

  return segments
    .map((segment, index) => {
      const isMathSegment = index % 2 === 1;
      if (!isMathSegment) {
        return escapeHtml(segment).replace(/\n/g, '<br />');
      }
      try {
        return katex.renderToString(segment, { throwOnError: false, displayMode });
      } catch {
        return escapeHtml(segment);
      }
    })
    .join('');
}

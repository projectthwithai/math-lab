// ==========================================
// Apex Suite: Math Lab - KaTeX Mixed Text Renderer
// ==========================================
// `$...$` で囲まれた区間だけをKaTeXで数式レンダリングし、
// それ以外はプレーンテキストとして安全にエスケープするユーティリティ。
// 描画前に SafeKaTeX と同じサニタイズを通し、赤文字エラーを出さない。

export {
  sanitizeAndRenderLatex as renderMixedMathToHtml,
  sanitizeLatex,
  wrapBareLatexOutsideMath,
} from '@/lib/utils/sanitizeLatex';

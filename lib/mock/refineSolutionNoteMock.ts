// ==========================================
// Apex Suite: Math Lab - Refine Solution Note Mock
// ==========================================
// LLM 未設定・失敗時のゼロコスト清書。元メモの言い回しを残しつつ
// AI注意点を2〜3行に圧縮する。

export function refineSolutionNoteMock(params: {
  originalNote: string;
  aiFeedback: string;
  keyFormula?: string;
}): string {
  const original = params.originalNote.trim() || 'まず公式を書いてから代入する。';
  const compactOriginal = original.replace(/\s+/g, ' ').slice(0, 80);
  const feedback = params.aiFeedback.trim();
  const trap = feedback
    ? feedback
        .replace(/\s+/g, ' ')
        .slice(0, 70)
    : '定義域・符号・場合分けを最後に一度確認する。';
  const formula = params.keyFormula?.trim();
  const formulaBit = formula ? `鍵は ${formula.replace(/\s+/g, ' ').slice(0, 40)}。` : '';

  return `${compactOriginal}${compactOriginal.endsWith('。') ? '' : '。'}${formulaBit}復習時は「${trap}」を先に思い出し、同じミスをしない。`;
}

// ==========================================
// Apex Suite: Math Lab - Handwritten note analysis mock
// ==========================================

import type { HandwrittenNoteAnalysis } from '@/types/mathLab';

export function analyzeHandwrittenNoteMock(params: {
  questionText?: string;
  title?: string;
  hasImage: boolean;
}): HandwrittenNoteAnalysis {
  const title = params.title?.trim() || 'この問題';
  if (!params.hasImage) {
    return {
      summaryNote: `${title}の手順を、条件 → 使う公式 → 代入 → 検算の順で自分の言葉で書き直す。`,
      logicAudit: '画像が読み取れなかったため、前提条件の抜けがないかだけ先に確認しよう。',
      isSound: false,
    };
  }
  return {
    summaryNote:
      `${title}について、紙ノートから読み取った流れ。` +
      '与えられた条件を書き出し、使う公式の適用条件を確認してから代入している。最後に定義域・単位を見ている。',
    logicAudit:
      '手順の骨格は追える。途中で場合分けや定義域の確認が一行足りないと、似た問題で崩れる可能性がある。',
    isSound: false,
  };
}

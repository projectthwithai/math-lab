// ==========================================
// Apex Suite: Math Lab - Scratchpad Red-Pen Mock
// ==========================================
// OPENAI_API_KEY 未設定時のゼロコスト赤ペン添削。
// 手書き画像そのものは読めないため、問題のよくあるミスと
// 画像サイズから「途中式の行」を想定した指導コメントを返す。

import type { ScratchpadCorrectionResult } from '@/types/mathLab';

interface ScratchpadMockContext {
  questionText?: string;
  title?: string;
  unit?: string;
  commonMistakes?: string;
  explanationSteps?: string[];
  imageByteLength?: number;
}

const GENERIC_COMMENTS = [
  { line: 2, severity: 'error' as const, text: '2行目の展開で符号ミスがあります。括弧を外すとき、各項の符号を一つずつ確認しましょう。' },
  { line: 3, severity: 'warning' as const, text: '3行目で場合分けの境界（端点）を見落としています。定義域の端も代入して比較してください。' },
  { line: 4, severity: 'warning' as const, text: '4行目で条件（正負・定義域・等号の有無）を見落としています。使う公式の発動条件を先に書いてから代入しましょう。' },
];

function unitComments(unit: string, commonMistakes: string): ScratchpadCorrectionResult['comments'] {
  const blob = `${unit} ${commonMistakes}`;
  const comments: ScratchpadCorrectionResult['comments'] = [];

  if (/2次|二次|平方/.test(blob)) {
    comments.push({
      line: 2,
      severity: 'error',
      text: '2行目の平方完成で、定数項の符号ミスがあります。(xの係数/2)² を足し引きする向きを見直してください。',
    });
    comments.push({
      line: 4,
      severity: 'warning',
      text: '軸と定義域の位置関係の場合分けを見落としています。軸が外にあるときは端点で最大・最小を取ります。',
    });
  } else if (/三角|正弦|余弦/.test(blob)) {
    comments.push({
      line: 3,
      severity: 'error',
      text: '3行目の余弦定理で辺の対応が逆になっています。対辺と夾角の組を図に書き戻してください。',
    });
    comments.push({
      line: 4,
      severity: 'warning',
      text: 'cos の符号から鋭角・鈍角を判定する条件を見落としています。',
    });
  } else if (/ベクトル/.test(blob)) {
    comments.push({
      line: 2,
      severity: 'error',
      text: '2行目の内積計算で成分の組み合わせミスがあります。x同士・y同士の積になっているか確認を。',
    });
    comments.push({
      line: 3,
      severity: 'warning',
      text: '垂直条件（内積=0）を使う前提を書いていません。図のどこが直角かを先に明示しましょう。',
    });
  } else if (/微分/.test(blob)) {
    comments.push({
      line: 2,
      severity: 'error',
      text: '2行目の微分で内側の関数の係数を掛け忘れています（合成関数）。',
    });
    comments.push({
      line: 4,
      severity: 'warning',
      text: '極値の候補が定義域内かどうかの条件を見落としています。',
    });
  } else if (/積分/.test(blob)) {
    comments.push({
      line: 3,
      severity: 'error',
      text: '3行目の定積分で上下を逆にした符号ミスがあります。上の曲線 − 下の曲線になっているか確認を。',
    });
  } else if (commonMistakes.trim()) {
    comments.push({
      line: 3,
      severity: 'warning',
      text: `この単元でよくあるミスです: ${commonMistakes}`,
    });
  }

  if (comments.length === 0) {
    return GENERIC_COMMENTS.slice(0, 2);
  }
  return comments.slice(0, 3);
}

export function correctScratchpadMock(context: ScratchpadMockContext): ScratchpadCorrectionResult {
  const imageLen = context.imageByteLength ?? 0;
  if (imageLen < 800) {
    return {
      overall: 'empty',
      summary: '途中式がほとんど読み取れません。キャンバスに計算過程を書いてから、もう一度添削してください。',
      comments: [
        {
          severity: 'warning',
          text: '行番号が分かるように、式を上から順に書いてください。展開・場合分け・結論を分けて書くと添削精度が上がります。',
        },
      ],
      source: 'local',
    };
  }

  const comments = unitComments(context.unit ?? '', context.commonMistakes ?? '');
  const seed = imageLen % 3;
  const rotated = [...comments.slice(seed), ...comments.slice(0, seed)];
  const steps = context.explanationSteps ?? [];
  if (steps[0]) {
    rotated.push({
      line: 1,
      severity: 'ok',
      text: `1行目の方針は良い流れです。続きは「${steps[0]}」を意識して論理を繋いでください。`,
    });
  }

  return {
    overall: 'needs_fix',
    summary:
      '手書きの途中式を赤ペンで見ました。符号と条件分岐を中心に直すと、同じパターンの類題にも耐える答案になります。',
    comments: rotated.slice(0, 4),
    source: 'local',
  };
}

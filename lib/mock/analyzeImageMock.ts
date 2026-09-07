// ==========================================
// Apex Suite: Math Lab - Image Analysis Mock
// ==========================================
// Vision API キー未設定時のゼロコスト fallback。
// 原問テキストは一切返さず、オリジナル類題とパターンだけを返す。

import type { ImageAnalysisResult, SolutionPattern } from '@/types/mathLab';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { resolvePromptIntent } from '@/lib/engine/promptIntent';

const SAMPLE_HINTS: Array<{
  prompt: string;
  patternName: string;
  strategyText: string;
  techniques: string[];
}> = [
  {
    prompt: '共通テスト風のベクトル',
    patternName: '構造抽出: ベクトルの内積と垂直条件',
    techniques: ['内積', '垂直条件', '成分計算'],
    strategyText:
      'STEP1: ベクトルを成分または図示から式で置く。' +
      'STEP2: 垂直なら内積=0、平行なら実数倍、を先に立式する。' +
      'STEP3: 数字が変わっても同じ関係式が使えるか検算する。',
  },
  {
    prompt: '二次関数の最大最小',
    patternName: '構造抽出: 平方完成で頂点を読む',
    techniques: ['平方完成', '頂点', '定義域'],
    strategyText:
      'STEP1: y=a(x-p)^2+q の形に平方完成する。' +
      'STEP2: aの符号で上に凸か下に凸かを判定する。' +
      'STEP3: 定義域があるときは端点も比較する。',
  },
  {
    prompt: '力学の等加速度',
    patternName: '構造抽出: 運動方程式と変位公式',
    techniques: ['運動方程式', '等加速度', '単位換算'],
    strategyText:
      'STEP1: 力を洗い出して F=ma を書く。' +
      'STEP2: 等加速度なら x=v0t+(1/2)at^2 を使う。' +
      'STEP3: 単位（m, s, N）を揃えてから代入する。',
  },
];

export function analyzeImageMock(seed = Date.now()): ImageAnalysisResult {
  const sample = SAMPLE_HINTS[Math.abs(seed) % SAMPLE_HINTS.length];
  const intent = resolvePromptIntent(sample.prompt);
  const variantProblem = generateMockProblem({
    unitId: intent.unitId,
    difficulty: intent.difficulty,
  });

  const pattern: SolutionPattern = {
    id: `ocr-pat-${intent.unitId}-${seed}`,
    subject: variantProblem.subject,
    unit: variantProblem.unit,
    unitId: intent.unitId,
    level: intent.difficulty <= 3 ? 'basic' : intent.difficulty <= 7 ? 'standard' : 'advanced',
    patternName: sample.patternName,
    exampleQuestion: variantProblem.questionText,
    strategyText: sample.strategyText,
    discovered: true,
  };

  return {
    logic: {
      subject: variantProblem.subject,
      unit: variantProblem.unit,
      techniques: sample.techniques,
    },
    variantProblem: {
      ...variantProblem,
      title: `オリジナル類題: ${variantProblem.title}`,
    },
    pattern,
    source: 'local',
  };
}

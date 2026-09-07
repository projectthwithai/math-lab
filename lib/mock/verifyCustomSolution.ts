// ==========================================
// Apex Suite: Math Lab - Custom Solution Mock Verifier
// ==========================================
// OPENAI_API_KEY 未設定時のゼロコスト検証。
// 解法メモの長さ・過一般化・場合分けの有無・単元キーワードを見て
// perfect / warning / invalid を返す（LLMのフォールバック）。

import type {
  CustomSolutionVerifyContext,
  CustomSolutionVerifyResult,
} from '@/types/mathLab';

const OVERGENERALIZE = [
  'いつでも',
  '常に成り立つ',
  '例外はない',
  '場合分け不要',
  '場合分けはいらない',
  '分母は無視',
  '定義域は気にしなくて',
  '符号は気にしなくて',
  '必ず最大',
  '必ず最小',
];

const RIGOR_HINTS = [
  '場合分け',
  '定義域',
  '条件',
  '判別式',
  '例外',
  'a>0',
  'a<0',
  'a＞0',
  'a＜0',
  '上に凸',
  '下に凸',
  '検算',
  '端点',
  '境界',
];

const METHOD_HINTS = [
  '平方完成',
  '代入',
  '公式',
  '微分',
  '積分',
  '因数分解',
  '解の公式',
  '正弦',
  '余弦',
  '対数',
  '漸化式',
  'ベクトル',
  '内積',
  '運動方程式',
  'オーム',
  '物質量',
  '中和',
  '頂点',
  '軸',
  '増減',
  '置換',
];

function includesAny(text: string, phrases: string[]): string[] {
  return phrases.filter((phrase) => text.includes(phrase));
}

function contextBlob(context: CustomSolutionVerifyContext): string {
  return [
    context.title,
    context.unit,
    context.patternName,
    context.questionText,
    context.exampleQuestion,
    context.strategyText,
    context.keyFormula,
    context.commonMistakes,
    ...(context.explanationSteps ?? []),
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');
}

export function verifyCustomSolutionMock(
  customText: string,
  context: CustomSolutionVerifyContext = {}
): CustomSolutionVerifyResult {
  const text = customText.trim();
  const topic = context.unit || context.patternName || context.title || 'この単元';

  if (text.length === 0) {
    return {
      status: 'invalid',
      feedback:
        'まだ解法メモが空だよ。自分の言葉で「何を見て・どの公式を・どの順で使うか」を1〜3行書いてから、もう一度チェックしてみよう。',
      edgeCaseNote: '空の方針では類似問題に適用できるか判断できない。',
    };
  }

  if (text.length < 16) {
    return {
      status: 'warning',
      feedback:
        `短いメモだね。「${topic}」で何を最初に確認するか（条件・公式・答えの形）をもう1行足すと、類似問題でも迷いにくくなるよ。`,
      edgeCaseNote: '短い方針は、数字や条件が変わったときに手順が飛びやすい。',
    };
  }

  const overgen = includesAny(text, OVERGENERALIZE);
  if (overgen.length > 0) {
    return {
      status: 'invalid',
      feedback:
        `「${overgen[0]}」と書いてあるのが気になるよ。その言い切りは、条件が変わった類似問題で破綻しやすい。` +
        '「いつ成り立つか」を一言添えて、適用範囲を限定してみよう。',
      edgeCaseNote:
        context.commonMistakes ||
        '符号・定義域・場合分けを省略すると、見た目は同じ型でも答えが変わる。',
    };
  }

  const rigorHits = includesAny(text, RIGOR_HINTS);
  const methodHits = includesAny(text, METHOD_HINTS);
  const blob = contextBlob(context);
  const mentionsTopic =
    (context.unit && text.includes(context.unit)) ||
    (context.patternName && text.includes(context.patternName.replace(/^パターン\d+[:：]\s*/, ''))) ||
    methodHits.length > 0 ||
    (blob.length > 0 && METHOD_HINTS.some((hint) => blob.includes(hint) && text.includes(hint)));

  const hasLeap =
    text.includes('よって答え') && rigorHits.length === 0 && text.length < 40;

  if (hasLeap) {
    return {
      status: 'invalid',
      feedback:
        '結論への飛躍があるよ。途中の根拠（使った公式と、それが使える条件）を1行入れてから締めよう。' +
        '採点官にも、未来の自分にも伝わるメモになる。',
      edgeCaseNote: '「よって答え」の前に、なぜその変形が許されるかを書く。',
    };
  }

  if (methodHits.length > 0 && rigorHits.length > 0) {
    return {
      status: 'perfect',
      feedback:
        `いい方針だね。手順（${methodHits.slice(0, 2).join('・')}）と条件確認（${rigorHits.slice(0, 2).join('・')}）が両方入っている。` +
        `「${topic}」の数字を変えた類似問題でも、この順番なら一通り戦えるよ。`,
      edgeCaseNote:
        context.commonMistakes ||
        '最後に端点・符号・単位だけ検算する習慣を残しておくとさらに強い。',
    };
  }

  if (methodHits.length > 0 || mentionsTopic) {
    return {
      status: 'warning',
      feedback:
        `方針の骨格は見えているよ。ただし「すべての類似問題で無条件に使える」とまでは言い切れない。` +
        (context.commonMistakes
          ? `特に注意: ${context.commonMistakes}`
          : '定義域・符号・場合分けが要る型かどうかを、使う公式の前に一言書いておこう。'),
      edgeCaseNote:
        context.keyFormula
          ? `鍵公式「${context.keyFormula}」が使える前提条件をメモに残すと汎用性が上がる。`
          : '条件が1つでも欠けると、同じ型に見えて別解法が必要になることがある。',
    };
  }

  return {
    status: 'warning',
    feedback:
      `自分の言葉で書けているのは良いスタート。ただ、${topic} 固有の「見るポイント」がまだ薄い。` +
      '公式名と、それを発動する条件を1つずつ書くと、類似問題への転用力がぐっと上がるよ。',
    edgeCaseNote: '抽象的な感想だけだと、数字が変わったときに再現できない。',
  };
}

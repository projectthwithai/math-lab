// ==========================================
// Apex Suite: Math Lab - Photo problem Vision gate
// ==========================================
// Gemini Vision は「問題文が写っているか」を最初に判定する。
// 無関係画像・通信失敗では類題を捏造しない。

import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';

export const IMAGE_ANALYSIS_INVALID_ERROR =
  '画像から数学・理科の問題が認識できませんでした。問題文がはっきりと写った写真を撮影してください。';

export const IMAGE_ANALYSIS_SERVER_ERROR =
  'AI解析サーバーとの通信に失敗しました。時間をおいて再試行してください。';

export const IMAGE_ANALYSIS_RESHOOT_HEADING = '問題文が認識できませんでした';

export interface ImageAnalysisBlocked {
  isValid: false;
  error: string;
}

export function isImageAnalysisBlocked(value: unknown): value is ImageAnalysisBlocked {
  if (!value || typeof value !== 'object') return false;
  const source = value as Record<string, unknown>;
  if (source.isValid === false) return true;
  if (typeof source.error === 'string' && source.error.trim() && source.isValid !== true) {
    const hasProblem = Boolean(source.variantProblem && typeof source.variantProblem === 'object');
    if (!hasProblem) return true;
  }
  return false;
}

export function imageAnalysisBlockedPayload(error: string): ImageAnalysisBlocked {
  const trimmed = stripUnicodeEmoji(error).trim();
  return {
    isValid: false,
    error: trimmed.length > 0 ? trimmed : IMAGE_ANALYSIS_INVALID_ERROR,
  };
}

export function readImageAnalysisError(value: unknown, fallback = IMAGE_ANALYSIS_INVALID_ERROR): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as Record<string, unknown>).error;
  if (typeof error === 'string' && error.trim()) return stripUnicodeEmoji(error).trim() || fallback;
  return fallback;
}

export function buildImageAnalysisVisionSystemPrompt(): string {
  return (
    'あなたは高校の数学・物理・化学の問題写真を Gemini Vision で解析する東大プロ作問者です。' +
    '入力には必ず写真が付いている。写真を見ずに類題を作ることは禁止。力学の斜面など、写真と無関係な定番問題を捏造してはならない。\n' +
    '【ステップ1: 教科と単元の特定】\n' +
    '写真の問題文・数式を読み取り、まず教科（math / physics / chemistry）を厳密に判定せよ。' +
    '数学の写真に対して物理や化学の問題を出力することは厳禁。' +
    '物理の写真に数学を出すことも、化学の写真に物理を出すことも禁止。' +
    'logic.subject と variantProblem.subject は必ず同じ教科にする。\n' +
    'もし画像が関係のない風景・物体・人物・真っ暗、文字が潰れて判読できない、または問題文が確認できない場合は、' +
    '絶対に類題を捏造せず、直ちに以下のJSONを返してください:\n' +
    `{ "isValid": false, "error": "${IMAGE_ANALYSIS_INVALID_ERROR}" }\n` +
    '\n' +
    '【ステップ2: 類題生成（問題が存在する場合のみ）】\n' +
    '写真の問題の解法ロジックを忠実に再現した完全オリジナルの類題（同じ教科・同じ単元）を生成せよ。' +
    'isValid: true とし、\n' +
    '① 画像の問題が扱う『単元』および『解法パターン（ロジック）』を特定。\n' +
    '② その解法ロジックを100%そのまま使用するが、数値や文章設定を変えた『完全オリジナルの類題（GeneratedProblem型）』を生成。\n' +
    '③ パターン図鑑に登録可能な『新規パターンデータ（パターン名、解法方針、具体例題）』を生成してください。\n' +
    '著作権: 原問の文章・固有設定・数値を書き写して再現してはならない。解法の骨格だけを使い、別の数値・設定で創作する。' +
    '最重要: 文章や見た目が違っても、解き方の骨格が existingCatalog のどれかと同一なら既存パターンとして分類する。' +
    '出力はJSONのみ。妥当な場合のキーは isValid, logic, variantProblem, pattern, match。' +
    'match は { existing: boolean, patternId?: string }。existing=true のとき patternId は existingCatalog の id。' +
    '既存一致なら新しい pattern カードは作らず、patternId だけ返す。' +
    '完全に異なる解法のときだけ existing=false とし、新規 pattern（patternName, strategyText, exampleQuestion）を返す。' +
    'logic は { subject, unit, techniques[] }。subject は math | physics | chemistry。techniques は一般的な手法名のみ。' +
    'variantProblem は完全オリジナルの類題。数値・物語・記号を写真と一致させない。教科は logic.subject と一致させる。' +
    'questionText / templateText / hints / keyFormula / commonMistakes / explanation.stepByStep には $...$ の LaTeX を含める。' +
    'variantProblem は title, unit, subject, difficulty, format, questionText, templateText, ' +
    'variables, calcLogicJS, hints, keyFormula, commonMistakes を持つ。' +
    'calcLogicJS は vars を受け取り { vars, correctAnswer, explanationSteps } を返す関数本体。' +
    '出力の文字列に絵文字や絵文字記号を含めない。error 文にも絵文字を付けない。'
  );
}

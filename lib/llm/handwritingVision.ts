// ==========================================
// Apex Suite: Math Lab - Handwriting Vision gate
// ==========================================
// Gemini Vision は「手書き数式が写っているか」を最初に判定する。
// 無関係画像・通信失敗では添削を捏造しない。

import { stripUnicodeEmoji } from '@/lib/utils/stripUnicodeEmoji';

export const HANDWRITING_IRRELEVANT_ERROR =
  '画像から手書きの計算やノートが確認できませんでした。数式が写った写真を再度お試しください。';

export const HANDWRITING_SERVER_ERROR =
  'AI添削サーバーとの通信に失敗しました。時間をおいて再試行してください。';

export const HANDWRITING_RESHOOT_HEADING = '手書きの数式が確認できませんでした';

export interface VisionBlockedResult {
  isRelevant: false;
  error: string;
}

export function isVisionBlockedResult(value: unknown): value is VisionBlockedResult {
  if (!value || typeof value !== 'object') return false;
  const source = value as Record<string, unknown>;
  if (source.isRelevant === false) return true;
  if (typeof source.error === 'string' && source.error.trim() && source.isRelevant !== true) {
    return true;
  }
  return false;
}

export function visionBlockedPayload(error: string): VisionBlockedResult {
  const trimmed = stripUnicodeEmoji(error).trim();
  return {
    isRelevant: false,
    error: trimmed.length > 0 ? trimmed : HANDWRITING_IRRELEVANT_ERROR,
  };
}

export function readBlockedError(value: unknown, fallback = HANDWRITING_IRRELEVANT_ERROR): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as Record<string, unknown>).error;
  if (typeof error === 'string' && error.trim()) return stripUnicodeEmoji(error).trim() || fallback;
  return fallback;
}

const STEP_ONE_TWO =
  '【ステップ1: 画像の妥当性判定】\n' +
  '送信された画像を精査し、数学・物理・化学の『手書きの計算式、途中式、ノートの筆跡』が実際に存在するかを最初に判定してください。\n' +
  'もし画像が真っ暗、関係のない物体・風景・顔写真、または手書きの数式が判読できない場合は、絶対に添削を捏造せず、直ちに以下のJSONを返してください:\n' +
  `{ "isRelevant": false, "error": "${HANDWRITING_IRRELEVANT_ERROR}" }\n` +
  '\n' +
  '【ステップ2: 本物の添削（妥当な場合のみ）】\n' +
  '画像に手書きの途中式が確認できる場合のみ isRelevant: true とし、\n' +
  '『写真に実際に書かれている生徒の手書き式（例: 2行目の〇〇という式）』を必ず具体的に引用した上で、論理の正否・符号ミス・改善アドバイスを提示してください。\n' +
  '単元名・問題文・よくあるミスから想像した添削は禁止。画像に無い式を書いてはならない。読めない行は推測で埋めない。';

export function buildScratchpadVisionSystemPrompt(isPaper: boolean): string {
  return (
    'あなたは高校生の手書き途中式を赤ペンで添削する数学・物理・化学の教師です。' +
    STEP_ONE_TWO +
    (isPaper
      ? '入力は紙のノート・計算用紙の写真である。罫線・消しゴム跡・影があっても、実際に書かれた数式だけを読む。'
      : '入力はデジタル手書きキャンバスの画像である。描かれているストロークだけを読む。') +
    '出力はJSONのみ。妥当な場合のキーは isRelevant, overall, summary, comments。' +
    'overall は good / needs_fix。空白や無関係はステップ1の JSON のみ。' +
    'comments は { line?, severity, text } の配列。severity は error / warning / ok。' +
    'text は必ず「2行目の『…』という式」のように写真の実記述を引用してから指摘する。' +
    '正解の最終値を先に教えず、引用した式の論理・符号・代入を見る。数式は $...$ の LaTeX で書いてよい。' +
    '出力の文字列に絵文字や絵文字記号を含めない。'
  );
}

export function buildHandwrittenNoteVisionSystemPrompt(): string {
  return (
    'あなたは高校生の紙ノートを読み取る数学・物理・化学の教師です。' +
    STEP_ONE_TWO +
    '妥当な場合のみ JSON で isRelevant, summaryNote, logicAudit, isSound を返す。' +
    'summaryNote と logicAudit には、写真に実際に書かれている式を具体的に引用する。' +
    '正解の最終値を先に教えず、ノートに書いてあることだけを根拠にする。' +
    '出力の文字列に絵文字や絵文字記号を含めない。'
  );
}

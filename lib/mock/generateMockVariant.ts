// ==========================================
// Apex Suite: Math Lab - Camouflaged variant mock
// ==========================================
// LLM 未設定・失敗時のフォールバック。解法ロジック（calcLogicJS）は
// generateMockProblem のまま、出題文のシチュエーションだけを変装する。

import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { stampCatalogProblem } from '@/lib/mock/stampDiscoveredProblem';
import { findSolutionPatternById } from '@/data/patternsData';
import { pickCamouflageStyleLabel } from '@/lib/engine/patternVariant';

export interface GenerateMockVariantParams {
  patternId: string;
  patternName: string;
  strategyText: string;
  unitId?: string;
  subject?: Subject;
  existingCount?: number;
}

function wrapTemplate(text: string, styleLabel: string, patternName: string): string {
  if (styleLabel === '図形文章' || styleLabel === '動点幾何') {
    return (
      `座標平面上を点 P が動く。次の関係が成り立つとき、同じ手順で値を求めよ。` +
      `（解法パターン「${patternName}」）\n${text}`
    );
  }
  if (styleLabel === '共通テスト風') {
    return (
      `次の会話を読んで、空欄に当てはまる値を求めよ。` +
      `太郎「この設定、授業でやったあの手順が使えるよ。」` +
      `花子「解法は変えずに、数字だけ丁寧に追おう。」\n${text}`
    );
  }
  if (styleLabel === '日常会話') {
    return (
      `実験ノートに次の記録が残っている。見た目は日常の記録だが、使う式は同じである。値を求めよ。\n${text}`
    );
  }
  return `次の問題を、解法パターン「${patternName}」と同じ手順で解け。\n${text}`;
}

export function generateMockVariant(params: GenerateMockVariantParams): GeneratedProblem {
  const styleLabel = pickCamouflageStyleLabel(params.existingCount ?? 0);
  const catalog = findSolutionPatternById(params.patternId);
  const base = generateMockProblem({
    unitId: params.unitId ?? catalog?.unitId,
    patternId: params.patternId,
  });
  const wrappedText = wrapTemplate(base.questionText, styleLabel, params.patternName);
  const wrappedTemplate = base.templateConfig
    ? wrapTemplate(base.templateConfig.templateText, styleLabel, params.patternName)
    : wrappedText;

  const camouflaged: GeneratedProblem = {
    ...base,
    id: `variant-${params.patternId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    patternId: params.patternId,
    title: `変装・${styleLabel}: ${base.title}`,
    questionText: wrappedText,
    templateConfig: base.templateConfig
      ? { ...base.templateConfig, templateText: wrappedTemplate }
      : base.templateConfig,
    hints: [
      catalog?.strategyText
        ? `解法は「${params.patternName}」のまま。見た目に惑わされない。`
        : base.hints[0],
      params.strategyText.split(/[。\n]/).find((part) => part.trim())?.trim() || base.hints[1],
      base.hints[2],
    ],
  };

  return catalog ? stampCatalogProblem(camouflaged, catalog) : camouflaged;
}

export function readMockVariantStyleLabel(problem: GeneratedProblem): string {
  const match = /^変装・([^:]+):/.exec(problem.title);
  return match?.[1]?.trim() || pickCamouflageStyleLabel(0);
}

// ==========================================
// Apex Suite: Math Lab - Exam variant local fallback
// ==========================================
// LLM タイムアウト／JSON パース失敗時でも、該当パターンの入試級テンプレートを
// ローカル生成して成功させる。会話の着せ替えは使わない。

import type { GeneratedProblem, SolutionPattern, Subject } from '@/types/mathLab';
import { findSolutionPatternById, getPatternStarDifficulty } from '@/data/patternsData';
import { getUnitById } from '@/data/unitsData';
import { generateMockProblem } from '@/lib/mock/generateMockProblem';
import { regenerateProblemLocally } from '@/lib/engine/localRegenerator';
import { ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';
import { pickExamThemeLabel } from '@/lib/engine/patternVariant';
import { wrapBareLatexOutsideMath } from '@/lib/utils/sanitizeLatex';
import { DEFAULT_DIFFICULTY } from '@/lib/engine/difficultyScale';

function themeForPattern(patternName: string, strategyText: string, existingCount: number): string {
  const blob = `${patternName} ${strategyText}`;
  if (/漸化/.test(blob)) {
    return ['特性方程式', '線形漸化式', '一般項の決定', '階差変形'][existingCount % 4];
  }
  if (/帰納/.test(blob)) return ['数学的帰納法', '命題の証明', 'n=k+1 の変形', '範囲の明示'][existingCount % 4];
  if (/等比/.test(blob)) return ['等比の一般項', '公比の決定', '等比の和', '無限級数'][existingCount % 4];
  return pickExamThemeLabel(existingCount);
}

function syntheticPattern(params: {
  patternId: string;
  patternName: string;
  strategyText: string;
  unitId?: string;
  subject: Subject;
  catalog?: SolutionPattern;
}): SolutionPattern {
  if (params.catalog) return params.catalog;
  const unit = params.unitId ? getUnitById(params.unitId) : undefined;
  return {
    id: params.patternId,
    subject: params.subject,
    unit: unit?.title ?? '数学',
    unitId: params.unitId,
    subtopicId: /漸化/.test(params.patternName + params.strategyText) ? 'st-seq-rec' : undefined,
    level: 'standard',
    difficulty: 2,
    patternName: params.patternName,
    exampleQuestion: params.strategyText,
    strategyText: params.strategyText,
  };
}

export function generateExamVariantFallback(params: {
  patternId: string;
  patternName: string;
  strategyText: string;
  unitId?: string;
  subject: Subject;
  existingCount: number;
}): { problem: GeneratedProblem; styleLabel: string } {
  const catalog = findSolutionPatternById(params.patternId);
  const locked = syntheticPattern({ ...params, catalog });
  const unitId = params.unitId ?? locked.unitId;
  const difficulty = catalog ? getPatternStarDifficulty(catalog) : DEFAULT_DIFFICULTY;
  const styleLabel = themeForPattern(params.patternName, params.strategyText, params.existingCount);

  try {
    const base = generateMockProblem({
      unitId,
      patternId: params.patternId,
      subtopicId: locked.subtopicId,
      lockedPattern: locked,
      difficulty,
      examQuality: true,
    });

    const regenerated = ensureProblemHasCorrectAnswer(
      regenerateProblemLocally({
        ...base,
        id: `variant-${params.patternId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        patternId: params.patternId,
        title: `【${styleLabel}】${base.title.replace(/^【.+?】/, '')}`,
        questionText: wrapBareLatexOutsideMath(base.questionText),
        templateConfig: base.templateConfig
          ? {
              ...base.templateConfig,
              templateText: wrapBareLatexOutsideMath(base.templateConfig.templateText),
            }
          : base.templateConfig,
      })
    );
    return { problem: regenerated, styleLabel };
  } catch (error) {
    console.error('[generateExamVariantFallback] モック生成に失敗。静的な漸化式フォールバックを返します', error);
    return {
      styleLabel,
      problem: {
        id: `variant-${params.patternId}-${Date.now()}`,
        patternId: params.patternId,
        subject: params.subject,
        unit: locked.unit,
        title: `【${styleLabel}】線形漸化式の一般項`,
        difficulty,
        format: 'input',
        questionText:
          '$a_1=1$，$a_{n+1}=2a_n+1$ で定まる数列について、第 $4$ 項 $a_{4}$ を求めよ。',
        visualType: 'none',
        visualConfig: { type: 'none', params: {} },
        correctAnswer: 15,
        hints: [
          '特性方程式 $x=2x+1$ を解く。',
          '$a_n+1$ が等比になる。',
          '$a_n=2^n-1$。$n=4$ なら $15$。',
        ],
        explanation: {
          stepByStep: ['$a_n=2^n-1$', '$a_4=15$'],
          keyFormula: '$a_{n+1}-\\alpha=p(a_n-\\alpha)$',
          commonMistakes: '特性根の符号を間違える。',
        },
      },
    };
  }
}

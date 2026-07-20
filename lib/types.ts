// 問題のパラメータ（物理の角度や、数学の二次関数パラメータなど）
export interface ProblemParams {
  theta?: number;
  m?: number;
  mu?: number;
  a?: number;
  p?: number;
  q?: number;
}

// 問題のデータ構造
export interface Problem {
  id: string;
  title: string;
  text: string;
  params: ProblemParams;
  correct_steps: string[];
  correct_answer: string;
}

// ステップごとの添削データ
export interface StepEvaluation {
  step_index: number;
  formula: string;
  is_correct: boolean;
  feedback: string;
}

// 添削結果全体のデータ
export interface EvaluationResult {
  steps: StepEvaluation[];
  overall_feedback: string;
  is_fully_correct: boolean;
}
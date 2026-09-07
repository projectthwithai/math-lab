// ==========================================
// Apex Suite: Math Lab - Core Type Definitions
// ==========================================
// アプリ全体で共有するドメイン型を1箇所に集約する。
// .cursorrules の「拡張TypeScriptデータモデル」に準拠。

export type Subject = 'math' | 'physics' | 'chemistry';
export type ProblemFormat = 'choice' | 'input' | 'descriptive';

// ------------------------------------------
// GeneratedProblem（AI生成問題 / モック問題 共通フォーマット）
// ------------------------------------------

export interface GeneratedProblem {
  id: string;
  patternId?: string;
  subject: Subject;
  unit: string;
  title: string;
  difficulty: number; // 1-10
  format: ProblemFormat;
  questionText: string;

  visualType: 'none' | 'math_graph' | 'physics_simulation' | 'chemistry_animation';
  visualConfig: {
    type: string;
    params: Record<string, unknown>;
  };

  correctAnswer: string | number;
  choices?: string[];
  unitSymbol?: string;

  /** 「数字を変えて再生成（APIコスト0）」を実現するためのローカル再生成テンプレート */
  templateConfig?: {
    variables: Record<string, { min: number; max: number; step: number }>;
    templateText: string;
    /** サンドボックス化された`new Function`で評価される計算ロジック文字列 */
    calcLogicJS: string;
  };

  hints: [string, string, string];
  explanation: {
    stepByStep: string[];
    keyFormula: string;
    commonMistakes: string;
  };

  /** 図鑑でユーザーが新パターン解析したパターンから出題されたとき true */
  fromDiscoveredPattern?: boolean;
}

// ------------------------------------------
// SolutionPattern（本物の解法パターン図鑑）
// ------------------------------------------
// 単元ごとの「入試お決まりパターン」を、解答方針（strategyText）と
// セットで管理する。パターンの攻略状態（isMastered）自体はこのファイルでは
// 静的な初期値のみ持ち、実際のユーザーごとの攻略状況は
// `lib/store/userStore.ts` の `clearedPatternIds` で管理する
// （静的データとユーザー状態を分離する設計）。

export type PatternLevel = 'basic' | 'standard' | 'advanced';

export interface SolutionPattern {
  id: string;
  subject: Subject;
  /** 単元の表示名（例: "2次関数"） */
  unit: string;
  /** `data/unitsData.ts` の UnitInfo.id（Workspaceへの「この問題を解く」遷移に使用） */
  unitId?: string;
  level: PatternLevel;
  /** 解法パターン名（例: "パターン2: 軸が動く2次関数の最大・最小"） */
  patternName: string;
  /** 📝 具体的な例題文（LaTeX数式は `$...$` で囲む。KaTeXBlock/KaTeXTextで描画） */
  exampleQuestion: string;
  /** Apexガイドが書いた、このパターンを見抜くコツ・解答方針 */
  strategyText: string;
  /** 図鑑の「新パターン解析」で後から追加されたパターン */
  discovered?: boolean;
}

// ------------------------------------------
// PatternItem（弱点分析・アダプティブ出題エンジン用の汎用習熟度パターン）
// ------------------------------------------

export type PatternMasteryLevel = 'locked' | 'seen' | 'practicing' | 'mastered';

export interface PatternItem {
  id: string;
  subject: Subject;
  unit: string;
  patternName: string;
  description: string;
  difficulty: number;
  masteryLevel: PatternMasteryLevel;
  solvedCount: number;
  correctCount: number;
  iconKey?: string;
}

// ------------------------------------------
// WeaponItem（武器庫 - 定理・公式図鑑）
// ------------------------------------------

export interface WeaponItem {
  id: string;
  subject: Subject;
  category: string;
  name: string;
  formulaLaTeX: string;
  /** ① 使いどころ・効果 */
  usageScenario: string;
  /** ② 発動条件リスト */
  triggerConditions: string[];
  /** ③ 成り立ちアニメーション種別 */
  derivationVisualType: string;
  derivationSteps: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ------------------------------------------
// CustomSolutionNote（解説の自分流書き換えノート）
// ------------------------------------------

export interface CustomSolutionNote {
  problemId: string;
  content: string;
  updatedAt: string;
}

// ------------------------------------------
// SolvedProblemRecord（マイライブラリ・復習用の解答履歴）
// ------------------------------------------

export interface SolvedProblemRecord {
  id: string;
  problem: GeneratedProblem;
  isCorrect: boolean;
  solvedAt: string;
  /** エビングハウス忘却曲線に基づく復習ステージ（0=直後 → 数値が大きいほど間隔が長い） */
  reviewStage: number;
  nextReviewAt: string;
}

// ------------------------------------------
// CustomSolutionVerification（自分流解法メモのロジック検証）
// ------------------------------------------

export type CustomSolutionVerifyStatus = 'perfect' | 'warning' | 'invalid';

export interface CustomSolutionVerifyContext {
  mode?: 'problem' | 'pattern';
  questionText?: string;
  title?: string;
  unit?: string;
  patternName?: string;
  patternId?: string;
  strategyText?: string;
  keyFormula?: string;
  correctAnswer?: string | number;
  explanationSteps?: string[];
  exampleQuestion?: string;
  commonMistakes?: string;
}

export interface CustomSolutionVerifyResult {
  status: CustomSolutionVerifyStatus;
  feedback: string;
  edgeCaseNote?: string;
}

// ------------------------------------------
// ImageAnalysisResult（画像からの構造抽出。原問テキストは返さない）
// ------------------------------------------

export interface ImageLogicSummary {
  subject: Subject;
  unit: string;
  techniques: string[];
}

export interface ImageAnalysisResult {
  /** 抽象化した解法構造のみ。原問の文章・数値・設定は含めない */
  logic: ImageLogicSummary;
  /** 100%オリジナルの新規創作問題（類題） */
  variantProblem: GeneratedProblem;
  pattern: SolutionPattern;
  source: 'llm' | 'local';
}

// ==========================================
// Apex Suite: Math Lab - Exam / ★1-5 generation prompts
// ==========================================

import type { Subject } from '@/types/mathLab';
import { getDifficultyMeta, getDifficultyTier } from '@/lib/engine/difficultyScale';
import { VISUAL_TYPE_PROMPT_RULES } from '@/lib/engine/visualNeed';

export const JUNIOR_HIGH_BAN =
  '【全難易度・禁止事項（絶対遵守）】中学生レベルの多項式展開（例: (x+a)(x+b) の定数項）、' +
  '1行で暗算できる四則だけのドリル、小学校の平均の足し算割り算だけの作業は出力してはならない。' +
  '高校の教科書例題であっても、思考が0のコピペ代入だけを★4以上に出してはならない。';

export const LATEX_EXPLANATION_RULES =
  '【数式表記】問題文・選択肢・hints・stepByStep・keyFormula は KaTeX で描画する。' +
  '数式は必ず $...$ で囲み、標準LaTeX（\\frac, \\sin, \\sum, \\vec, \\lim, \\int, \\mathrm{pH} 等）を使う。' +
  'stepByStep は途中式を省略せず、各行が独立して読める美しい導出にする。' +
  'keyFormula は1行の中核公式を LaTeX で書く。逆算思考（ゴール→使う公式→不足条件）が読み取れること。';

export const SUBJECT_RUBRIC =
  '【科目・分野ごとの難易度ルーブリック（厳守）】' +
  '■数学（数I・A・II・B・C・III）:' +
  '★1 教科書の基本公式の適用（ただし中学の展開ドリルは禁止）。' +
  '★2〜★3 典型入試、2条件の連立、共通テスト標準レベル。' +
  '★4〜★5 東大・京大・旧帝・難関大二次。文字定数を含む場合分け、通過領域、確率漸化式、立体の積分体積、空間ベクトル、複素数平面の軌跡など複数ステップの本格問題。単なる展開や一次計算は絶対禁止。' +
  '■物理（力学・熱・波動・電磁気・原子）:' +
  '★1 速度・運動方程式・オームの法則の直接代入。' +
  '★2〜★3 標準入試、エネルギー保存、ドップラー効果、回路計算。' +
  '★4〜★5 2物体の相対運動・重心系、非定常回路（過渡現象）、磁場中を動く導体棒の終端速度、斜めドップラー、光の干渉条件、ボーアの原子模型など難関大二次の標準〜難問。' +
  '■化学（理論・無機・有機）:' +
  '★1 モル計算、状態方程式の直接計算。' +
  '★2〜★3 蒸気圧、酸塩基滴定、気体の発生と性質、アルコールの反応。' +
  '★4〜★5 緩衝液の厳密pH、溶解度積の沈殿生成判定、無機金属イオンの系統分離、オゾン開裂や多段階反応の有機構造決定、ペプチド配列特定など難関大の本格問題。';

export const STAR5_CORE_RULES =
  '難易度★5は東大・京大・難関国公立の二次試験、および共通テストの大問最終設問レベルの高度な思考力を要する問題のみを出力せよ。' +
  JUNIOR_HIGH_BAN +
  '必ず次をすべて満たすこと:' +
  '(1) 文字定数を残した議論、または複数物理・化学過程の接続。' +
  '(2) 場合分けが3パターン以上、もしくは2つ以上の定理の融合。' +
  '(3) 答えは単なる代入値ではなく、個数・範囲の長さ・終端値・判定（0/1）・pH・確率などの思考結果。' +
  '(4) 解説 stepByStep は論理の根拠を6ステップ以上、途中式を LaTeX で書く。';

export const STAR5_FIELD_EXAMPLES =
  '【★5の分野例（該当単元ではこの水準）】' +
  '数I: 対称式の高次計算、文字定数の不等式の整数解個数、軸・区間が動く最大最小、解の配置、常に成り立つ条件、内接四角形、分散の定義を使う変量変換・外れ値。' +
  '数A: 条件付き確率と余事象の融合、確率漸化式、整数の不定方程式の非負解の個数、方べきと円周角の融合。' +
  '数II: 通過領域、剰余が1次式になる割り算、三角関数の方程式の解の個数、対数不等式の真数条件。' +
  '数B: 漸化式の特性方程式と和、標本と母集団の分散の関係。' +
  '数C: 空間ベクトルの垂線の足・体積、複素数の軌跡（円・直線）と交点。' +
  '数III: 極限の不等式評価、立体の回転体・断面積の積分体積、媒介変数表示の面積。' +
  '物理: 相対速度と重心系、RC過渡、導体棒の終端速度、斜めドップラー、ヤングの干渉、ボーア模型の光子エネルギー。' +
  '化学: 緩衝液の Henderson–Hasselbalch、Ksp とイオン積の比較、系統分離で沈殿するイオン数、オゾン分解のカルボニル数、ペプチドの部分加水分解。';

export function buildDifficultyGuide(difficulty: number, subject: Subject = 'math'): string {
  const subjectHint =
    subject === 'physics' ? '科目は物理。' : subject === 'chemistry' ? '科目は化学。' : '科目は数学。';

  if (difficulty <= 1) {
    return (
      subjectHint +
      '★1: 高校教科書の基本公式の適用。数学は定義・公式の確認（中学展開は禁止）。' +
      '物理は v=v0+at, F=ma, V=IR の直接代入可。化学はモル・PV=nRT の直接計算可。' +
      JUNIOR_HIGH_BAN
    );
  }
  if (difficulty === 2) {
    return subjectHint + '★2: 定期テスト後半・共通テスト基礎〜標準。1〜2段の変形を含める。' + JUNIOR_HIGH_BAN;
  }
  if (difficulty === 3) {
    return (
      subjectHint +
      '★3: 典型入試・共通テスト標準。2条件の連立、エネルギー保存、滴定、気体発生などを含めてよい。' +
      JUNIOR_HIGH_BAN
    );
  }
  if (difficulty === 4) {
    return (
      subjectHint +
      '★4: 難関大・国公立二次の標準。場合分けと条件の言い換えが必須。公式への数値代入だけは禁止。' +
      SUBJECT_RUBRIC
    );
  }
  return `${subjectHint}${STAR5_CORE_RULES} ${STAR5_FIELD_EXAMPLES} ${SUBJECT_RUBRIC}`;
}

export function buildProblemSystemPrompt(options: {
  difficulty: number;
  subject?: Subject;
  unitTitle?: string;
  userRequest?: boolean;
  examPaper?: boolean;
}): string {
  const subject = options.subject ?? 'math';
  const tierGuide = buildDifficultyGuide(options.difficulty, subject);
  const examLead = options.examPaper
    ? 'あなたは難関大学入試の作問委員である。高校数学・物理・化学の「大問」を作成する。'
    : 'あなたは高校生向けの数学・物理・化学の問題作成AIです。';

  return (
    examLead +
    SUBJECT_RUBRIC +
    JUNIOR_HIGH_BAN +
    LATEX_EXPLANATION_RULES +
    '出力は必ずJSON形式のみとし、余計な説明文を含めないでください。' +
    '再利用可能なテンプレート（変数の範囲・計算ロジックJS・テンプレート文）を生成してください。' +
    'calcLogicJSはJavaScriptの関数本体の文字列で、引数varsを受け取り、' +
    '{ vars: object, correctAnswer: string | number, explanationSteps?: string[] } を返してください。' +
    'correctAnswer は空文字・未定義・null 禁止。入力問題は必ず具体的な数値、または完全に求めた式（例: $x=\\pm 2$）を返す。' +
    '例: $x=\\frac{\\sqrt{a}+\\sqrt{b}}{\\sqrt{a}-\\sqrt{b}}$ と逆数の y について $x^2+y^2$ を問うなら、a,b は具体整数にし、correctAnswer は (2(a+b)/(a-b))^2-2 を四捨五入した整数（a=6,b=5 なら 482、a=3,b=2 なら 98）。固定値 98 を使い回さない。' +
    'explanationSteps の各要素にも $...$ の途中式を含める。' +
    '2次関数・一次関数・三角関数のグラフ問題では、クライアント側SVG描画のため vars に係数を必ず含める。' +
    'quadratic は a,b,c または a,p,q。linear は m,b。sine は amplitude,frequency。画像生成は使わない。' +
    '三角形・円・接線・ベクトル・点と直線の問題では geometryScene を必ず付ける。' +
    'geometryScene は { points:[{id,x,y,label}], segments:[{from,to,dashed?,label?}], circles:[{cx,cy,r,dashed?,label?}], ' +
    'angles:[{vertex,from,to,label}], vectors:[{from,to,label}], tangents:[{from,to}], caption }。座標は -10〜10 程度。' +
    VISUAL_TYPE_PROMPT_RULES +
    '難易度指定に従い、問題の構造そのものを劇的に分岐させてください。' +
    '★4以上では「計算するだけ」の問題を出してはいけない。' +
    (options.unitTitle ? `今回の単元タイトルは「${options.unitTitle}」。この単元から逸脱しない。` : '') +
    (options.userRequest ? 'ユーザーの作問リクエスト（userRequest）の単元・難易度・出題形式を最優先で反映してください。' : '') +
    tierGuide
  );
}

export function buildMockExamSystemPrompt(
  difficulty: number,
  questionCount: number,
  subjects: Subject[] = ['math']
): string {
  const meta = getDifficultyMeta(difficulty);
  const tier = getDifficultyTier(difficulty);
  const primary = subjects[0] ?? 'math';
  return (
    buildProblemSystemPrompt({ difficulty, subject: primary, examPaper: true }) +
    `今回は模試として大問をちょうど ${questionCount} 問、難易度 ${meta.starLabel}${meta.label}（tier=${tier}）で作成する。` +
    `出題科目の集合: ${subjects.join(', ')}。各スロットの subject / unitTitle を守る。` +
    '各問は独立した大問とし、小問の羅列だけの中学ドリルにしてはならない。' +
    'problems 配列のみを返す。'
  );
}

export function isLowQualityDummyQuestion(text: string, difficulty = 5): boolean {
  const t = text.replace(/\s+/g, '');
  if (/中学/.test(t)) return true;
  if (/展開/.test(t) && /定数項/.test(t)) return true;
  if (/\(x[+\-±]/.test(t) && /定数項/.test(t)) return true;
  if (difficulty < 4) return false;
  if (/人の中から\d*人を選ぶ組合せ/.test(text)) return true;
  if (/最大公約数を、ユークリッド/.test(text)) return true;
  if (/を\(x-/.test(t) && /割ったときの余り/.test(t) && !/1次/.test(t)) return true;
  if (/真上に投げ上げた物体の/.test(text) && /秒後の速度/.test(text)) return true;
  if (/オームの法則に従う抵抗/.test(text) && /電流/.test(text)) return true;
  if (/半減期が/.test(text) && /残っている質量/.test(text)) return true;
  if (/分子量.*物質量/.test(text) && /g のとき/.test(text)) return true;
  return false;
}

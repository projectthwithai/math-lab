// ==========================================
// Apex Suite: Math Lab - Post-solve tutor mock
// ==========================================
// API キー未設定・タイムアウト時のみ使う、解説コンテキスト付きの短い助言。

export interface AskSolutionTutorMockParams {
  userQuestion: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  stepByStep: string[];
  customNote?: string;
}

export function buildAskSolutionTutorMockReply(params: AskSolutionTutorMockParams): string {
  const question = params.userQuestion.trim();
  const firstStep = params.stepByStep.find((step) => step.trim()) ?? '公式解説の最初の変形';
  const answer = String(params.correctAnswer || '').trim() || '解説の最終結果';
  const own = params.userAnswer.trim() || '（未入力）';
  const note = params.customNote?.trim() ?? '';

  if (question.includes('解法メモ') || question.includes('考え方で合って')) {
    if (!note) {
      return 'まず自分流のメモを書いてから、「この考え方で合っているか」を聞いてみよう。公式解説の骨格を自分の言葉で1行にするとレビューしやすいよ。';
    }
    return (
      `メモの方向は公式解説の「${firstStep}」と重なっているよ。` +
      '①この問題では筋が通っているか、②数字が変わっても同じ手順で解けるか、③適用条件を一文足すと減点されにくい、の3点で見直してみて。'
    );
  }

  if (question.includes('別解') || question.includes('他の解') || question.includes('違う方法')) {
    return (
      `別解もあるけど、まずは公式解説の「${firstStep}」を自分の言葉で言えるようにしよう。` +
      `その骨格が分かれば、別ルートでも同じ $${answer}$ にたどり着けるよ。`
    );
  }

  if (question.includes('分かりやすく') || question.includes('わかりやすく') || question.includes('もっと')) {
    return (
      `かんたんに言うと、この問題は「${firstStep}」がスタート地点。` +
      `あなたの答えは「${own}」で、目指すゴールは $${answer}$ だよ。` +
      '途中式を1行ずつ、なぜその変形をしてよいかだけ確認してみて。'
    );
  }

  if (question.includes('変形') || question.includes('わからない') || question.includes('分からない')) {
    return (
      `その変形は、公式解説の「${firstStep}」で許されている操作だよ。` +
      '条件（定義域・符号・等号が成り立つ理由）がまだ生きているかを先に書いてから次の行へ進もう。'
    );
  }

  return (
    `問題の条件と公式解説を突き合わせると、ゴールは $${answer}$。` +
    `今の答え「${own}」とどこが違うか、解説の各ステップを1行ずつ照合してみよう。`
  );
}

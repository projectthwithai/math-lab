// ==========================================
// Apex Suite: Math Lab - Counter-example problem mock
// ==========================================
// LLM 未設定・失敗時のフォールバック。生徒の過一般化した解法が
// 破綻する具体的な反例を 2 問返す。

import type { GeneratedProblem, Subject } from '@/types/mathLab';
import { ensureProblemHasCorrectAnswer } from '@/lib/engine/correctAnswer';

export interface CounterProblemMockParams {
  questionText: string;
  customNote: string;
  aiFeedback: string;
  subject?: Subject;
  unit?: string;
}

function inferSubject(questionText: string, fallback?: Subject): Subject {
  if (fallback) return fallback;
  if (/電流|電圧|抵抗|力|加速度|運動|波|熱|物理/.test(questionText)) return 'physics';
  if (/mol|モル|酸|塩基|酸化|還元|化学|イオン/.test(questionText)) return 'chemistry';
  return 'math';
}

function stampTrap(problem: GeneratedProblem): GeneratedProblem {
  const titled = problem.title.startsWith('⚠️')
    ? problem
    : { ...problem, title: `⚠️ 罠パターン: ${problem.title}` };
  return ensureProblemHasCorrectAnswer({
    ...titled,
    fromDiscoveredPattern: true,
    patternId: titled.patternId ?? titled.id,
  });
}

export function generateCounterProblemsMock(params: CounterProblemMockParams): GeneratedProblem[] {
  const subject = inferSubject(params.questionText, params.subject);
  const unit = params.unit?.trim() || (subject === 'math' ? '方程式' : subject === 'physics' ? '力学' : '化学反応');
  const note = params.customNote.trim() || 'この解法をいつでも使えると思い込む';
  const stamp = Date.now();

  const mathProblems: GeneratedProblem[] = [
    {
      id: `trap-mock-${stamp}-1`,
      patternId: `trap-cancel-${stamp}-1`,
      subject: 'math',
      unit,
      title: '両辺を割ると消える解',
      difficulty: 3,
      format: 'input',
      questionText:
        '方程式 $x(x-5)=0$ を解け。両辺を $x$ で割ってよいと考えたとき、失われる解を答えよ。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '0',
      hints: [
        '両辺を同じ式で割る前に、その式が $0$ になり得ないか確認する。',
        '$x=0$ を代入して元の方程式が成り立つか確かめる。',
        '因数分解 $x(x-5)=0$ なら各因数 $=0$ が解である。',
      ],
      explanation: {
        stepByStep: [
          `生徒のメモ「${note}」を機械的に使うと、$x$ で割って $x=5$ だけが残る。`,
          '$x=0$ のとき左辺は $0$ なので、これも元の方程式の解である。',
          '正しい方針は因数分解し、$x=0$ または $x=5$ と場合分けすること。',
        ],
        keyFormula: '$ab=0 \\Rightarrow a=0$ または $b=0$',
        commonMistakes: '両辺を変数で割って $x=0$ を落とす。解の公式や約分を適用条件なしに使う。',
      },
    },
    {
      id: `trap-mock-${stamp}-2`,
      patternId: `trap-domain-${stamp}-2`,
      subject: 'math',
      unit,
      title: '平方根の中が負になる代入',
      difficulty: 3,
      format: 'choice',
      questionText:
        '関数 $y=\\sqrt{x-4}+\\sqrt{8-x}$ の定義域に含まれる値はどれか。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '6',
      choices: ['0', '3', '6', '10'],
      hints: [
        '中身 $x-4\\ge 0$ かつ $8-x\\ge 0$ が同時に必要。',
        '定義域は $4\\le x\\le 8$。',
        '選択肢を定義域に当てはめる。',
      ],
      explanation: {
        stepByStep: [
          `メモの手順を数字だけ変えて使うと、$x=0$ や $x=10$ にも同じ変形を適用してしまう。`,
          '$x-4\\ge 0$ かつ $8-x\\ge 0$ より $4\\le x\\le 8$。',
          '選択肢のうち定義域に入るのは $6$ だけ。',
        ],
        keyFormula: '$\\sqrt{A}$ が実数 $\\Leftrightarrow A\\ge 0$',
        commonMistakes: '公式の形だけ見て定義域・場合分けを飛ばす。',
      },
    },
  ];

  const physicsProblems: GeneratedProblem[] = [
    {
      id: `trap-mock-${stamp}-1`,
      patternId: `trap-accel-${stamp}-1`,
      subject: 'physics',
      unit,
      title: '等加速度の公式が使えない',
      difficulty: 3,
      format: 'input',
      questionText:
        '速度が $v=t^2$（m/s）で変わる運動で、$t=0$ から $t=2$ s までの変位（m）を求めよ。$v=v_0+at$ は使えない。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '8/3',
      hints: [
        '加速度が一定でないので $v=v_0+at$ は使えない。',
        '変位は $x=\\int v\\,dt$。',
        '$\\int_0^2 t^2\\,dt = [t^3/3]_0^2$。',
      ],
      explanation: {
        stepByStep: [
          `生徒のメモ「${note}」の等加速度公式は $a$ が一定のときだけ成立する。`,
          '$v=t^2$ なら $a=2t$ で一定ではない。',
          '変位は $\\int_0^2 t^2 dt = 8/3$ m。',
        ],
        keyFormula: '$x=\\int v\\,dt$（$a$ が一定でないとき）',
        commonMistakes: '等加速度直線運動の公式を加速度が変化する問題にそのまま使う。',
      },
    },
    {
      id: `trap-mock-${stamp}-2`,
      patternId: `trap-force-${stamp}-2`,
      subject: 'physics',
      unit,
      title: '合力ゼロでも仕事が残る',
      difficulty: 3,
      format: 'choice',
      questionText:
        '水平面を一定の速さで $10$ m 動かすとき、摩擦力 $5$ N がする仕事（J）はどれか。合力が $0$ だから仕事も $0$ と考えてよいか。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '-50',
      choices: ['0', '-50', '50', '5'],
      hints: [
        '仕事は力ごとに $W=F s \\cos\\theta$ で計算する。',
        '合力が $0$ でも、摩擦力の仕事は $0$ とは限らない。',
        '摩擦力は変位と逆向きなので負。',
      ],
      explanation: {
        stepByStep: [
          '合力が $0$ でも、個々の力の仕事は相殺するだけで各力の仕事は $0$ ではない。',
          '摩擦力は変位と逆向きなので $W=-5\\times 10=-50$ J。',
          '「合力ゼロ＝仕事ゼロ」は過一般化である。',
        ],
        keyFormula: '$W=Fs\\cos\\theta$',
        commonMistakes: '合力が $0$ なら仕事も $0$ だと決めつける。',
      },
    },
  ];

  const chemistryProblems: GeneratedProblem[] = [
    {
      id: `trap-mock-${stamp}-1`,
      patternId: `trap-mole-${stamp}-1`,
      subject: 'chemistry',
      unit,
      title: '係数を無視したモル比',
      difficulty: 3,
      format: 'input',
      questionText:
        '$2\\mathrm{H}_2+\\mathrm{O}_2\\rightarrow 2\\mathrm{H}_2\\mathrm{O}$ で $\\mathrm{O}_2$ が $2$ mol あるとき、反応できる $\\mathrm{H}_2$ は何 mol か。「同じモル同士」で計算してはいけない。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '4',
      hints: [
        '係数比は $\\mathrm{H}_2:\\mathrm{O}_2=2:1$。',
        '$\\mathrm{O}_2$ $1$ mol につき $\\mathrm{H}_2$ は $2$ mol。',
        '$2$ mol の酸素なら水素は $4$ mol。',
      ],
      explanation: {
        stepByStep: [
          `メモ「${note}」で物質量を 1:1 と置くと $\\mathrm{H}_2$ も $2$ mol になり誤答する。`,
          '反応式の係数比 $2:1$ を使う。',
          '$\\mathrm{O}_2$ $2$ mol に対し $\\mathrm{H}_2$ は $4$ mol。',
        ],
        keyFormula: '化学反応の量的関係は係数比',
        commonMistakes: '係数を無視して同じモル数で反応すると考える。',
      },
    },
    {
      id: `trap-mock-${stamp}-2`,
      patternId: `trap-ph-${stamp}-2`,
      subject: 'chemistry',
      unit,
      title: '中和で pH=7 とは限らない',
      difficulty: 3,
      format: 'choice',
      questionText:
        '酢酸と水酸化ナトリウムを過不足なく中和した水溶液の液性として正しいものはどれか。',
      visualType: 'none',
      visualConfig: { type: 'none', params: {} },
      correctAnswer: '弱塩基性',
      choices: ['中性', '弱酸性', '弱塩基性', '強酸性'],
      hints: [
        '弱酸と強塩基の塩は加水分解する。',
        '酢酸ナトリウム水溶液は塩基性。',
        '「中和＝pH7」は強酸・強塩基のときだけ。',
      ],
      explanation: {
        stepByStep: [
          '強酸と強塩基の中和だけが pH 7 になる。',
          '酢酸ナトリウムの加水分解で $\\mathrm{OH}^-$ が生じる。',
          '液性は弱塩基性。',
        ],
        keyFormula: '弱酸の塩は加水分解して塩基性',
        commonMistakes: '中和完了なら必ず中性と決めつける。',
      },
    },
  ];

  const pool =
    subject === 'physics' ? physicsProblems : subject === 'chemistry' ? chemistryProblems : mathProblems;

  return pool.map(stampTrap);
}

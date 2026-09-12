// ==========================================
// Apex Suite: Math Lab - LaTeX サニタイザ
// ==========================================
// JS文字列リテラルで壊れたバックスラッシュ（\v→垂直タブ、\d→欠落 等）を
// KaTeXが解釈できるコマンドへ復元する。throwOnError: false と併用し、
// 赤文字の生コードエラーを画面に出さない。

import katex from 'katex';
import { cleanLatexFormula } from '@/lib/utils/mathFormatter';

/** JSの1文字エスケープで潰れるLaTeXコマンドの「制御文字 + 残りの綴り」 */
const CONTROL_RESTORES: Array<{ code: number; suffixes: string[] }> = [
  {
    code: 0x0b, // \v → vertical tab
    suffixes: ['ec', 'ert', 'arphi', 'arepsilon', 'arpi', 'arsigma', 'artheta', 'arnothing', 'dots', 'ee', 'angle'],
  },
  {
    code: 0x0c, // \f → form feed
    suffixes: ['rac', 'orall', 'loor', 'rown'],
  },
  {
    code: 0x08, // \b → backspace
    suffixes: ['inom', 'egin', 'igwedge', 'igcap', 'igcup', 'igvee', 'ullet', 'eta', 'ar', 'ig', 'mod', 'oxplus', 'ox'],
  },
  {
    code: 0x09, // \t → tab
    suffixes: ['imes', 'riangleq', 'riangle', 'extrm', 'extstyle', 'ext', 'heta', 'ilde', 'au', 'an', 'o'],
  },
  {
    code: 0x0a, // \n → newline
    suffixes: ['rightarrow', 'leftarrow', 'otin', 'abla', 'eq', 'u', 'i', 'ot', 'll'],
  },
  {
    code: 0x0d, // \r → CR
    suffixes: ['ightarrow', 'ightleftharpoons', 'ight', 'ho', 'angle', 'ceil', 'brack', 'm'],
  },
];

/**
 * `\d` は制御文字ではなくバックスラッシュごと消える。
 * 残った綴りから元コマンドを復元する。
 */
const CONTROL_LETTER: Record<number, string> = {
  0x08: 'b',
  0x09: 't',
  0x0a: 'n',
  0x0b: 'v',
  0x0c: 'f',
  0x0d: 'r',
};

const DROPPED_D_COMMANDS: Array<[RegExp, string]> = [
  [/(?<![A-Za-z\\])isplaystyle(?![A-Za-z])/g, '\\displaystyle'],
  [/(?<![A-Za-z\\])binom(?![A-Za-z])/g, '\\dbinom'],
  [/(?<![A-Za-z\\])elta(?![A-Za-z])/g, '\\delta'],
  [/(?<![A-Za-z\\])dots(?![A-Za-z])/g, '\\ddots'],
  [/(?<![A-Za-z\\])agger(?![A-Za-z])/g, '\\dagger'],
  [/(?<![A-Za-z\\])iv(?![A-Za-z])/g, '\\div'],
  [/(?<![A-Za-z\\])eg(?![A-Za-z])/g, '\\deg'],
  [/(?<![A-Za-z\\])et(?![A-Za-z])/g, '\\det'],
  [/(?<![A-Za-z\\])ot(?![A-Za-z])/g, '\\dot'],
];

const LATEX_COMMANDS = [
  'displaystyle',
  'operatorname',
  'overrightarrow',
  'overleftarrow',
  'Leftrightarrow',
  'rightarrow',
  'leftarrow',
  'Rightarrow',
  'Leftrightarrow',
  'varepsilon',
  'vartheta',
  'varsigma',
  'varrho',
  'triangleq',
  'triangle',
  'overline',
  'underline',
  'overbrace',
  'underbrace',
  'substack',
  'mathbb',
  'mathbf',
  'mathrm',
  'mathcal',
  'mathfrak',
  'mathsf',
  'texttt',
  'textbf',
  'textit',
  'textrm',
  'dfrac',
  'tfrac',
  'binom',
  'dbinom',
  'tfrac',
  'frac',
  'sqrt',
  'sum',
  'prod',
  'int',
  'iint',
  'iiint',
  'oint',
  'lim',
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'log',
  'ln',
  'lg',
  'exp',
  'min',
  'max',
  'sup',
  'inf',
  'arg',
  'deg',
  'det',
  'dim',
  'ker',
  'gcd',
  'Pr',
  'vec',
  'bar',
  'hat',
  'dot',
  'ddot',
  'tilde',
  'check',
  'breve',
  'acute',
  'grave',
  'cdot',
  'times',
  'div',
  'pm',
  'mp',
  'oplus',
  'otimes',
  'oslash',
  'cap',
  'cup',
  'sqcap',
  'sqcup',
  'wedge',
  'vee',
  'infty',
  'partial',
  'nabla',
  'hbar',
  'ell',
  'Re',
  'Im',
  'aleph',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'zeta',
  'eta',
  'theta',
  'iota',
  'kappa',
  'lambda',
  'mu',
  'nu',
  'xi',
  'pi',
  'rho',
  'sigma',
  'tau',
  'upsilon',
  'phi',
  'chi',
  'psi',
  'omega',
  'Gamma',
  'Delta',
  'Theta',
  'Lambda',
  'Xi',
  'Pi',
  'Sigma',
  'Upsilon',
  'Phi',
  'Psi',
  'Omega',
  'leq',
  'geq',
  'neq',
  'approx',
  'equiv',
  'sim',
  'simeq',
  'cong',
  'propto',
  'prec',
  'succ',
  'perp',
  'parallel',
  'angle',
  'measuredangle',
  'triangle',
  'circ',
  'bullet',
  'star',
  'dagger',
  'forall',
  'exists',
  'nexists',
  'neg',
  'emptyset',
  'varnothing',
  'subset',
  'supset',
  'subseteq',
  'supseteq',
  'in',
  'notin',
  'ni',
  'land',
  'lor',
  'implies',
  'iff',
  'mapsto',
  'to',
  'gets',
  'uparrow',
  'downarrow',
  'left',
  'right',
  'bigl',
  'bigr',
  'Bigl',
  'Bigr',
  'big',
  'Big',
  'quad',
  'qquad',
  'hspace',
  'vspace',
  'phantom',
  'begin',
  'end',
  'over',
  'choose',
  'text',
  'mbox',
  'color',
  'colon',
  'because',
  'therefore',
  'cdots',
  'ldots',
  'vdots',
  'ddots',
  'dots',
  'mid',
  'vert',
  'Vert',
  'lVert',
  'rVert',
  'langle',
  'rangle',
  'lfloor',
  'rfloor',
  'lceil',
  'rceil',
  'backslash',
  'quad',
].filter((command, index, all) => all.indexOf(command) === index)
  .sort((a, b) => b.length - a.length);

const MISSING_COMMAND_RE = new RegExp(`(?<![\\\\A-Za-z])(${LATEX_COMMANDS.join('|')})(?![A-Za-z])`, 'g');

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function restoreControlEscapes(source: string): string {
  let result = '';
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    const restore = CONTROL_RESTORES.find((item) => item.code === code);
    if (!restore) {
      result += source[index];
      continue;
    }
    const rest = source.slice(index + 1);
    const suffix = [...restore.suffixes]
      .sort((a, b) => b.length - a.length)
      .find((item) => rest.startsWith(item) && !/[A-Za-z]/.test(rest.charAt(item.length)));
    if (suffix) {
      result += `\\${CONTROL_LETTER[code]}${suffix}`;
      index += suffix.length;
      continue;
    }
    result += source[index];
  }
  return result;
}

function restoreDroppedDCommands(source: string): string {
  return DROPPED_D_COMMANDS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), source);
}

function restoreMissingBackslashes(math: string): string {
  return math.replace(MISSING_COMMAND_RE, '\\$1');
}

function sanitizeMathSegment(math: string): string {
  return restoreMissingBackslashes(restoreDroppedDCommands(restoreControlEscapes(math)));
}

/**
 * 破損したバックスラッシュを修復した LaTeX / 混在テキストを返す。
 */
export function sanitizeLatex(source: string): string {
  if (!source) return source;
  const cleaned = cleanLatexFormula(source);
  const restored = restoreDroppedDCommands(restoreControlEscapes(cleaned));
  if (!/\$/.test(restored)) {
    const hasCjk = /[\u3040-\u30ff\u3400-\u9fff]/.test(restored);
    const looksLikeLatex = /\\[A-Za-z]+|[_^]|[=<>]/.test(restored);
    if (!hasCjk || looksLikeLatex) return restoreMissingBackslashes(restored);
    return restored;
  }

  return restored
    .split(/(\$[^$]*\$)/g)
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        return `$${sanitizeMathSegment(part.slice(1, -1))}$`;
      }
      return part;
    })
    .join('');
}

function renderKatexHtml(math: string, displayMode: boolean): string {
  try {
    const html = katex.renderToString(math, {
      throwOnError: false,
      errorColor: '#64748b',
      strict: false,
      trust: true,
      displayMode,
      output: 'html',
    });
    return html.replace(/<span class="katex-error"[^>]*title="[^"]*"[^>]*>[\s\S]*?<\/span>/g, () => {
      return `<span class="text-slate-400">${escapeHtml(math)}</span>`;
    });
  } catch {
    return `<span class="text-slate-400">${escapeHtml(math)}</span>`;
  }
}

/**
 * `$...$` 混在テキスト、または純LaTeXを安全にHTML化する。
 * 赤文字の KaTeX エラーは出さない。
 */
export function sanitizeAndRenderLatex(text: string, displayMode: boolean): string {
  const sanitized = sanitizeLatex(text);
  const segments = sanitized.split(/\$([^$]+)\$/g);
  const hasDollar = /\$/.test(sanitized);

  if (!hasDollar) {
    const hasCjk = /[\u3040-\u30ff\u3400-\u9fff]/.test(sanitized);
    if (hasCjk) {
      return escapeHtml(sanitized).replace(/\n/g, '<br />');
    }
    return renderKatexHtml(sanitized, displayMode);
  }

  return segments
    .map((segment, index) => {
      const isMathSegment = index % 2 === 1;
      if (!isMathSegment) {
        return escapeHtml(segment).replace(/\n/g, '<br />');
      }
      return renderKatexHtml(sanitizeMathSegment(segment), displayMode);
    })
    .join('');
}

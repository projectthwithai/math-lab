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

/**
 * `\text{[m/s^2]}` のように単位として書かれた `\text{}` を `\mathrm{}` へ直す。
 * `\text` 内の `^` は KaTeX でエラーになり生コードが露出するため。
 */
function rewriteTextUnitsToMathrm(math: string): string {
  return math.replace(/\\text\{([^{}]*)\}/g, (full, body: string) => {
    const looksLikeUnit =
      /[\^_]/.test(body) ||
      /\//.test(body) ||
      /^\s*\[[^\]]+\]\s*$/.test(body);
    if (!looksLikeUnit) return full;
    return `\\mathrm{${body}}`;
  });
}

function sanitizeMathSegment(math: string): string {
  return restoreMissingBackslashes(
    rewriteTextUnitsToMathrm(restoreDroppedDCommands(restoreControlEscapes(math)))
  );
}

/** `$` で包む対象。単位・分数・化学式が問題文の生テキストとして漏れないようにする */
const PREFIX_MATH_COMMANDS = new Set([
  'sum',
  'prod',
  'int',
  'iint',
  'iiint',
  'oint',
  'lim',
  'displaystyle',
  'textstyle',
  'scriptstyle',
  'limits',
  'nolimits',
]);

const WRAP_BRACE_COMMANDS = new Set([
  'text',
  'mathrm',
  'mathbf',
  'mathit',
  'mathsf',
  'mathtt',
  'mathbb',
  'mathcal',
  'mathfrak',
  'textrm',
  'textbf',
  'textit',
  'mbox',
  'frac',
  'dfrac',
  'tfrac',
  'cfrac',
  'binom',
  'dbinom',
  'sqrt',
  'overline',
  'underline',
  'overrightarrow',
  'overleftarrow',
  'vec',
  'hat',
  'bar',
  'dot',
  'ddot',
  'tilde',
  'operatorname',
  'boldsymbol',
]);

const SKIP_WRAP_COMMANDS = new Set([
  'begin',
  'end',
  'left',
  'right',
  'bigl',
  'bigr',
  'Bigl',
  'Bigr',
  'big',
  'Big',
]);

function skipHorizontalSpace(source: string, start: number): number {
  let index = start;
  while (index < source.length && /[ \t]/.test(source[index] ?? '')) {
    index += 1;
  }
  return index;
}

function readBalancedGroup(source: string, start: number, open: '{' | '[', close: '}' | ']'): number {
  if (source[start] !== open) return start;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return source.length;
}

function readSupSubSuffix(source: string, start: number): number {
  let index = start;
  while (index < source.length && (source[index] === '^' || source[index] === '_')) {
    index += 1;
    if (source[index] === '{') {
      index = readBalancedGroup(source, index, '{', '}');
      continue;
    }
    if (source[index] === '\\') {
      const command = source.slice(index).match(/^\\[A-Za-z]+/);
      index += command ? command[0].length : 1;
      continue;
    }
    if (index < source.length) index += 1;
  }
  return index;
}

function readWrapableLatex(source: string, start: number): number {
  if (source[start] !== '\\') return start;
  const match = source.slice(start).match(/^\\([A-Za-z]+)/);
  if (!match) return start;
  const name = match[1];
  if (SKIP_WRAP_COMMANDS.has(name)) return start;

  let index = start + match[0].length;
  index = skipHorizontalSpace(source, index);

  let hadOptionalBrackets = false;
  if (source[index] === '[') {
    index = readBalancedGroup(source, index, '[', ']');
    hadOptionalBrackets = true;
  }

  let groups = 0;
  for (;;) {
    const next = skipHorizontalSpace(source, index);
    if (source[next] !== '{') break;
    index = readBalancedGroup(source, next, '{', '}');
    groups += 1;
  }

  const shouldWrap =
    groups > 0 ||
    PREFIX_MATH_COMMANDS.has(name) ||
    (WRAP_BRACE_COMMANDS.has(name) && hadOptionalBrackets);
  if (!shouldWrap) return start;

  index = readSupSubSuffix(source, index);

  if (name === 'sum' || name === 'prod' || name === 'int' || name === 'iint' || name === 'iiint') {
    const next = skipHorizontalSpace(source, index);
    if (source.slice(next).startsWith('\\limits') || source.slice(next).startsWith('\\nolimits')) {
      const command = source.slice(next).match(/^\\[A-Za-z]+/);
      index = next + (command?.[0].length ?? 0);
      index = readSupSubSuffix(source, index);
    }
  }

  if (name === 'displaystyle' || name === 'textstyle' || name === 'scriptstyle') {
    const next = skipHorizontalSpace(source, index);
    if (source[next] === '\\') {
      const followEnd = readWrapableLatex(source, next);
      if (followEnd > next) index = followEnd;
    } else if (source[next] === '{') {
      index = readBalancedGroup(source, next, '{', '}');
      index = readSupSubSuffix(source, index);
    }
  }

  return index;
}

export type LatexChunkKind = 'display' | 'inline' | 'text';

export interface LatexChunk {
  kind: LatexChunkKind;
  value: string;
}

/** `$...$` と `$$...$$` を先に切り出す。display を優先する。 */
export function splitLatexChunks(source: string): LatexChunk[] {
  if (!source) return [];
  const chunks: LatexChunk[] = [];
  const matcher = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(source))) {
    if (match.index > lastIndex) {
      chunks.push({ kind: 'text', value: source.slice(lastIndex, match.index) });
    }
    if (match[1] != null) {
      chunks.push({ kind: 'display', value: match[1] });
    } else {
      chunks.push({ kind: 'inline', value: match[2] ?? '' });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < source.length) {
    chunks.push({ kind: 'text', value: source.slice(lastIndex) });
  }
  return chunks;
}

function renderMarkdownPlain(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

function wrapBareLatexInPlainText(text: string): string {
  let result = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] === '\\') {
      const end = readWrapableLatex(text, index);
      if (end > index) {
        result += `$${text.slice(index, end)}$`;
        index = end;
        continue;
      }
    }
    result += text[index];
    index += 1;
  }
  return result;
}

/**
 * `$` の外側にある `\text{}` / `\mathrm{}` / `\frac{}{}` などを `$...$` で包む。
 * 既に数式区間内にあるコマンドは触らない（再実行しても冪等）。
 */
export function wrapBareLatexOutsideMath(source: string): string {
  if (!source) return source;
  return splitLatexChunks(source)
    .map((chunk) => {
      if (chunk.kind === 'display') return `$$${chunk.value}$$`;
      if (chunk.kind === 'inline') return `$${chunk.value}$`;
      return wrapBareLatexInPlainText(chunk.value);
    })
    .join('');
}

/**
 * 破損したバックスラッシュを修復した LaTeX / 混在テキストを返す。
 */
export function sanitizeLatex(source: string): string {
  if (!source) return source;
  const cleaned = cleanLatexFormula(source);
  const restored = restoreDroppedDCommands(restoreControlEscapes(cleaned));
  const wrapped = wrapBareLatexOutsideMath(restored);
  if (!/\$/.test(wrapped)) {
    const hasCjk = /[\u3040-\u30ff\u3400-\u9fff]/.test(wrapped);
    const looksLikeLatex = /\\[A-Za-z]+|[_^]|[=<>]/.test(wrapped);
    if (!hasCjk || looksLikeLatex) return restoreMissingBackslashes(wrapped);
    return wrapped;
  }

  return splitLatexChunks(wrapped)
    .map((chunk) => {
      if (chunk.kind === 'display') return `$$${sanitizeMathSegment(chunk.value)}$$`;
      if (chunk.kind === 'inline') return `$${sanitizeMathSegment(chunk.value)}$`;
      return chunk.value;
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
 * `$` の外側の剥き出し単位（`\text{[m/s^2]}` 等）は自動で数式化する。
 * 赤文字の KaTeX エラーは出さない。
 */
export function sanitizeAndRenderLatex(text: string, displayMode: boolean): string {
  const sanitized = sanitizeLatex(text);
  const chunks = splitLatexChunks(sanitized);
  const hasMath = chunks.some((chunk) => chunk.kind !== 'text');

  if (!hasMath) {
    const hasCjk = /[\u3040-\u30ff\u3400-\u9fff]/.test(sanitized);
    if (hasCjk) {
      return renderMarkdownPlain(sanitized);
    }
    return renderKatexHtml(sanitized, displayMode);
  }

  return chunks
    .map((chunk) => {
      if (chunk.kind === 'text') return renderMarkdownPlain(chunk.value);
      return renderKatexHtml(sanitizeMathSegment(chunk.value), chunk.kind === 'display' || displayMode);
    })
    .join('');
}

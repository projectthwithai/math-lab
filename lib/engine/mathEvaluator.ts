// ==========================================
// Apex Suite: Math Lab - 数学的同値性エンジン
// ==========================================
// 因数の積の順不同・解のカンマ順不同・全角半角/空白/アスタリスクのゆれを吸収して採点する。

const FULLWIDTH_OFFSET = 0xfee0;

function toHalfWidth(value: string): string {
  return value.replace(/[\uff01-\uff5e]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_OFFSET)
  );
}

/** 空白・全角・LaTeX飾り・掛け算記号を落として比較用の芯だけ残す */
export function normalizeMathAnswer(raw: string): string {
  let text = toHalfWidth(String(raw).trim());
  text = text.replace(/\$/g, '');
  text = text.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
  text = text.replace(/\\left|\\right/g, '');
  text = text.replace(/\\times|\\cdot|\\ast|\\,/g, '');
  text = text.replace(/\\pm/g, '±');
  text = text.replace(/（/g, '(').replace(/）/g, ')');
  text = text.replace(/［/g, '[').replace(/］/g, ']');
  text = text.replace(/＋/g, '+').replace(/－|−|—|–/g, '-');
  text = text.replace(/＝/g, '=').replace(/＊/g, '*');
  text = text.replace(/，|、/g, ',');
  text = text.replace(/×|⋅|∗|·|･/g, '');
  text = text.replace(/\*/g, '');
  text = text.replace(/[{}]/g, '');
  text = text.replace(/[\s\u3000]+/g, '');
  return text;
}

function normalizeTerm(term: string): string {
  let value = term.replace(/^\+/, '');
  value = value.replace(/^([+-]?)1(?=[A-Za-z(])/, '$1');
  return value;
}

/** (x+3) と (3+x) のように項の順不同も吸収する */
function canonicalizeFactor(expr: string): string {
  const source = expr.replace(/^\+/, '');
  if (!source) return '';
  const terms: string[] = [];
  let buffer = '';
  for (const char of source) {
    if ((char === '+' || char === '-') && buffer !== '' && buffer !== '+' && buffer !== '-') {
      terms.push(normalizeTerm(buffer));
      buffer = char === '+' ? '' : '-';
    } else {
      buffer += char;
    }
  }
  if (buffer !== '' && buffer !== '+' && buffer !== '-') {
    terms.push(normalizeTerm(buffer));
  }
  terms.sort();
  return terms.join('+').replace(/\+-/g, '-');
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of source) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === separator && depth === 0) {
      if (current) parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * カッコの積 `(式1)(式2)...` を因数ソートして標準化する。
 * 因数が2つ未満なら null。
 */
export function canonicalizeFactorProduct(normalized: string): string | null {
  const matches = [...normalized.matchAll(/\(([^()]*)\)/g)];
  if (matches.length < 2) return null;
  const remainder = normalized.replace(/\([^()]*\)/g, '');
  if (/[A-Za-z]/.test(remainder)) return null;
  const factors = matches.map((match) => canonicalizeFactor(match[1] ?? '')).sort();
  return `${remainder}${factors.map((factor) => `(${factor})`).join('')}`;
}

/**
 * カンマ区切りの複数解を分割・ソートする。
 * 要素が2つ未満なら null。
 */
export function canonicalizeSolutionList(normalized: string): string | null {
  const parts = splitTopLevel(normalized, ',')
    .map((part) => part.replace(/^[A-Za-z]=/, ''))
    .filter((part) => part.length > 0);
  if (parts.length < 2) return null;
  return parts.sort().join(',');
}

function parsePlainNumber(normalized: string): number | null {
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** 生徒解答と正解が数学的に同値なら true */
export function isMathAnswerEquivalent(userAns: string, correctAns: string): boolean {
  const userRaw = userAns.trim();
  const correctRaw = String(correctAns).trim();
  if (!userRaw || !correctRaw) return false;

  const user = normalizeMathAnswer(userRaw);
  const correct = normalizeMathAnswer(correctRaw);
  if (!user || !correct) return false;
  if (user === correct) return true;

  const userProduct = canonicalizeFactorProduct(user);
  const correctProduct = canonicalizeFactorProduct(correct);
  if (userProduct && correctProduct && userProduct === correctProduct) return true;
  if (userProduct && userProduct === correct) return true;
  if (correctProduct && correctProduct === user) return true;

  const userList = canonicalizeSolutionList(user);
  const correctList = canonicalizeSolutionList(correct);
  if (userList && correctList && userList === correctList) return true;

  const userNum = parsePlainNumber(user);
  const correctNum = parsePlainNumber(correct);
  if (userNum != null && correctNum != null) {
    return Math.abs(userNum - correctNum) < 0.05;
  }

  return false;
}

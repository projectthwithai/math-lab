// ==========================================
// Apex Suite: Math Lab - Scientific Calculator Engine
// ==========================================
// ユーザー入力を再帰下降で評価する（任意 JS の eval は使わない）。

export type AngleMode = 'deg' | 'rad';

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { kind: 'id'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

export function evaluateCalculatorExpression(source: string, angleMode: AngleMode = 'deg'): number {
  const tokens = tokenize(source);
  if (tokens.length === 0) throw new Error('式が空です');
  let index = 0;

  const peek = () => tokens[index];
  const take = () => tokens[index++];

  const parseExpression = (): number => {
    let value = parseTerm();
    while (peek()?.kind === 'op') {
      const op = (peek() as Extract<Token, { kind: 'op' }>).value;
      if (op !== '+' && op !== '-') break;
      take();
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parsePower();
    while (peek()?.kind === 'op' && ((peek() as Extract<Token, { kind: 'op' }>).value === '*' || (peek() as Extract<Token, { kind: 'op' }>).value === '/')) {
      const op = (take() as Extract<Token, { kind: 'op' }>).value;
      const right = parsePower();
      if (op === '/') {
        if (right === 0) throw new Error('0 で割れません');
        value /= right;
      } else {
        value *= right;
      }
    }
    return value;
  };

  const parsePower = (): number => {
    const value = parseUnary();
    if (peek()?.kind === 'op' && (peek() as Extract<Token, { kind: 'op' }>).value === '^') {
      take();
      return value ** parsePower();
    }
    return value;
  };

  const parseUnary = (): number => {
    if (peek()?.kind === 'op' && (peek() as Extract<Token, { kind: 'op' }>).value === '-') {
      take();
      return -parseUnary();
    }
    if (peek()?.kind === 'op' && (peek() as Extract<Token, { kind: 'op' }>).value === '+') {
      take();
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    const token = peek();
    if (!token) throw new Error('式が途中で終わっています');

    if (token.kind === 'num') {
      take();
      return token.value;
    }

    if (token.kind === 'id') {
      take();
      if (token.value === 'pi') return Math.PI;
      if (peek()?.kind !== 'lparen') throw new Error(`${token.value} のあとに ( が必要です`);
      take();
      const arg = parseExpression();
      if (peek()?.kind !== 'rparen') throw new Error('括弧が閉じていません');
      take();
      return applyFunction(token.value, arg, angleMode);
    }

    if (token.kind === 'lparen') {
      take();
      const value = parseExpression();
      if (peek()?.kind !== 'rparen') throw new Error('括弧が閉じていません');
      take();
      return value;
    }

    throw new Error('式を解釈できません');
  };

  const result = parseExpression();
  if (index < tokens.length) throw new Error('式の末尾に余分な文字があります');
  if (!Number.isFinite(result)) throw new Error('計算できませんでした');
  return result;
}

function applyFunction(name: string, arg: number, angleMode: AngleMode): number {
  const angle = angleMode === 'deg' ? (arg * Math.PI) / 180 : arg;
  switch (name) {
    case 'sin':
      return Math.sin(angle);
    case 'cos':
      return Math.cos(angle);
    case 'tan':
      return Math.tan(angle);
    case 'sqrt':
      if (arg < 0) throw new Error('負の数の平方根は計算できません');
      return Math.sqrt(arg);
    default:
      throw new Error(`未知の関数です: ${name}`);
  }
}

function tokenize(source: string): Token[] {
  const normalized = source
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  const tokens: Token[] = [];
  let i = 0;
  while (i < normalized.length) {
    const char = normalized[i];

    if (/[0-9.]/.test(char)) {
      const match = normalized.slice(i).match(/^\d*\.?\d+/);
      if (!match) throw new Error('数字の形式が不正です');
      tokens.push({ kind: 'num', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      const match = normalized.slice(i).match(/^[A-Za-z]+/);
      if (!match) throw new Error('識別子が不正です');
      tokens.push({ kind: 'id', value: match[0].toLowerCase() });
      i += match[0].length;
      continue;
    }

    if (char === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
      tokens.push({ kind: 'op', value: char });
      i += 1;
      continue;
    }

    throw new Error(`使えない文字です: ${char}`);
  }
  return tokens;
}

export function formatCalculatorResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

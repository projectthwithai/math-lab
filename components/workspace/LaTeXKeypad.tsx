'use client';

// ==========================================
// Apex Suite: Math Lab - LaTeX Keypad
// ==========================================
// 解答入力欄に記号を挿入するための数式キーパッド。

interface LaTeXKeypadProps {
  onInsert: (symbol: string) => void;
}

const KEYPAD_SYMBOLS: { label: string; insert: string }[] = [
  { label: '√', insert: '√' },
  { label: 'a/b', insert: '/' },
  { label: 'π', insert: 'π' },
  { label: 'θ', insert: 'θ' },
  { label: 'x²', insert: '^2' },
  { label: 'x³', insert: '^3' },
  { label: '±', insert: '±' },
  { label: '×', insert: '×' },
  { label: '÷', insert: '÷' },
  { label: '≦', insert: '≦' },
  { label: '≧', insert: '≧' },
  { label: '∞', insert: '∞' },
  { label: '°', insert: '°' },
  { label: 'Σ', insert: 'Σ' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
];

export default function LaTeXKeypad({ onInsert }: LaTeXKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {KEYPAD_SYMBOLS.map((symbol) => (
        <button
          key={symbol.label}
          type="button"
          onClick={() => onInsert(symbol.insert)}
        className="rounded-lg border border-slate-200 bg-white py-2 font-mono text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
        >
          {symbol.label}
        </button>
      ))}
    </div>
  );
}

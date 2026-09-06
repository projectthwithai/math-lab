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
          className="rounded-lg border border-slate-700 bg-slate-900 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
        >
          {symbol.label}
        </button>
      ))}
    </div>
  );
}

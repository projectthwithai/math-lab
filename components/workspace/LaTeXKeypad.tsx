'use client';

// ==========================================
// Apex Suite: Math Lab - 四隅添え字対応スマート数式テンキー
// ==========================================
// カーソル位置を見て ^{} / _{} / 左上・左下 を挿入し、KaTeX で即プレビューする。

import { useEffect, useRef, type ReactNode } from 'react';
import { Delete, Eraser } from 'lucide-react';

import KaTeXBlock from './KaTeXBlock';

interface LaTeXKeypadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type InsertMode = 'at' | 'after' | 'before-atom';

export default function LaTeXKeypad({ value, onChange, disabled = false }: LaTeXKeypadProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);

  useEffect(() => {
    const caret = caretRef.current;
    const area = areaRef.current;
    if (caret == null || !area) return;
    area.focus();
    area.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [value]);

  const applyInsert = (snippet: string, mode: InsertMode) => {
    if (disabled) return;
    const area = areaRef.current;
    const start = area?.selectionStart ?? value.length;
    const end = area?.selectionEnd ?? value.length;

    let insertAt = start;
    let restFrom = end;
    if (mode === 'after') {
      insertAt = end;
      restFrom = end;
    } else if (mode === 'before-atom') {
      insertAt = findAtomStart(value, start);
      restFrom = insertAt;
    }

    const next = value.slice(0, insertAt) + snippet + value.slice(restFrom);
    const brace = snippet.indexOf('{}');
    caretRef.current = brace >= 0 ? insertAt + brace + 1 : insertAt + snippet.length;
    onChange(next);
  };

  const insertPlain = (snippet: string) => applyInsert(snippet, 'at');

  const backspace = () => {
    if (disabled) return;
    const area = areaRef.current;
    const start = area?.selectionStart ?? value.length;
    const end = area?.selectionEnd ?? value.length;
    if (start !== end) {
      caretRef.current = start;
      onChange(value.slice(0, start) + value.slice(end));
      return;
    }
    if (start === 0) return;
    caretRef.current = start - 1;
    onChange(value.slice(0, start - 1) + value.slice(end));
  };

  const toggleSign = () => {
    if (disabled) return;
    if (value.startsWith('-')) {
      caretRef.current = Math.max(0, (areaRef.current?.selectionStart ?? 1) - 1);
      onChange(value.slice(1));
      return;
    }
    caretRef.current = (areaRef.current?.selectionStart ?? 0) + 1;
    onChange(`-${value}`);
  };

  const previewSource = value.trim().length === 0 ? '' : value.includes('$') ? value : `$${value}$`;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        ref={areaRef}
        value={value}
        disabled={disabled}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        placeholder="ここに解答を入力... テンキーで ^{} などを挿入できます"
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />

      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-cyan-400/80">KaTeX プレビュー</p>
        {previewSource ? (
          <KaTeXBlock content={previewSource} className="text-base text-slate-100" />
        ) : (
          <p className="text-xs text-slate-500">入力すると数式がここに表示されます</p>
        )}
      </div>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">四隅添え字</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CornerKey
            label="□ⁿ"
            hint="右上・累乗"
            disabled={disabled}
            onClick={() => applyInsert('^{}', 'after')}
          />
          <CornerKey
            label="□ₙ"
            hint="右下・添え字"
            disabled={disabled}
            onClick={() => applyInsert('_{}', 'after')}
          />
          <CornerKey
            label="ₙ□"
            hint="左下・nCr"
            disabled={disabled}
            onClick={() => applyInsert('{}_{}', 'before-atom')}
          />
          <CornerKey
            label="ⁿ□"
            hint="左上・質量数"
            disabled={disabled}
            onClick={() => applyInsert('{}^{}', 'before-atom')}
          />
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">数字テンキー</p>
        <div className="grid grid-cols-4 gap-2">
          {['7', '8', '9'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insertPlain(key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={backspace}>
            <Delete className="h-4 w-4" />
          </KeyButton>
          {['4', '5', '6'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insertPlain(key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => onChange('')}>
            <Eraser className="h-4 w-4" />
          </KeyButton>
          {['1', '2', '3'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insertPlain(key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={toggleSign}>
            ±
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insertPlain('0')} className="col-span-2">
            0
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insertPlain('.')}>
            .
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insertPlain('(')}>
            (
          </KeyButton>
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">理数必須記号</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          <KeyButton disabled={disabled} onClick={() => applyInsert('\\frac{}{}', 'at')}>
            分数
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => applyInsert('\\sqrt{}', 'at')}>
            √
          </KeyButton>
          {['x', 'y', 'n', 'a'].map((symbol) => (
            <KeyButton key={symbol} disabled={disabled} onClick={() => insertPlain(symbol)}>
              {symbol}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => insertPlain('\\pi')}>
            π
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insertPlain('\\theta')}>
            θ
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insertPlain(')')}>
            )
          </KeyButton>
        </div>
      </section>
    </div>
  );
}

function findAtomStart(text: string, cursor: number): number {
  let index = cursor;
  while (index > 0 && /\s/.test(text[index - 1])) index -= 1;
  if (index === 0) return 0;

  if (text[index - 1] === '}') {
    let depth = 0;
    let look = index;
    while (look > 0) {
      look -= 1;
      if (text[look] === '}') depth += 1;
      if (text[look] === '{') {
        depth -= 1;
        if (depth === 0) {
          if (look > 0 && text[look - 1] === '\\') {
            look -= 1;
            while (look > 0 && /[A-Za-z]/.test(text[look - 1])) look -= 1;
            if (text[look] === '\\') return look;
          }
          return look;
        }
      }
    }
    return 0;
  }

  if (/[A-Za-z]/.test(text[index - 1])) {
    let look = index;
    while (look > 0 && /[A-Za-z]/.test(text[look - 1])) look -= 1;
    if (look > 0 && text[look - 1] === '\\') return look - 1;
    return index - 1;
  }

  if (/[0-9.]/.test(text[index - 1])) {
    let look = index;
    while (look > 0 && /[0-9.]/.test(text[look - 1])) look -= 1;
    return look;
  }

  return index - 1;
}

function CornerKey({
  label,
  hint,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-2 py-2.5 text-center transition-colors hover:border-cyan-400/60 disabled:opacity-50"
    >
      <span className="block font-mono text-base font-semibold text-cyan-200">{label}</span>
      <span className="mt-0.5 block text-[10px] text-slate-400">{hint}</span>
    </button>
  );
}

function KeyButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 font-mono text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 ${className}`}
    >
      {children}
    </button>
  );
}

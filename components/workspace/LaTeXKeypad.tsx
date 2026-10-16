'use client';

// ==========================================
// Apex Suite: Math Lab - 完全ビジュアル数式キーパッド（WYSIWYG）
// ==========================================
// LaTeX コードは画面に出さず、分数線・指数などの見た目と点滅カーソルで入力する。

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { Delete, Eraser } from 'lucide-react';

import {
  OPERATOR_KEYS,
  backspace,
  clearAll,
  focusRow,
  insertSymbol,
  isEmpty,
  isStructureActive,
  moveCursor,
  parseLatex,
  serializeLatex,
  toggleStructure,
  type StructureKind,
  type VisualMathState,
} from '@/lib/engine/visualMath';

interface LaTeXKeypadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TOGGLE_ON =
  'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]';
const TOGGLE_OFF = 'surface-card text-slate-800 dark:text-slate-200';

const STRUCTURE_KEYS: Array<{ kind: StructureKind; label: string; hint: string }> = [
  { kind: 'frac', label: '分数', hint: '上 / 下' },
  { kind: 'sqrt', label: '√', hint: '根号' },
  { kind: 'sup', label: '□ⁿ', hint: '右上・累乗' },
  { kind: 'sub', label: '□ₙ', hint: '右下・添え字' },
  { kind: 'presub', label: 'ₙ□', hint: '左下・nCr' },
  { kind: 'presup', label: 'ⁿ□', hint: '左上・質量数' },
];

const LETTER_KEYS = ['x', 'y', 'n', 'a'] as const;

export default function LaTeXKeypad({ value, onChange, disabled = false }: LaTeXKeypadProps) {
  const [state, setState] = useState<VisualMathState>(() => parseLatex(value));
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serializeLatex(state) === value) return;
    setState(parseLatex(value));
    // 親からのリセット（次の問題など）だけ取り込む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: VisualMathState) => {
    if (disabled) return;
    setState(next);
    onChange(serializeLatex(next));
  };

  const insert = (latex: string, glyph: string) => commit(insertSymbol(state, latex, glyph));
  const toggle = (kind: StructureKind) => commit(toggleStructure(state, kind));

  const handleScreenKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const key = event.key;
    if (key === 'Backspace') {
      event.preventDefault();
      commit(backspace(state));
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      commit(moveCursor(state, -1));
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      commit(moveCursor(state, 1));
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      const active = STRUCTURE_KEYS.find(({ kind }) => isStructureActive(state, kind));
      if (active) commit(toggleStructure(state, active.kind));
      return;
    }
    if (key === '^') {
      event.preventDefault();
      toggle('sup');
      return;
    }
    if (key === '_') {
      event.preventDefault();
      toggle('sub');
      return;
    }
    if (key === '*') {
      event.preventDefault();
      insert('\\times', '×');
      return;
    }
    if (key === '/') {
      event.preventDefault();
      toggle('frac');
      return;
    }
    if (key === '\\' || key === ' ') {
      event.preventDefault();
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      insert(key, key);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={screenRef}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-label="数式入力"
        aria-disabled={disabled}
        onKeyDown={handleScreenKey}
        onMouseDown={() => screenRef.current?.focus()}
        className={`relative min-h-[5.75rem] cursor-text overflow-x-auto rounded-xl surface-input px-3 py-3 text-slate-900 outline-none focus:border-cyan-400/70 dark:text-white ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {isEmpty(state) && state.cursor.rowId === state.rootId ? (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-slate-500">解答を入力</span>
        ) : null}
        <div className="relative flex min-h-[3.25rem] items-center text-[1.35rem] leading-none">
          <MathRow state={state} rowId={state.rootId} disabled={disabled} onFocus={(rowId, index) => commit(focusRow(state, rowId, index))} />
        </div>
      </div>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">構造（ON / OFF）</p>
        <div className="grid grid-cols-3 gap-2">
          {STRUCTURE_KEYS.map((item) => (
            <ToggleKey
              key={item.kind}
              label={item.label}
              hint={item.hint}
              active={isStructureActive(state, item.kind)}
              disabled={disabled}
              onClick={() => toggle(item.kind)}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">数字</p>
        <div className="grid grid-cols-4 gap-2">
          {['7', '8', '9'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insert(key, key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => commit(backspace(state))} ariaLabel="一文字消去">
            <Delete className="h-4 w-4" />
          </KeyButton>
          {['4', '5', '6'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insert(key, key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => commit(clearAll())} ariaLabel="全消去">
            <Eraser className="h-4 w-4" />
          </KeyButton>
          {['1', '2', '3'].map((key) => (
            <KeyButton key={key} disabled={disabled} onClick={() => insert(key, key)}>
              {key}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => insert('\\pm', '±')}>
            ±
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insert('0', '0')}>
            0
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insert('.', '.')}>
            .
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insert('(', '(')}>
            (
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insert(')', ')')}>
            )
          </KeyButton>
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">演算</p>
        <div className="grid grid-cols-5 gap-2">
          {OPERATOR_KEYS.map((item) => (
            <KeyButton key={item.latex} disabled={disabled} onClick={() => insert(item.latex, item.glyph)}>
              {item.glyph}
            </KeyButton>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">記号</p>
        <div className="grid grid-cols-6 gap-2">
          {LETTER_KEYS.map((symbol) => (
            <KeyButton key={symbol} disabled={disabled} onClick={() => insert(symbol, symbol)}>
              {symbol}
            </KeyButton>
          ))}
          <KeyButton disabled={disabled} onClick={() => insert('\\pi', 'π')}>
            π
          </KeyButton>
          <KeyButton disabled={disabled} onClick={() => insert('\\theta', 'θ')}>
            θ
          </KeyButton>
        </div>
      </section>
    </div>
  );
}

function MathRow({
  state,
  rowId,
  disabled,
  onFocus,
}: {
  state: VisualMathState;
  rowId: string;
  disabled: boolean;
  onFocus: (rowId: string, index: number) => void;
}) {
  const node = state.nodes[rowId];
  if (!node || node.kind !== 'row') return null;
  const cursorHere = state.cursor.rowId === rowId;
  const empty = node.children.length === 0;

  const focusAt = (event: MouseEvent, index: number) => {
    event.stopPropagation();
    if (disabled) return;
    onFocus(rowId, index);
  };

  return (
    <span className="inline-flex min-h-[1.2em] flex-wrap items-center" onMouseDown={(event) => focusAt(event, node.children.length)}>
      {cursorHere && state.cursor.index === 0 ? <MathCaret /> : null}
      {empty && !cursorHere ? <EmptySlot /> : null}
      {node.children.map((childId, index) => (
        <span key={childId} className="inline-flex items-center">
          <MathPiece
            state={state}
            nodeId={childId}
            disabled={disabled}
            onFocus={onFocus}
            onSelect={(event) => focusAt(event, index + 1)}
          />
          {cursorHere && state.cursor.index === index + 1 ? <MathCaret /> : null}
        </span>
      ))}
    </span>
  );
}

function MathPiece({
  state,
  nodeId,
  disabled,
  onFocus,
  onSelect,
}: {
  state: VisualMathState;
  nodeId: string;
  disabled: boolean;
  onFocus: (rowId: string, index: number) => void;
  onSelect: (event: MouseEvent) => void;
}) {
  const node = state.nodes[nodeId];
  if (!node) return null;

  if (node.kind === 'sym') {
    return (
      <span className="inline-flex px-[0.04em] font-medium" onMouseDown={onSelect}>
        {node.glyph}
      </span>
    );
  }

  if (node.kind === 'frac') {
    return (
      <span
        className="mx-[0.18em] inline-flex flex-col items-stretch justify-center align-middle"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <SlotFrame
          active={isCursorIn(state, node.num)}
          onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.num)}
        >
          <MathRow state={state} rowId={node.num} disabled={disabled} onFocus={onFocus} />
        </SlotFrame>
        <span className="my-[0.12em] h-[1.5px] w-full rounded-full bg-slate-800 dark:bg-slate-100" />
        <SlotFrame
          active={isCursorIn(state, node.den)}
          onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.den)}
        >
          <MathRow state={state} rowId={node.den} disabled={disabled} onFocus={onFocus} />
        </SlotFrame>
      </span>
    );
  }

  if (node.kind === 'sqrt') {
    return (
      <span className="mx-[0.12em] inline-flex items-stretch" onMouseDown={(event) => event.stopPropagation()}>
        <span className="pr-[0.05em] text-[1.15em] leading-none">√</span>
        <span className="inline-flex border-t-[1.5px] border-current pt-[0.12em] pl-[0.12em]">
          <SlotFrame
            active={isCursorIn(state, node.body)}
            onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.body)}
          >
            <MathRow state={state} rowId={node.body} disabled={disabled} onFocus={onFocus} />
          </SlotFrame>
        </span>
      </span>
    );
  }

  if (node.kind === 'script') {
    return (
      <span className="inline-flex items-end" onMouseDown={(event) => event.stopPropagation()}>
        {(node.presup || node.presub) && (
          <span className="mb-[0.15em] mr-[0.04em] inline-flex flex-col items-end text-[0.62em] leading-tight">
            {node.presup ? (
              <SlotFrame
                compact
                active={isCursorIn(state, node.presup)}
                onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.presup)}
              >
                <MathRow state={state} rowId={node.presup} disabled={disabled} onFocus={onFocus} />
              </SlotFrame>
            ) : (
              <span className="h-[0.9em]" />
            )}
            {node.presub ? (
              <SlotFrame
                compact
                active={isCursorIn(state, node.presub)}
                onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.presub)}
              >
                <MathRow state={state} rowId={node.presub} disabled={disabled} onFocus={onFocus} />
              </SlotFrame>
            ) : (
              <span className="h-[0.9em]" />
            )}
          </span>
        )}
        <SlotFrame
          active={isCursorIn(state, node.base)}
          onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.base)}
        >
          <MathRow state={state} rowId={node.base} disabled={disabled} onFocus={onFocus} />
        </SlotFrame>
        {(node.sup || node.sub) && (
          <span className="mb-[0.15em] ml-[0.04em] inline-flex flex-col items-start text-[0.62em] leading-tight">
            {node.sup ? (
              <SlotFrame
                compact
                active={isCursorIn(state, node.sup)}
                onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.sup)}
              >
                <MathRow state={state} rowId={node.sup} disabled={disabled} onFocus={onFocus} />
              </SlotFrame>
            ) : (
              <span className="h-[0.9em]" />
            )}
            {node.sub ? (
              <SlotFrame
                compact
                active={isCursorIn(state, node.sub)}
                onMouseDown={(event) => focusSlot(event, disabled, onFocus, state, node.sub)}
              >
                <MathRow state={state} rowId={node.sub} disabled={disabled} onFocus={onFocus} />
              </SlotFrame>
            ) : (
              <span className="h-[0.9em]" />
            )}
          </span>
        )}
      </span>
    );
  }

  return null;
}

function isCursorIn(state: VisualMathState, rowId: string | undefined): boolean {
  if (!rowId) return false;
  return containsRow(state, rowId, state.cursor.rowId);
}

function containsRow(state: VisualMathState, nodeId: string, rowId: string): boolean {
  const node = state.nodes[nodeId];
  if (!node) return false;
  if (node.kind === 'row') {
    return node.id === rowId || node.children.some((child) => containsRow(state, child, rowId));
  }
  if (node.kind === 'frac') return containsRow(state, node.num, rowId) || containsRow(state, node.den, rowId);
  if (node.kind === 'sqrt') return containsRow(state, node.body, rowId);
  if (node.kind === 'script') {
    return [node.base, node.sup, node.sub, node.presup, node.presub]
      .filter(Boolean)
      .some((id) => containsRow(state, id as string, rowId));
  }
  return false;
}

function focusSlot(
  event: MouseEvent,
  disabled: boolean,
  onFocus: (rowId: string, index: number) => void,
  state: VisualMathState,
  rowId: string | undefined
) {
  event.stopPropagation();
  if (disabled || !rowId) return;
  const row = state.nodes[rowId];
  const index = row?.kind === 'row' ? row.children.length : 0;
  onFocus(rowId, index);
}

function SlotFrame({
  active,
  compact,
  onMouseDown,
  children,
}: {
  active: boolean;
  compact?: boolean;
  onMouseDown: (event: MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex min-h-[1.05em] min-w-[0.85em] items-center justify-center rounded-sm px-[0.12em] ${
        compact ? 'min-h-[0.95em]' : ''
      } ${active ? 'bg-cyan-400/10 ring-1 ring-cyan-400/70' : 'hover:bg-slate-500/10'}`}
      onMouseDown={onMouseDown}
    >
      {children}
    </span>
  );
}

function EmptySlot() {
  return <span className="inline-block h-[1em] w-[0.95em] rounded-sm border border-dashed border-slate-500/45" />;
}

function MathCaret() {
  return (
    <span
      aria-hidden
      className="mx-[1px] inline-block h-[1.15em] w-[2px] translate-y-[0.08em] bg-cyan-400 [animation:math-caret-blink_1.1s_step-end_infinite]"
    />
  );
}

function ToggleKey({
  label,
  hint,
  active,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border px-2 py-2.5 text-center transition-colors disabled:opacity-50 ${
        active ? TOGGLE_ON : `${TOGGLE_OFF} hover:border-cyan-400/50`
      }`}
    >
      <span className="block font-mono text-base font-semibold">{label}</span>
      <span className={`mt-0.5 block text-[10px] ${active ? 'text-cyan-200/80' : 'text-slate-400'}`}>{hint}</span>
    </button>
  );
}

function KeyButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-lg surface-card font-mono text-sm font-medium text-slate-800 transition-colors hover:border-cyan-400/40 disabled:opacity-50 dark:text-slate-200"
    >
      {children}
    </button>
  );
}

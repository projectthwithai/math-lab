// ==========================================
// Apex Suite: Math Lab - Visual math editor (WYSIWYG)
// ==========================================
// 画面上は分数線・指数などの見た目だけを出し、内部だけ LaTeX に直列化する。

export type StructureKind = 'frac' | 'sqrt' | 'sup' | 'sub' | 'presub' | 'presup';

export type SlotName = 'num' | 'den' | 'body' | 'base' | 'sup' | 'sub' | 'presup' | 'presub';

export type MathNode =
  | { id: string; kind: 'row'; children: string[] }
  | { id: string; kind: 'sym'; latex: string; glyph: string }
  | { id: string; kind: 'frac'; num: string; den: string }
  | { id: string; kind: 'sqrt'; body: string }
  | {
      id: string;
      kind: 'script';
      base: string;
      sup?: string;
      sub?: string;
      presup?: string;
      presub?: string;
    };

export interface VisualCursor {
  rowId: string;
  index: number;
}

export interface VisualMathState {
  nodes: Record<string, MathNode>;
  rootId: string;
  cursor: VisualCursor;
}

let idSeq = 0;
function nid(): string {
  idSeq += 1;
  return `vm${idSeq}`;
}

function asRow(node: MathNode | undefined): Extract<MathNode, { kind: 'row' }> {
  if (!node || node.kind !== 'row') {
    throw new Error('visualMath: expected row');
  }
  return node;
}

export function createEmptyState(): VisualMathState {
  const rootId = nid();
  return {
    nodes: { [rootId]: { id: rootId, kind: 'row', children: [] } },
    rootId,
    cursor: { rowId: rootId, index: 0 },
  };
}

function cloneState(state: VisualMathState): VisualMathState {
  return {
    nodes: { ...state.nodes },
    rootId: state.rootId,
    cursor: { ...state.cursor },
  };
}

function put(state: VisualMathState, node: MathNode): void {
  state.nodes[node.id] = node;
}

function makeRow(state: VisualMathState): Extract<MathNode, { kind: 'row' }> {
  const id = nid();
  const row: MathNode = { id, kind: 'row', children: [] };
  put(state, row);
  return row;
}

function insertChild(state: VisualMathState, rowId: string, index: number, childId: string): void {
  const row = asRow(state.nodes[rowId]);
  const children = [...row.children];
  children.splice(index, 0, childId);
  put(state, { ...row, children });
}

function replaceChild(state: VisualMathState, rowId: string, index: number, childId: string): void {
  const row = asRow(state.nodes[rowId]);
  const children = [...row.children];
  children[index] = childId;
  put(state, { ...row, children });
}

function removeChild(state: VisualMathState, rowId: string, index: number): string | null {
  const row = asRow(state.nodes[rowId]);
  if (index < 0 || index >= row.children.length) return null;
  const children = [...row.children];
  const [removed] = children.splice(index, 1);
  put(state, { ...row, children });
  return removed;
}

export function serializeLatex(state: VisualMathState): string {
  return serializeNode(state, state.rootId);
}

function brace(body: string): string {
  return `{${body}}`;
}

function serializeNode(state: VisualMathState, id: string): string {
  const node = state.nodes[id];
  if (!node) return '';
  if (node.kind === 'row') return node.children.map((child) => serializeNode(state, child)).join('');
  if (node.kind === 'sym') return node.latex;
  if (node.kind === 'frac') {
    return `\\frac${brace(serializeNode(state, node.num))}${brace(serializeNode(state, node.den))}`;
  }
  if (node.kind === 'sqrt') {
    return `\\sqrt${brace(serializeNode(state, node.body))}`;
  }
  let out = '';
  if (node.presub) out += `{}_${brace(serializeNode(state, node.presub))}`;
  if (node.presup) out += `{}^${brace(serializeNode(state, node.presup))}`;
  out += brace(serializeNode(state, node.base));
  if (node.sub) out += `_${brace(serializeNode(state, node.sub))}`;
  if (node.sup) out += `^${brace(serializeNode(state, node.sup))}`;
  return out;
}

function findRowOwner(
  state: VisualMathState,
  rowId: string
): { ownerId: string; slot: SlotName } | null {
  for (const node of Object.values(state.nodes)) {
    if (node.kind === 'frac') {
      if (node.num === rowId) return { ownerId: node.id, slot: 'num' };
      if (node.den === rowId) return { ownerId: node.id, slot: 'den' };
    } else if (node.kind === 'sqrt') {
      if (node.body === rowId) return { ownerId: node.id, slot: 'body' };
    } else if (node.kind === 'script') {
      if (node.base === rowId) return { ownerId: node.id, slot: 'base' };
      if (node.sup === rowId) return { ownerId: node.id, slot: 'sup' };
      if (node.sub === rowId) return { ownerId: node.id, slot: 'sub' };
      if (node.presup === rowId) return { ownerId: node.id, slot: 'presup' };
      if (node.presub === rowId) return { ownerId: node.id, slot: 'presub' };
    }
  }
  return null;
}

function parentRowOfNode(
  state: VisualMathState,
  nodeId: string
): { rowId: string; index: number } | null {
  for (const node of Object.values(state.nodes)) {
    if (node.kind !== 'row') continue;
    const index = node.children.indexOf(nodeId);
    if (index >= 0) return { rowId: node.id, index };
  }
  return null;
}

function enclosingChain(state: VisualMathState): Array<{ ownerId: string; slot: SlotName }> {
  const chain: Array<{ ownerId: string; slot: SlotName }> = [];
  let rowId = state.cursor.rowId;
  const seen = new Set<string>();
  while (!seen.has(rowId)) {
    seen.add(rowId);
    const owner = findRowOwner(state, rowId);
    if (!owner) break;
    chain.push(owner);
    const parent = parentRowOfNode(state, owner.ownerId);
    if (!parent) break;
    rowId = parent.rowId;
  }
  return chain;
}

function slotMatchesKind(slot: SlotName, kind: StructureKind): boolean {
  if (kind === 'frac') return slot === 'num' || slot === 'den';
  if (kind === 'sqrt') return slot === 'body';
  return slot === kind;
}

export function isStructureActive(state: VisualMathState, kind: StructureKind): boolean {
  return enclosingChain(state).some((entry) => {
    const node = state.nodes[entry.ownerId];
    if (kind === 'frac') return node?.kind === 'frac';
    if (kind === 'sqrt') return node?.kind === 'sqrt';
    return node?.kind === 'script' && slotMatchesKind(entry.slot, kind);
  });
}

function nearestOfKind(
  state: VisualMathState,
  kind: StructureKind
): { ownerId: string; slot: SlotName } | null {
  return (
    enclosingChain(state).find((entry) => {
      const node = state.nodes[entry.ownerId];
      if (kind === 'frac') return node?.kind === 'frac';
      if (kind === 'sqrt') return node?.kind === 'sqrt';
      return node?.kind === 'script' && slotMatchesKind(entry.slot, kind);
    }) ?? null
  );
}

export function focusRow(state: VisualMathState, rowId: string, index?: number): VisualMathState {
  const next = cloneState(state);
  const row = asRow(next.nodes[rowId]);
  const clamped = Math.max(0, Math.min(index ?? row.children.length, row.children.length));
  next.cursor = { rowId, index: clamped };
  return next;
}

export function insertSymbol(state: VisualMathState, latex: string, glyph: string): VisualMathState {
  const next = cloneState(state);
  const id = nid();
  put(next, { id, kind: 'sym', latex, glyph });
  insertChild(next, next.cursor.rowId, next.cursor.index, id);
  next.cursor = { rowId: next.cursor.rowId, index: next.cursor.index + 1 };
  return next;
}

function wrapAsBase(state: VisualMathState, childId: string): string {
  const row = makeRow(state);
  put(state, { ...row, children: [childId] });
  return row.id;
}

function exitAfter(state: VisualMathState, nodeId: string): void {
  const parent = parentRowOfNode(state, nodeId);
  if (!parent) return;
  state.cursor = { rowId: parent.rowId, index: parent.index + 1 };
}

function ensureScript(state: VisualMathState): Extract<MathNode, { kind: 'script' }> {
  const { rowId, index } = state.cursor;
  const row = asRow(state.nodes[rowId]);
  const prevId = index > 0 ? row.children[index - 1] : null;
  const prev = prevId ? state.nodes[prevId] : null;
  if (prev?.kind === 'script') return prev;

  const baseId = prevId ? wrapAsBase(state, prevId) : makeRow(state).id;
  const scriptId = nid();
  const script: MathNode = { id: scriptId, kind: 'script', base: baseId };
  put(state, script);
  if (prevId) {
    replaceChild(state, rowId, index - 1, scriptId);
  } else {
    insertChild(state, rowId, index, scriptId);
    state.cursor = { rowId, index: index + 1 };
  }
  return script;
}

function ensureScriptAhead(state: VisualMathState): Extract<MathNode, { kind: 'script' }> {
  const { rowId, index } = state.cursor;
  const row = asRow(state.nodes[rowId]);
  const nextId = index < row.children.length ? row.children[index] : null;
  const next = nextId ? state.nodes[nextId] : null;
  if (next?.kind === 'script') return next;

  const baseId = nextId ? wrapAsBase(state, nextId) : makeRow(state).id;
  const scriptId = nid();
  const script: MathNode = { id: scriptId, kind: 'script', base: baseId };
  put(state, script);
  if (nextId) {
    replaceChild(state, rowId, index, scriptId);
  } else {
    insertChild(state, rowId, index, scriptId);
  }
  return script;
}

function attachSlot(
  state: VisualMathState,
  script: Extract<MathNode, { kind: 'script' }>,
  slot: 'sup' | 'sub' | 'presup' | 'presub'
): string {
  const existing = script[slot];
  if (existing) return existing;
  const row = makeRow(state);
  put(state, { ...script, [slot]: row.id });
  return row.id;
}

export function toggleStructure(state: VisualMathState, kind: StructureKind): VisualMathState {
  if (isStructureActive(state, kind)) {
    return exitStructure(state, kind);
  }
  return enterStructure(state, kind);
}

export function enterStructure(state: VisualMathState, kind: StructureKind): VisualMathState {
  const next = cloneState(state);
  if (kind === 'frac') {
    const num = makeRow(next);
    const den = makeRow(next);
    const id = nid();
    put(next, { id, kind: 'frac', num: num.id, den: den.id });
    insertChild(next, next.cursor.rowId, next.cursor.index, id);
    next.cursor = { rowId: num.id, index: 0 };
    return next;
  }
  if (kind === 'sqrt') {
    const body = makeRow(next);
    const id = nid();
    put(next, { id, kind: 'sqrt', body: body.id });
    insertChild(next, next.cursor.rowId, next.cursor.index, id);
    next.cursor = { rowId: body.id, index: 0 };
    return next;
  }
  if (kind === 'presup' || kind === 'presub') {
    const script = ensureScriptAhead(next);
    const slotId = attachSlot(next, asScript(next.nodes[script.id]), kind);
    next.cursor = { rowId: slotId, index: asRow(next.nodes[slotId]).children.length };
    return next;
  }
  const script = ensureScript(next);
  const slotId = attachSlot(next, asScript(next.nodes[script.id]), kind === 'sup' ? 'sup' : 'sub');
  next.cursor = { rowId: slotId, index: asRow(next.nodes[slotId]).children.length };
  return next;
}

function asScript(node: MathNode | undefined): Extract<MathNode, { kind: 'script' }> {
  if (!node || node.kind !== 'script') {
    throw new Error('visualMath: expected script');
  }
  return node;
}

export function exitStructure(state: VisualMathState, kind: StructureKind): VisualMathState {
  const next = cloneState(state);
  const found = nearestOfKind(next, kind);
  if (!found) return next;
  exitAfter(next, found.ownerId);
  return next;
}

function rowIsEmpty(state: VisualMathState, rowId: string): boolean {
  return asRow(state.nodes[rowId]).children.length === 0;
}

function deleteNodeTree(state: VisualMathState, nodeId: string): void {
  const node = state.nodes[nodeId];
  if (!node) return;
  if (node.kind === 'row') {
    node.children.forEach((child) => deleteNodeTree(state, child));
  } else if (node.kind === 'frac') {
    deleteNodeTree(state, node.num);
    deleteNodeTree(state, node.den);
  } else if (node.kind === 'sqrt') {
    deleteNodeTree(state, node.body);
  } else if (node.kind === 'script') {
    deleteNodeTree(state, node.base);
    if (node.sup) deleteNodeTree(state, node.sup);
    if (node.sub) deleteNodeTree(state, node.sub);
    if (node.presup) deleteNodeTree(state, node.presup);
    if (node.presub) deleteNodeTree(state, node.presub);
  }
  delete state.nodes[nodeId];
}

export function backspace(state: VisualMathState): VisualMathState {
  const next = cloneState(state);
  const { rowId, index } = next.cursor;
  if (index > 0) {
    const removed = removeChild(next, rowId, index - 1);
    if (removed) deleteNodeTree(next, removed);
    next.cursor = { rowId, index: index - 1 };
    return next;
  }

  const owner = findRowOwner(next, rowId);
  if (!owner) return next;
  const ownerNode = next.nodes[owner.ownerId];
  const parent = parentRowOfNode(next, owner.ownerId);

  const deleteOwner = () => {
    if (!parent) return;
    deleteNodeTree(next, owner.ownerId);
    removeChild(next, parent.rowId, parent.index);
    next.cursor = { rowId: parent.rowId, index: parent.index };
  };

  if (ownerNode?.kind === 'frac') {
    const other = owner.slot === 'num' ? ownerNode.den : ownerNode.num;
    if (rowIsEmpty(next, rowId) && rowIsEmpty(next, other)) {
      deleteOwner();
      return next;
    }
    if (owner.slot === 'den') {
      next.cursor = { rowId: ownerNode.num, index: asRow(next.nodes[ownerNode.num]).children.length };
      return next;
    }
  }

  if (ownerNode?.kind === 'sqrt' && rowIsEmpty(next, ownerNode.body)) {
    deleteOwner();
    return next;
  }

  if (parent) {
    next.cursor = { rowId: parent.rowId, index: parent.index };
  }
  return next;
}

export function clearAll(): VisualMathState {
  return createEmptyState();
}

export function moveCursor(state: VisualMathState, direction: -1 | 1): VisualMathState {
  const next = cloneState(state);
  const row = asRow(next.nodes[next.cursor.rowId]);
  const target = next.cursor.index + direction;
  if (target >= 0 && target <= row.children.length) {
    next.cursor = { rowId: next.cursor.rowId, index: target };
    return next;
  }
  if (direction < 0) {
    const owner = findRowOwner(next, next.cursor.rowId);
    if (!owner) return next;
    if (ownerNodeIsFrac(next, owner.ownerId) && owner.slot === 'den') {
      const frac = next.nodes[owner.ownerId];
      if (frac?.kind === 'frac') {
        next.cursor = { rowId: frac.num, index: asRow(next.nodes[frac.num]).children.length };
        return next;
      }
    }
    const parent = parentRowOfNode(next, owner.ownerId);
    if (parent) next.cursor = { rowId: parent.rowId, index: parent.index };
  } else {
    const owner = findRowOwner(next, next.cursor.rowId);
    if (!owner) return next;
    if (ownerNodeIsFrac(next, owner.ownerId) && owner.slot === 'num') {
      const frac = next.nodes[owner.ownerId];
      if (frac?.kind === 'frac') {
        next.cursor = { rowId: frac.den, index: 0 };
        return next;
      }
    }
    exitAfter(next, owner.ownerId);
  }
  return next;
}

function ownerNodeIsFrac(state: VisualMathState, ownerId: string): boolean {
  return state.nodes[ownerId]?.kind === 'frac';
}

export function isEmpty(state: VisualMathState): boolean {
  return asRow(state.nodes[state.rootId]).children.length === 0;
}

const COMMAND_GLYPHS: Record<string, string> = {
  times: '×',
  div: '÷',
  pm: '±',
  pi: 'π',
  theta: 'θ',
};

class LatexParser {
  private i = 0;

  constructor(
    private readonly source: string,
    private readonly state: VisualMathState
  ) {}

  parseInto(rowId: string): void {
    while (!this.done() && this.peek() !== '}') {
      const item = this.parseItem();
      if (!item) break;
      const row = asRow(this.state.nodes[rowId]);
      put(this.state, { ...row, children: [...row.children, item] });
    }
  }

  private parseItem(): string | null {
    this.skipSpace();
    if (this.done() || this.peek() === '}') return null;

    let presup: string | undefined;
    let presub: string | undefined;
    while (true) {
      this.skipSpace();
      if (this.startsWith('{}^')) {
        this.i += 3;
        presup = this.parseGroup();
      } else if (this.startsWith('{}_')) {
        this.i += 3;
        presub = this.parseGroup();
      } else {
        break;
      }
    }

    const base = this.parseAtom();
    if (!base) {
      if (presup || presub) {
        const empty = makeRow(this.state).id;
        return this.makeScript(empty, { presup, presub });
      }
      return null;
    }

    let sup: string | undefined;
    let sub: string | undefined;
    while (true) {
      this.skipSpace();
      if (this.eat('^')) sup = this.parseGroup() ?? this.parseAtom() ?? undefined;
      else if (this.eat('_')) sub = this.parseGroup() ?? this.parseAtom() ?? undefined;
      else break;
    }

    if (presup || presub || sup || sub) {
      const baseRow =
        this.state.nodes[base]?.kind === 'row' ? base : wrapAsBase(this.state, base);
      return this.makeScript(baseRow, { sup, sub, presup, presub });
    }
    return base;
  }

  private parseAtom(): string | null {
    this.skipSpace();
    if (this.done()) return null;
    if (this.eat('{')) {
      const row = makeRow(this.state);
      this.parseInto(row.id);
      this.eat('}');
      const children = asRow(this.state.nodes[row.id]).children;
      if (children.length === 1) return children[0];
      return row.id;
    }
    if (this.eat('\\')) {
      const name = this.readCommand();
      if (name === 'frac') {
        const num = this.parseGroup() ?? makeRow(this.state).id;
        const den = this.parseGroup() ?? makeRow(this.state).id;
        const id = nid();
        put(this.state, { id, kind: 'frac', num, den });
        return id;
      }
      if (name === 'sqrt') {
        const body = this.parseGroup() ?? makeRow(this.state).id;
        const id = nid();
        put(this.state, { id, kind: 'sqrt', body });
        return id;
      }
      const glyph = COMMAND_GLYPHS[name] ?? `\\${name}`;
      const latex = `\\${name}`;
      const id = nid();
      put(this.state, {
        id,
        kind: 'sym',
        latex,
        glyph: glyph.startsWith('\\') ? name : glyph,
      });
      return id;
    }
    const ch = this.peek();
    if (!ch) return null;
    this.i += 1;
    const id = nid();
    put(this.state, { id, kind: 'sym', latex: ch, glyph: ch });
    return id;
  }

  private parseGroup(): string | undefined {
    this.skipSpace();
    if (!this.eat('{')) return undefined;
    const row = makeRow(this.state);
    this.parseInto(row.id);
    this.eat('}');
    return row.id;
  }

  private makeScript(
    base: string,
    slots: { sup?: string; sub?: string; presup?: string; presub?: string }
  ): string {
    const id = nid();
    put(this.state, { id, kind: 'script', base, ...slots });
    return id;
  }

  private readCommand(): string {
    let name = '';
    while (/[A-Za-z]/.test(this.peek())) {
      name += this.peek();
      this.i += 1;
    }
    return name;
  }

  private skipSpace(): void {
    while (/\s/.test(this.peek())) this.i += 1;
  }

  private eat(ch: string): boolean {
    if (this.source.startsWith(ch, this.i)) {
      this.i += ch.length;
      return true;
    }
    return false;
  }

  private startsWith(value: string): boolean {
    return this.source.startsWith(value, this.i);
  }

  private peek(): string {
    return this.source[this.i] ?? '';
  }

  private done(): boolean {
    return this.i >= this.source.length;
  }
}

export function parseLatex(source: string): VisualMathState {
  const trimmed = source.trim().replace(/^\$+|\$+$/g, '').trim();
  const state = createEmptyState();
  if (!trimmed) return state;
  const parser = new LatexParser(trimmed, state);
  parser.parseInto(state.rootId);
  const root = asRow(state.nodes[state.rootId]);
  state.cursor = { rowId: state.rootId, index: root.children.length };
  return state;
}

export const OPERATOR_KEYS: Array<{ latex: string; glyph: string }> = [
  { latex: '+', glyph: '+' },
  { latex: '-', glyph: '-' },
  { latex: '\\times', glyph: '×' },
  { latex: '\\div', glyph: '÷' },
  { latex: '=', glyph: '=' },
];

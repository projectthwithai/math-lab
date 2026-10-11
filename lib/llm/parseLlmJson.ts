// ==========================================
// Apex Suite: Math Lab - LLM JSON extractor
// ==========================================
// Gemini が ```json ... ``` や前後の解説文を付けても、最初の完全な
// JSON オブジェクトだけを取り出して JSON.parse する。

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '').trim();
}

function stripTrailingCommas(jsonLike: string): string {
  return jsonLike.replace(/,\s*(?=[}\]])/g, '');
}

function normalizeQuotes(jsonLike: string): string {
  return jsonLike.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
}

/** 文字列リテラルを尊重して、最初の { ... } を深さカウントで切り出す */
export function extractBalancedJsonObject(raw: string): string | null {
  const text = stripBom(raw);
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

function collectFenceBodies(raw: string): string[] {
  const bodies: string[] = [];
  const fence = /```(?:json|JSON)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(raw))) {
    const body = match[1]?.trim();
    if (body) bodies.push(body);
  }
  return bodies;
}

function asObject(parsed: unknown): unknown | null {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object') return parsed[0];
  return null;
}

function tryParseObject(candidate: string): unknown | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const prepared = stripTrailingCommas(normalizeQuotes(trimmed));
  try {
    const parsed = JSON.parse(prepared) as unknown;
    if (typeof parsed === 'string') return tryParseObject(parsed);
    return asObject(parsed);
  } catch {
    const balanced = extractBalancedJsonObject(prepared);
    if (balanced && balanced !== prepared) {
      try {
        const parsed = JSON.parse(stripTrailingCommas(balanced)) as unknown;
        if (typeof parsed === 'string') return tryParseObject(parsed);
        return asObject(parsed);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * マークダウンフェンス・前後の説明文・末尾カンマを除去して JSON オブジェクトを返す。
 */
export function parseLlmJsonObject(raw: string): unknown | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = stripBom(raw);

  for (const body of collectFenceBodies(trimmed)) {
    const parsed = tryParseObject(body) ?? tryParseObject(extractBalancedJsonObject(body) ?? '');
    if (parsed) return parsed;
  }

  const direct = tryParseObject(trimmed);
  if (direct) return direct;

  const balanced = extractBalancedJsonObject(trimmed);
  if (balanced) return tryParseObject(balanced);

  return null;
}

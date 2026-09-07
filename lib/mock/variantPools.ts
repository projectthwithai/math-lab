// ==========================================
// Apex Suite: Math Lab - Mock Variant Lottery
// ==========================================
// 同じ単元へのモック生成で、ランダムシードに基づき
// 「異なるパターン・異なる問題文・異なる数値」を抽選する。

import type { TemplateBlueprint } from '@/lib/mock/blueprintTypes';

/** mulberry32: 決定的な 0..1 乱数（シード付き） */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createVariantSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

export function pickFromPool<T>(pool: readonly T[], seed: number): T {
  if (pool.length === 1) return pool[0];
  const rng = mulberry32(seed);
  return pool[Math.floor(rng() * pool.length)];
}

export function pickBlueprint(pool: TemplateBlueprint[], seed: number): TemplateBlueprint {
  return pickFromPool(pool, seed);
}

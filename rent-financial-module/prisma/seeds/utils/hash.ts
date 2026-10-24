import { createHash } from "node:crypto";
import { SEED_KEY } from "../config.js";

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  exponential(mean: number): number;
}

export function stableId(key: string): string {
  const hex = createHash("sha256").update(`${SEED_KEY}:id:${key}`).digest("hex");
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(key: string): Rng {
  const digest = createHash("sha256").update(`${SEED_KEY}:rng:${key}`).digest();
  const next = mulberry32(digest.readUInt32BE(0));

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max) => min + next() * (max - min),
    chance: (probability) => next() < probability,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    weighted: <T>(items: readonly T[], weights: readonly number[]): T => {
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      let threshold = next() * total;
      for (let index = 0; index < items.length; index += 1) {
        threshold -= weights[index] as number;
        if (threshold < 0) {
          return items[index] as T;
        }
      }
      return items[items.length - 1] as T;
    },
    exponential: (mean) => -mean * Math.log(1 - next()),
  };
}

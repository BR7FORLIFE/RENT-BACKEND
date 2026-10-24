import type { Currency } from "../plan/types.js";

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function roundMoney(value: number, currency: Currency): number {
  return currency === "USD" ? Math.round(value * 100) / 100 : roundTo(value, 100);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

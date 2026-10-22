import type { Span } from "./theory.ts";

/** Learned bar pitches, one list per instrument size, in lane order. */
const keyOf = (span: Span) => (span === 15 ? "little-octave.toy15" : "little-octave.toy");

export function loadToy(span: Span = 8): number[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(keyOf(span)) ?? "") as unknown;
    if (!Array.isArray(parsed) || parsed.length !== span) return null;
    if (!parsed.every((freq) => typeof freq === "number" && freq > 80 && freq < 4000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveToy(freqs: readonly number[]): void {
  const span: Span = freqs.length === 15 ? 15 : 8;
  localStorage.setItem(keyOf(span), JSON.stringify(freqs));
}

export function clearToy(span: Span = 8): void {
  localStorage.removeItem(keyOf(span));
}

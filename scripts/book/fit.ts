// Shared fitting for the shipped book: transpose into C, keep the real range on fifteen bars,
// fold onto C4–C5 only for the eight-bar line.
import { foldEight, transposeToC } from "../../src/lib/xylophone/theory.ts";

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const NAMES = ["C", "^C", "D", "^D", "E", "F", "^F", "G", "^G", "A", "^A", "B"];

export function len(beats: number): string {
  let n = Math.round(beats * 8), d = 8;
  if (n < 1) n = 1;
  while (n % 2 === 0 && d % 2 === 0) { n /= 2; d /= 2; }
  if (d === 1) return n === 1 ? "" : String(n);
  if (n === 1) return d === 2 ? "/" : `/${d}`;
  return `${n}/${d}`;
}

export function tok(midi: number | null, beats: number): string {
  if (midi === null) return "z" + len(beats);
  const name = NAMES[((midi % 12) + 12) % 12]!;
  const acc = name.startsWith("^") ? "^" : "";
  const letter = name.slice(acc.length);
  const oct = Math.floor(midi / 12) - 1;
  let body = letter;
  if (oct >= 5) body = letter.toLowerCase() + "'".repeat(oct - 5);
  else if (oct < 4) body = letter + ",".repeat(4 - oct);
  return acc + body + len(beats);
}

/** Best white-key transposition (fewest accidentals, smallest move), then the octave that fits C4–C6. */
export function fitFifteen(midis: (number | null)[]): (number | null)[] {
  const s = midis.filter((m): m is number => m !== null);
  let shift = transposeToC(s)[0]! - s[0]!;
  const white = (t: number) => s.filter((m) => !WHITE.includes((((m + t) % 12) + 12) % 12)).length;
  if (white(shift) > 0) {
    let best = shift;
    for (let t = -6; t <= 6; t++) if (white(t) < white(best) || (white(t) === white(best) && Math.abs(t) < Math.abs(best))) best = t;
    shift = best;
  }
  const moved = s.map((m) => m + shift);
  let oct = 0;
  const score = (k: number) => moved.filter((m) => m + k >= 60 && m + k <= 84).length;
  for (const k of [0, 12, -12, 24, -24]) if (score(k) > score(oct)) oct = k;
  return midis.map((m) => {
    if (m === null) return null;
    let v = m + shift + oct;
    while (v < 60) v += 12;
    while (v > 84) v -= 12;
    if (!WHITE.includes(v % 12)) v = v + 1 > 84 ? v - 1 : v + 1; // no black bars: nearest neighbour up
    return v;
  });
}

export function eightOf(fifteen: (number | null)[]): (number | null)[] {
  return foldEight(fifteen);
}

/**
 * Starting windows, until a phone session against the fox says otherwise.
 * Spot on is the right bar within 160 ms.
 * Early and late are that same bar, from 160 ms out to 420 ms.
 * Next door is a neighbor bar inside 420 ms, and it is never also called early or late.
 * Anything farther away is a miss and gets no callout.
 */
export const SPOT_MS = 160;
export const EDGE_MS = 420;
export const CALLOUT_GAP_MS = 900;

export type Verdict = "spot" | "early" | "late" | "next";

export type Grade = { verdict: Verdict; noteIndex: number };

export type Tally = {
  spot: number;
  early: number;
  late: number;
  next: number;
  missed: number;
};

type Expected = { lane: number; startBeat: number };
type Hit = { lane: number; beat: number };

function beats(ms: number, bpm: number): number {
  return (ms / 1000) * (bpm / 60);
}

/** Match one strike to the closest unused note. Neighbor wins over early or late. */
export function gradeHit(notes: readonly Expected[], hit: Hit, bpm: number, taken: Set<number>): Grade | null {
  const spot = beats(SPOT_MS, bpm);
  const edge = beats(EDGE_MS, bpm);
  let best = -1;
  let bestAbs = Number.POSITIVE_INFINITY;
  let bestDist = 0;
  for (let i = 0; i < notes.length; i += 1) {
    if (taken.has(i)) continue;
    const note = notes[i]!;
    if (Math.abs(note.lane - hit.lane) > 1) continue;
    const dist = hit.beat - note.startBeat;
    const abs = Math.abs(dist);
    if (abs > edge || abs >= bestAbs) continue;
    best = i;
    bestAbs = abs;
    bestDist = dist;
  }
  if (best < 0) return null;
  taken.add(best);
  const neighbor = Math.abs(notes[best]!.lane - hit.lane) === 1;
  const verdict: Verdict = neighbor ? "next" : bestDist < -spot ? "early" : bestDist > spot ? "late" : "spot";
  return { verdict, noteIndex: best };
}

export function tallyGrades(noteCount: number, grades: readonly Grade[]): Tally {
  const tally: Tally = { spot: 0, early: 0, late: 0, next: 0, missed: 0 };
  for (const grade of grades) tally[grade.verdict] += 1;
  tally.missed = Math.max(0, noteCount - grades.length);
  return tally;
}

/** Misses stay quiet. Spot on is said once per run. Nothing is said twice inside 0.9 s. */
export function shouldCall(
  verdict: Verdict,
  last: { verdict: Verdict; atMs: number } | null,
  atMs: number,
): boolean {
  if (verdict === "spot" && last?.verdict === "spot") return false;
  if (last && atMs - last.atMs < CALLOUT_GAP_MS) return false;
  return true;
}

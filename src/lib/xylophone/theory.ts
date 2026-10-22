export type Bar = {
  id: string;
  letter: string;
  name: string;
  midi: number;
  swatch: string;
  ink: string;
};

/** The eight bars, fox standing: short pale C at the high end, long slate C at the low end. */
export const BARS: readonly Bar[] = [
  { id: "c-high", letter: "C", name: "High C", midi: 72, swatch: "bg-bar-ch", ink: "text-ink" },
  { id: "b", letter: "B", name: "B", midi: 71, swatch: "bg-bar-b", ink: "text-ink" },
  { id: "a", letter: "A", name: "A", midi: 69, swatch: "bg-bar-a", ink: "text-onbar" },
  { id: "g", letter: "G", name: "G", midi: 67, swatch: "bg-bar-g", ink: "text-onbar" },
  { id: "f", letter: "F", name: "F", midi: 65, swatch: "bg-bar-f", ink: "text-ink" },
  { id: "e", letter: "E", name: "E", midi: 64, swatch: "bg-bar-e", ink: "text-ink" },
  { id: "d", letter: "D", name: "D", midi: 62, swatch: "bg-bar-d", ink: "text-ink" },
  { id: "c-low", letter: "C", name: "Low C", midi: 60, swatch: "bg-bar-cl", ink: "text-ink" },
];

/** The next diatonic octave, lighter paints, sitting above high C. */
const UPPER: readonly Bar[] = [
  { id: "c6", letter: "C", name: "C6", midi: 84, swatch: "bg-bar-ch2", ink: "text-ink" },
  { id: "b5", letter: "B", name: "B5", midi: 83, swatch: "bg-bar-b2", ink: "text-ink" },
  { id: "a5", letter: "A", name: "A5", midi: 81, swatch: "bg-bar-a2", ink: "text-onbar" },
  { id: "g5", letter: "G", name: "G5", midi: 79, swatch: "bg-bar-g2", ink: "text-onbar" },
  { id: "f5", letter: "F", name: "F5", midi: 77, swatch: "bg-bar-f2", ink: "text-ink" },
  { id: "e5", letter: "E", name: "E5", midi: 76, swatch: "bg-bar-e2", ink: "text-ink" },
  { id: "d5", letter: "D", name: "D5", midi: 74, swatch: "bg-bar-d2", ink: "text-ink" },
];

export type Span = 8 | 15;

export function barsForSpan(span: Span): readonly Bar[] {
  return span === 15 ? [...UPPER, ...BARS] : BARS;
}

const BAR_MIDIS = BARS.map((bar) => bar.midi);
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

function fitsMajor(classes: number[], tonic: number): boolean {
  const scale = new Set(MAJOR.map((step) => (tonic + step) % 12));
  return classes.every((pc) => scale.has(pc));
}

/**
 * Eight-bar rule. The smaller leap onto the eight bars, so a note written
 * above this toy comes down to the nearer bar.
 */
export function foldEight(midis: readonly (number | null)[]): (number | null)[] {
  return placeMelody(midis, BARS.map((bar) => bar.midi), false);
}

/**
 * Eight-bar rule for a source that already names the bar. A written C that is
 * on the toy stays there. Boci uses this, so the low C after G is not pulled up.
 */
export function foldEightKeep(midis: readonly (number | null)[]): (number | null)[] {
  return placeMelody(midis, BARS.map((bar) => bar.midi), true);
}

/**
 * Fifteen-bar rule. Keep the written pitch when that bar exists, including the
 * upper octave. Nothing is pulled onto a different octave for a shorter leap.
 */
export function foldFifteen(midis: readonly (number | null)[]): (number | null)[] {
  return placeMelody(midis, barsForSpan(15).map((bar) => bar.midi), true);
}
export function transposeToC(midis: number[]): number[] {
  const sounded = midis.filter((midi) => Number.isFinite(midi));
  if (sounded.length === 0) return midis;
  const classes = [...new Set(sounded.map(pitchClass))];
  if (fitsMajor(classes, 0)) return midis;

  const candidates: number[] = [];
  for (let tonic = 0; tonic < 12; tonic += 1) {
    if (fitsMajor(classes, tonic)) candidates.push(tonic);
  }
  if (candidates.length === 0) return midis;

  const last = pitchClass(sounded[sounded.length - 1]!);
  const first = pitchClass(sounded[0]!);
  const tonic = candidates.includes(last) ? last : candidates.includes(first) ? first : candidates[0]!;
  const shift = (12 - tonic) % 12;
  if (shift === 0) return midis;
  return midis.map((midi) => midi + shift);
}

function barsFor(midi: number, barMidis: readonly number[]): number[] {
  const pc = pitchClass(midi);
  return barMidis.filter((bar) => pitchClass(bar) === pc);
}

function nearestBar(midi: number, barMidis: readonly number[]): number {
  return barMidis.reduce((best, bar) => (Math.abs(bar - midi) < Math.abs(best - midi) ? bar : best));
}

/**
 * Fold each note onto the selected bars.
 * Repeated pitch classes follow the smallest leap, which is how the eight-bar
 * sheets were transposed. Pass preferWritten to keep a note that is already a bar
 * (Boci, and a sheet pasted onto the long instrument).
 */
export function placeMelody(
  midis: readonly (number | null)[],
  barMidis: readonly number[] = BAR_MIDIS,
  preferWritten = false,
): (number | null)[] {
  const placed: (number | null)[] = [];
  let prev: number | null = null;
  for (const midi of midis) {
    if (midi === null) {
      placed.push(null);
      continue;
    }
    let choices = barsFor(midi, barMidis);
    if (choices.length === 0) choices = [nearestBar(midi, barMidis)];
    if (preferWritten && choices.includes(midi)) {
      placed.push(midi);
      prev = midi;
      continue;
    }
    const previous = prev;
    const next: number =
      previous === null
        ? choices.slice().sort((a, b) => Math.abs(a - midi) - Math.abs(b - midi) || a - b)[0]!
        : choices
            .slice()
            .sort(
              (a, b) => Math.abs(a - previous) - Math.abs(b - previous) || Math.abs(a - midi) - Math.abs(b - midi),
            )[0]!;
    placed.push(next);
    prev = next;
  }
  return placed;
}

export function laneOf(midi: number, bars: readonly Bar[] = BARS): number {
  const index = bars.findIndex((bar) => bar.midi === midi);
  if (index < 0) throw new Error(`Not a bar: ${midi}`);
  return index;
}

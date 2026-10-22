import { BARS, laneOf, placeMelody, transposeToC, type Bar } from "./theory.ts";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export type Event = { midi: number | null; beats: number };

const KEYS: Record<string, Partial<Record<string, number>>> = {
  C: {},
  G: { F: 1 },
  D: { F: 1, C: 1 },
  A: { F: 1, C: 1, G: 1 },
  E: { F: 1, C: 1, G: 1, D: 1 },
  B: { F: 1, C: 1, G: 1, D: 1, A: 1 },
  F: { B: -1 },
  Bb: { B: -1, E: -1 },
  Eb: { B: -1, E: -1, A: -1 },
  Ab: { B: -1, E: -1, A: -1, D: -1 },
};

const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function keyAccidentals(raw: string): Partial<Record<string, number>> {
  const match = raw.trim().match(/^([A-G])(#|b)?/i);
  if (!match) return {};
  const letter = match[1]!.toUpperCase();
  const accidental = match[2]?.toLowerCase() === "b" ? "b" : match[2] === "#" ? "#" : "";
  const name = accidental === "#" ? letter : accidental === "b" ? `${letter}b` : letter;
  return KEYS[name] ?? {};
}

function accidentalShift(mark: string | undefined): number | null {
  if (!mark) return null;
  if (mark[0] === "^") return mark.length;
  if (mark[0] === "_") return -mark.length;
  return 0;
}

/** Parse a loose ABC fragment. A plain letter is a quarter note unless L: says otherwise. */
export function parseEvents(source: string): Event[] {
  let unit = 1;
  let signature: Partial<Record<string, number>> = {};
  const events: Event[] = [];

  for (const original of source.split(/\r?\n/)) {
    const line = original.replace(/%.*$/, "").trim();
    if (!line) continue;
    const header = line.match(/^([A-Za-z]):\s*(.*)$/);
    if (header) {
      const tag = header[1]!.toUpperCase();
      if (tag === "L") {
        const length = header[2]!.match(/1\/(\d+)/);
        if (length) unit = 4 / Number(length[1]);
      } else if (tag === "K") {
        signature = keyAccidentals(header[2]!);
      }
      continue;
    }
    scanBody(line, unit, signature, events);
  }

  if (events.length === 0) {
    throw new ParseError("No notes in that. Try C C G G A A G2.");
  }
  if (events.filter((event) => event.midi !== null).length > 1500) {
    throw new ParseError("That one's too long to keep.");
  }
  return events;
}

function scanBody(
  body: string,
  unit: number,
  signature: Partial<Record<string, number>>,
  events: Event[],
): void {
  let i = 0;
  while (i < body.length) {
    const c = body[i]!;
    if (/\s/.test(c) || c === "|" || c === ":" || c === "]" || c === "." || c === ">" || c === "<") {
      i += 1;
      continue;
    }
    if (c === '"') {
      i += 1;
      while (i < body.length && body[i] !== '"') i += 1;
      i += 1;
      continue;
    }
    if (c === "(") {
      i += 1;
      while (i < body.length && /\d/.test(body[i]!)) i += 1;
      continue;
    }
    if (c === "+" || c === "!") {
      const mark = c;
      i += 1;
      while (i < body.length && body[i] !== mark) i += 1;
      i += 1;
      continue;
    }
    let chord = false;
    if (c === "[") {
      if (body[i + 1] === "|") {
        i += 2;
        continue;
      }
      chord = true;
      i += 1;
    }
    const start = i;
    const read = readNote(body, i, unit, signature);
    if (!read) {
      const snippet = body.slice(start, start + 16).trim() || c;
      throw new ParseError(`Couldn't read “${snippet}”. Use letters A to G, like C C G G A A G2.`);
    }
    events.push(read.event);
    i = read.next;
    if (!chord) continue;
    while (i < body.length && body[i] !== "]") {
      const more = readNote(body, i, unit, signature);
      if (!more) {
        i += 1;
        continue;
      }
      i = more.next;
    }
    if (body[i] === "]") i += 1;
  }
}

function readNote(
  body: string,
  index: number,
  unit: number,
  signature: Partial<Record<string, number>>,
): { event: Event; next: number } | null {
  let i = index;
  if (body[i] === ".") i += 1;
  let accidental = "";
  if (body[i] === "^" || body[i] === "_") {
    const sign = body[i]!;
    while (body[i] === sign) {
      accidental += sign;
      i += 1;
    }
  } else if (body[i] === "=") {
    accidental = "=";
    i += 1;
  }
  const letterRaw = body[i];
  if (!letterRaw || !/[A-Ga-gzZx]/.test(letterRaw)) return null;
  i += 1;
  let octaveMarks = "";
  while (body[i] === "," || body[i] === "'") {
    octaveMarks += body[i];
    i += 1;
  }
  let num = "";
  while (body[i] && /\d/.test(body[i]!)) {
    num += body[i];
    i += 1;
  }
  let den: string | undefined;
  if (body[i] === "/") {
    i += 1;
    den = "";
    while (body[i] && /\d/.test(body[i]!)) {
      den += body[i];
      i += 1;
    }
  }
  const beats = durationBeats(num, den, unit);
  if (!(beats > 0) || beats > 16) {
    throw new ParseError(`“${body.slice(index, i)}” needs a length between a quick tap and a long hold.`);
  }
  if (/[zZx]/.test(letterRaw)) return { event: { midi: null, beats }, next: i };
  const letter = letterRaw.toUpperCase();
  let octave = letterRaw === letterRaw.toLowerCase() ? 5 : 4;
  for (const mark of octaveMarks) octave += mark === "'" ? 1 : -1;
  const explicit = accidentalShift(accidental || undefined);
  const shift = explicit === null ? (signature[letter] ?? 0) : explicit;
  return { event: { midi: (octave + 1) * 12 + (SEMI[letter] ?? 0) + shift, beats }, next: i };
}

function durationBeats(num: string, den: string | undefined, unit: number): number {
  if (den === undefined && num === "") return unit;
  const numerator = num === "" ? 1 : Number(num);
  const denominator = den === undefined ? 1 : den === "" ? 2 : Number(den);
  return (unit * numerator) / denominator;
}

export type PlacedEvent = { midi: number | null; beats: number; lane: number | null };

/** Transpose into C, then fold onto the selected bars. */
export function foldEvents(events: Event[], bars: readonly Bar[] = BARS, preferWritten = false): PlacedEvent[] {
  const sounded = events.flatMap((event) => (event.midi === null ? [] : [event.midi]));
  const shifted = transposeToC(sounded);
  const delta = sounded.length === 0 ? 0 : shifted[0]! - sounded[0]!;
  const midis = events.map((event) => (event.midi === null ? null : event.midi + delta));
  const placed = placeMelody(midis, bars.map((bar) => bar.midi), preferWritten);
  return events.map((event, index) => {
    const midi = placed[index] ?? null;
    return { midi, beats: event.beats, lane: midi === null ? null : laneOf(midi, bars) };
  });
}

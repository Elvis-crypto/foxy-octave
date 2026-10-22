import { foldEvents, parseEvents, ParseError } from "./parse.ts";
import { REPERTOIRE } from "./repertoire.ts";
import { barsForSpan, laneOf, type Span } from "./theory.ts";
import { syllabifyLine } from "./syllables.ts";

export type ChartNote = {
  lane: number;
  midi: number;
  beats: number;
  startBeat: number;
  phrase: string;
  line: number;
};

export type TuneLang = "hu" | "en" | "fr" | "de" | "es" | "sco" | "da";

/** After the app language and English, the remaining groups follow the language chips. */
const LIST_ORDER: readonly TuneLang[] = ["hu", "en", "fr", "de", "es", "da", "sco"];

function songGroup(songLang: string | undefined, appLang: string): number {
  if (songLang && songLang === appLang) return 0;
  if (songLang === "en") return 1;
  const rest = LIST_ORDER.filter((code) => code !== appLang && code !== "en");
  const index = songLang ? rest.indexOf(songLang as TuneLang) : -1;
  return index < 0 ? rest.length + 2 : index + 2;
}

/** App language, then English, then the other languages. Titles stay alphabetical inside a language. */
export function compareSongs(
  a: { title: string; lang?: TuneLang },
  b: { title: string; lang?: TuneLang },
  appLang: string,
): number {
  const byLang = songGroup(a.lang, appLang) - songGroup(b.lang, appLang);
  if (byLang !== 0) return byLang;
  const locale = a.lang === "sco" ? "en" : a.lang || appLang || "en";
  return a.title.localeCompare(b.title, locale);
}

export type SongChart = {
  id: string;
  title: string;
  bpm: number;
  notes: ChartNote[];
  source: "builtin" | "saved";
  endBeat: number;
  lang?: TuneLang;
};

type Part = { lyric: string; abc: string };

/** A later verse can have more syllables than the tune line has notes. Give each extra syllable
 * its own note by halving the longest sounding note (earliest first), so the dot can land on it.
 * The pitch stays the same; only the rhythm is divided. Shipped songs only. */
export function splitForWords<E extends { midi: number | null; beats: number }>(events: E[], lyric: string): E[] {
  const sounding = events.filter((event) => event.midi !== null).length;
  const want = lyric.trim() ? syllabifyLine(lyric).length : 0;
  if (sounding === 0 || want <= sounding) return events;
  const out = events.slice();
  for (let extra = Math.min(want - sounding, sounding * 2); extra > 0; extra -= 1) {
    let best = -1;
    for (let i = 0; i < out.length; i += 1) {
      if (out[i]!.midi === null) continue;
      if (best < 0 || out[i]!.beats > out[best]!.beats + 1e-9) best = i;
    }
    if (best < 0 || out[best]!.beats < 0.25 - 1e-9) break;
    const half = { ...out[best]!, beats: out[best]!.beats / 2 };
    out.splice(best, 1, half, { ...half });
  }
  return out;
}

/** One line of a sheet: the words, and the notes that actually play. */
export type SheetLine = { lyric: string; abc: string };

export function compileParts(
  id: string,
  title: string,
  bpm: number,
  parts: Part[],
  source: SongChart["source"],
  span: Span = 8,
  lang?: TuneLang,
  written = false,
): SongChart {
  const bars = barsForSpan(span);
  // Built-in letters are the eight-bar arrangement, folded onto those bars.
  // A written sheet is the bars themselves: the letter you see is the bar that plays.
  const folding = barsForSpan(8);
  const preferWritten = written || id === "boci" || (source === "saved" && span === 15);
  const chunks = parts.map((part, line) => ({
    lyric: part.lyric,
    line,
    events: source === "builtin" ? splitForWords(parseEvents(part.abc), part.lyric) : parseEvents(part.abc),
  }));
  const placed = foldEvents(
    chunks.flatMap((chunk) => chunk.events),
    written || source === "saved" ? bars : folding,
    preferWritten,
  );
  const notes: ChartNote[] = [];
  let cursor = 0;
  let index = 0;
  for (const chunk of chunks) {
    for (const event of chunk.events) {
      const folded = placed[index]!;
      index += 1;
      if (folded.midi !== null && folded.lane !== null) {
        notes.push({
          lane: laneOf(folded.midi, bars),
          midi: folded.midi,
          beats: event.beats,
          startBeat: cursor,
          phrase: chunk.lyric,
          line: chunk.line,
        });
      }
      cursor += event.beats;
    }
  }
  if (notes.length === 0) throw new ParseError("No notes in that. Try C C G G A A G2.");
  return { id, title, bpm, notes, source, endBeat: cursor, lang };
}

export function compilePaste(title: string, abc: string, bpm: number, id: string, span: Span = 8): SongChart {
  return compileParts(id, title, bpm, [{ lyric: "", abc }], "saved", span);
}

/** Play a sheet exactly as written on this size. */
export function compileWritten(
  id: string,
  title: string,
  bpm: number,
  lines: readonly SheetLine[],
  span: Span,
  lang?: TuneLang,
): SongChart {
  return compileParts(id, title, bpm, lines.map((line) => ({ lyric: line.lyric, abc: line.abc })), "saved", span, lang, true);
}

const NOTE_NAMES = ["C", "^C", "D", "^D", "E", "F", "^F", "G", "^G", "A", "^A", "B"] as const;

function lengthToken(beats: number): string {
  let numerator = Math.round(beats * 8);
  let denominator = 8;
  if (numerator < 1) numerator = 1;
  while (numerator % 2 === 0 && denominator % 2 === 0) {
    numerator /= 2;
    denominator /= 2;
  }
  if (denominator === 1) return numerator === 1 ? "" : String(numerator);
  if (numerator === 1) return denominator === 2 ? "/" : `/${denominator}`;
  return `${numerator}/${denominator}`;
}

function pitchToken(midi: number, beats: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const name = NOTE_NAMES[pc] ?? "C";
  const octave = Math.floor(midi / 12) - 1;
  const accidental = name.startsWith("^") ? "^" : "";
  const letter = name.slice(accidental.length);
  let body = letter;
  if (octave >= 5) body = letter.toLowerCase() + "'".repeat(octave - 5);
  else if (octave < 4) body = letter + ",".repeat(4 - octave);
  return accidental + body + lengthToken(beats);
}

/** The words and the notes a chart is already playing, so a saved sheet matches the sound. */
export function linesFromChart(chart: SongChart): SheetLine[] {
  const lines: SheetLine[] = [];
  let lyric = "";
  let tokens: string[] = [];
  let cursor = 0;
  const flush = () => {
    if (tokens.length === 0 && !lyric) return;
    lines.push({ lyric, abc: tokens.join(" ") });
    tokens = [];
  };
  for (const note of chart.notes) {
    if (tokens.length > 0 && note.line !== lines.length) flush();
    lyric = note.phrase;
    const gap = note.startBeat - cursor;
    if (gap > 0.04) tokens.push(`z${lengthToken(gap)}`);
    tokens.push(pitchToken(note.midi, note.beats));
    cursor = note.startBeat + note.beats;
  }
  flush();
  return lines.length > 0 ? lines : [{ lyric: "", abc: "" }];
}

export function builtinSource(id: string): { title: string; bpm: number; abc: string } | null {
  const song = REPERTOIRE.find((item) => item.id === id);
  if (!song) return null;
  return { title: song.title, bpm: song.bpm, abc: song.tune.map((line) => line.source).join("\n") };
}

function songParts(id: string, span: Span): Part[] {
  const song = REPERTOIRE.find((item) => item.id === id);
  if (!song) return [];
  const notes = span === 15 ? song.tune.map((line) => line.fifteen) : song.tune.map((line) => line.eight);
  return song.verses.flatMap((verse) => verse.map((lyric, index) => ({ lyric, abc: notes[index] ?? "" })));
}

export function builtinCharts(span: Span = 8): SongChart[] {
  return REPERTOIRE.map((song) =>
    compileParts(song.id, song.title, song.bpm, songParts(song.id, span), "builtin", span, song.lang, true),
  );
}

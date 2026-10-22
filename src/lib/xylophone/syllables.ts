const DIGRAPHS = ["dzs", "cs", "dz", "gy", "ly", "ny", "sz", "ty", "zs"];
const VOWEL = /^[aeiouyáéíóöőúüűàèìòùâêîôûäëïœæøå]$/i;

function vowelGroup(run: string): number {
  const lower = run.toLocaleLowerCase("hu");
  if (lower.startsWith("eau") || lower.startsWith("œu") || lower.startsWith("ieu")) return 3;
  for (const pair of ["ei", "ai", "au", "eu", "ou", "oi", "oy", "ie", "ae", "oe", "äu"]) {
    if (lower.startsWith(pair)) return 2;
  }
  return 1;
}

function unitsOf(word: string): string[] {
  const units: string[] = [];
  const lower = word.toLocaleLowerCase("hu");
  let i = 0;
  while (i < word.length) {
    const rest = lower.slice(i);
    const digraph = DIGRAPHS.find((item) => rest.startsWith(item));
    if (digraph) {
      units.push(word.slice(i, i + digraph.length));
      i += digraph.length;
      continue;
    }
    if (rest.startsWith("qu")) {
      units.push(word.slice(i, i + 2));
      i += 2;
      continue;
    }
    units.push(word[i]!);
    i += 1;
  }
  return units;
}

function isVowel(unit: string): boolean {
  return VOWEL.test(unit);
}

/** One vowel is one syllable. The consonant just before the next vowel starts that next syllable. */
export function syllabifyWord(word: string): string[] {
  const lead = /^[^\p{L}0-9]+/u.exec(word)?.[0] ?? "";
  const trail = /[^\p{L}0-9]+$/u.exec(word)?.[0] ?? "";
  const core = word.slice(lead.length, trail ? word.length - trail.length : word.length);
  if (!core) return [word];
  const units = unitsOf(core);
  const nuclei: number[] = [];
  for (let i = 0; i < units.length; i += 1) {
    if (!isVowel(units[i]!)) continue;
    let end = i;
    while (end + 1 < units.length && isVowel(units[end + 1]!)) end += 1;
    const run = units.slice(i, end + 1).join("");
    let cursor = i;
    while (cursor <= end) {
      const take = Math.min(vowelGroup(units.slice(cursor, end + 1).join("")), end - cursor + 1);
      nuclei.push(cursor);
      cursor += take;
    }
    i = end;
  }
  if (nuclei.length === 0) return [word];
  const parts: string[] = [];
  let cursor = 0;
  for (let n = 0; n < nuclei.length; n += 1) {
    const next = nuclei[n + 1];
    const end = next === undefined ? units.length : isVowel(units[next - 1]!) ? next : next - 1 > nuclei[n]! ? next - 1 : next;
    parts.push(units.slice(cursor, end).join(""));
    cursor = end;
  }
  if (parts.length === 0) return [word];
  parts[0] = lead + parts[0];
  parts[parts.length - 1] = parts[parts.length - 1] + trail;
  return parts.filter((part) => part.length > 0);
}

export type SyllablePiece = { text: string; breakBefore: boolean };

export function syllabifyLine(lyric: string): SyllablePiece[] {
  const words = lyric.trim().split(/\s+/).filter(Boolean);
  const pieces: SyllablePiece[] = [];
  words.forEach((word, wordIndex) => {
    syllabifyWord(word).forEach((text, index) => {
      pieces.push({ text, breakBefore: wordIndex > 0 && index === 0 });
    });
  });
  return pieces;
}

function mergeShortest(parts: SyllablePiece[]): SyllablePiece[] {
  let best = 0;
  let size = Number.POSITIVE_INFINITY;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const span = parts[i]!.text.length + parts[i + 1]!.text.length;
    if (span < size) {
      size = span;
      best = i;
    }
  }
  const left = parts[best]!;
  const right = parts[best + 1]!;
  const next = parts.slice();
  next.splice(best, 2, {
    text: right.breakBefore ? `${left.text} ${right.text}` : left.text + right.text,
    breakBefore: left.breakBefore,
  });
  return next;
}

/** The words of one line, and which piece each sounding note lands on.
 * Note lengths are in beats. An extra note stays with the syllable that is sounding then,
 * judged from the middle of the note, so the dot does not wait at the start of the line.
 */
export function followSyllables(lyric: string, notes: number | readonly number[]): { parts: SyllablePiece[]; at: number[] } {
  const beats = typeof notes === "number" ? Array.from({ length: Math.max(0, notes) }, () => 1) : notes;
  const count = beats.length;
  const at = Array.from({ length: count }, () => 0);
  const text = lyric.trim();
  if (count <= 0 || !text) return { parts: text ? [{ text, breakBefore: false }] : [], at };
  let parts = syllabifyLine(text);
  if (parts.length === 0) parts = [{ text, breakBefore: false }];
  while (parts.length > count) parts = mergeShortest(parts);
  if (parts.length === count) {
    for (let i = 0; i < count; i += 1) at[i] = i;
    return { parts, at };
  }
  const total = beats.reduce((sum, beat) => sum + beat, 0) || 1;
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const beat = beats[i] ?? 0;
    const middle = cursor + beat / 2;
    cursor += beat;
    at[i] = Math.min(parts.length - 1, Math.floor((middle / total) * parts.length));
  }
  at[0] = 0;
  if (count > 0) at[count - 1] = parts.length - 1;
  for (let i = 1; i < count; i += 1) if (at[i]! < at[i - 1]!) at[i] = at[i - 1]!;
  return { parts, at };
}

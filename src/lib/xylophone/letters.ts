export type NoteToken = { letter: string; length: string };

/** Split one ABC line into the letter a child reads and the length mark after it. */
export function noteTokens(abc: string): NoteToken[] {
  const tokens: NoteToken[] = [];
  for (const token of abc.split(/\s+/)) {
    if (!token) continue;
    const match = token.match(/^(\^|_|=)?([A-Ga-gzZ])([,']*)(.*)$/);
    if (!match) continue;
    tokens.push({ letter: `${match[1] ?? ""}${match[2]}${match[3] ?? ""}`, length: match[4] ?? "" });
  }
  return tokens;
}

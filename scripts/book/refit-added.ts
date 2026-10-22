// One-off repair of src/lib/xylophone/added.ts: the fifteen-bar line must be the written melody
// at its real range (it had been re-folded and hand-split), and eight is the fold of that line.
import { readFileSync, writeFileSync } from "node:fs";
import { parseEvents } from "../../src/lib/xylophone/parse.ts";
import { eightOf, fitFifteen, tok } from "./fit.ts";

const file = new URL("../../src/lib/xylophone/added.ts", import.meta.url);
let text = readFileSync(file, "utf8");
const songs = text.split("\n  {\n");
const fixed = songs.map((chunk) => {
  const re = /\{ source: "([^"]*)", eight: "[^"]*", fifteen: "[^"]*" \}/g;
  const sources = [...chunk.matchAll(re)].map((m) => m[1]!);
  if (!sources.length) return chunk;
  const events = sources.map((s) => parseEvents(s));
  const fifteen = fitFifteen(events.flat().map((e) => e.midi));
  const eight = eightOf(fifteen);
  let i = 0, line = 0;
  return chunk.replace(re, (_all, src: string) => {
    const ev = events[line++]!;
    const f = ev.map((e, k) => tok(fifteen[i + k]!, e.beats));
    const g = ev.map((e, k) => tok(eight[i + k]!, e.beats));
    i += ev.length;
    return `{ source: "${src}", eight: "${g.join(" ")}", fifteen: "${f.join(" ")}" }`;
  });
});
text = fixed.join("\n  {\n");
writeFileSync(file, text);

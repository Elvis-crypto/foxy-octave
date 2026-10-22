// Imports the vetted Recorder Hero book (Elvis-crypto/furulya-flow, scripts/songs_src.py → songs.generated.ts)
// into the xylophone format. Run: npx tsx scripts/book/import-recorder.ts /path/to/songs.generated.ts
import { writeFileSync } from "node:fs";
import { eightOf, fitFifteen, tok } from "./fit.ts";

type Raw = (number | string | null)[];
type Song = { id: string; title: Record<string, string>; origin: string; bpm: number; beatsPerBar: number; notes: Raw[]; verses: Raw[][] };

const path = process.argv[2] ?? "/workspace/recorder-hero/src/lib/songs.generated.ts";
const { SONGS } = (await import(path)) as { SONGS: Song[] };

/** Recorder id → existing xylophone id it replaces (same song, vetted data). */
export const REPLACES: Record<string, string> = {
  "tavaszi-szel": "tavaszi", "erik-a-szolo": "szolo", twinkle: "twinkle", "mary-lamb": "mary",
  "frere-jacques": "frere", "hull-a-szilva": "szilva", "bujj-bujj-zold-ag": "zoldag", "hej-dunarol": "duna",
  katalinka: "katalinka", "lanc-lanc": "lanc", "ode-to-joy": "ode", "brahms-lullaby": "brahms",
  "amazing-grace": "grace", "la-cucaracha": "cuca", "suss-fel-nap": "sussfel", kuckuck: "kuckuck",
  "alle-meine-entchen": "entchen", "hanschen-klein": "haenschen", "alle-vogel": "voegel",
};
const LANG: Record<string, string> = { hu: "hu", de: "de", at: "de", en: "en", us: "en", mx: "es", da: "da", fr: "fr" };
const LANG_FIX: Record<string, string> = { twinkle: "en" };

const THEISZ: Record<string, string> = {
  "tavaszi-szel": "TavasziSzel", "erdo-erdo": "ErdoErdoErdoMarosszekiKerekErdo", "kis-kece-lanyom": "KisKeceLanyom",
  "erik-a-szolo": "ErikASzolo", "hull-a-szilva": "HullASzilvaAFarol", "cifra-palota": "CifraPalota",
  "elesett-a-lud": "ElesettALudAJegen", debrecenbe: "DebrecenbeKeneMenni", hajnalcsillag: "MegyenMarAHajnalCsillagLefele",
  "osszel-erik-babam": "OsszelErikBabam", "en-kis-kertet": "EnKisKertetKerteltem", "felulrol-fuj": "FelulrolFujAzOsziSzel",
  "csiga-biga": "CsigaBigaGyereKi", katalinka: "KatalinkaSzalljEl", "mennybol-az-angyal": "MennybolAzAngyal",
  "a-jo-lovas-katonanak": "AJoLovasKatonanak", "komaromi-kisleany": "KomaromiKisleany", "suss-fel-nap": "SussFelNap",
  "ha-en-cica-volnek": "HaEnCicaVolnek", "bujj-bujj-zold-ag": "BujjBujjZoldAg", ablakomba: "Ablakomba",
};
const WIKI: Record<string, string> = {
  "hej-dunarol": "https://hu.wikipedia.org/wiki/Hej,_Dunáról_fúj_a_szél",
  csillagok: "https://hu.wikipedia.org/wiki/Csillagok,_csillagok",
  "megismerni-a-kanaszt": "https://hu.wikipedia.org/wiki/Megismerni_a_kanászt",
  "csitari-hegyek": "https://hu.wikipedia.org/wiki/A_csitári_hegyek_alatt",
  "lanc-lanc": "https://hu.wikipedia.org/wiki/Lánc,_lánc,_eszterlánc",
  "ode-to-joy": "https://en.wikipedia.org/wiki/Ode_to_Joy", "fur-elise": "https://en.wikipedia.org/wiki/Für_Elise",
  greensleeves: "https://en.wikipedia.org/wiki/Greensleeves", twinkle: "https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star",
  "frere-jacques": "https://en.wikipedia.org/wiki/Frère_Jacques", "amazing-grace": "https://en.wikipedia.org/wiki/Amazing_Grace",
  "happy-birthday": "https://en.wikipedia.org/wiki/Happy_Birthday_to_You", "star-wars": "https://en.wikipedia.org/wiki/Star_Wars_(theme)",
  "jingle-bells": "https://en.wikipedia.org/wiki/Jingle_Bells", "brahms-lullaby": "https://en.wikipedia.org/wiki/Wiegenlied_(Brahms)",
  saints: "https://en.wikipedia.org/wiki/When_the_Saints_Go_Marching_In", "eine-kleine": "https://en.wikipedia.org/wiki/Eine_kleine_Nachtmusik",
  "alle-meine-entchen": "https://de.wikipedia.org/wiki/Alle_meine_Entchen", "mary-lamb": "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "alle-vogel": "https://de.wikipedia.org/wiki/Alle_Vögel_sind_schon_da", kuckuck: "https://de.wikipedia.org/wiki/Kuckuck,_Kuckuck,_ruft’s_aus_dem_Wald",
  "hanschen-klein": "https://de.wikipedia.org/wiki/Hänschen_klein", "der-er-et-yndigt-land": "https://da.wikipedia.org/wiki/Der_er_et_yndigt_land",
  "la-cucaracha": "https://en.wikipedia.org/wiki/La_Cucaracha",
};

/** Not for a kindergarten: adult love, drinking, flirting. Verse numbers are 1-based. */
// Kept out of the book for children (everything else from the vetted recorder set is in):
// - hej-dunarol verse 2: "feküdj mellém" (lie down beside me) is a bedroom joke.
// - megismerni-a-kanaszt verse 2: wanting the swineherd's wife; verse 4: the farmhand "plays" with a young wife.
const DROP_SONGS = new Set<string>([]);
const DROP_VERSES: Record<string, number[]> = {
  "hej-dunarol": [2],
  "megismerni-a-kanaszt": [2, 4],
};

const syl = (n: Raw) => (typeof n[2] === "string" ? n[2] : "");
const clean = (s: string) => s.replace(/(cs|dz|gy|ly|ny|sz|ty|zs)-\s*\1/g, (_m, d: string) => d[0] + d).replace(/-\s*/g, "").replace(/\s+/g, " ").replace(/[\s,;:]+$/, "").trim();

const out: unknown[] = [];
for (const song of SONGS) {
  if (DROP_SONGS.has(song.id)) continue;
  const lang = LANG_FIX[song.id] ?? LANG[song.origin] ?? "en";
  const title = song.title[lang] ?? song.title.en ?? song.id;
  const notes = song.notes;
  const fifteen = fitFifteen(notes.map((n) => n[0] as number | null));
  const eight = eightOf(fifteen);
  // Line breaks: after a syllable ending a phrase, or every two bars for tunes without words.
  const hasWords = notes.some((n) => syl(n));
  const bar = song.beatsPerBar || 4;
  const bounds: number[] = []; // start beats of each line
  let beat = 0, count = 0, lineStart = 0;
  bounds.push(0);
  notes.forEach((n, i) => {
    beat += n[1] as number; count++;
    const last = i === notes.length - 1;
    const s = syl(n);
    const nextHasSyl = i + 1 < notes.length && syl(notes[i + 1]!);
    const phraseEnd = hasWords ? /[.,!?;:]\s*$/.test(s) && count >= 3 && (nextHasSyl || i + 1 >= notes.length) : beat - lineStart >= bar * 2 - 1e-6;
    const wordEnd = !/-\s*$/.test(s);
    if (!last && wordEnd && (phraseEnd || count >= 12)) { bounds.push(beat); lineStart = beat; count = 0; }
  });
  const lineOf = (b: number) => { let k = 0; while (k + 1 < bounds.length && b >= bounds[k + 1]! - 1e-6) k++; return k; };
  const tune = bounds.map(() => ({ source: [] as string[], eight: [] as string[], fifteen: [] as string[] }));
  beat = 0;
  notes.forEach((n, i) => {
    const k = lineOf(beat); const b = n[1] as number;
    tune[k]!.source.push(tok(n[0] as number | null, b));
    tune[k]!.fifteen.push(tok(fifteen[i]!, b));
    tune[k]!.eight.push(tok(eight[i]!, b));
    beat += b;
  });
  const words = (ns: Raw[]) => {
    const lines = bounds.map(() => "");
    let t = 0;
    let k = 0;
    for (const n of ns) {
      const want = lineOf(t);
      // Keep a word whole: only move to the next line once the previous syllable ended a word.
      if (want > k && !/-\s*$/.test(lines[k]!)) k = want;
      lines[k] += syl(n); t += n[1] as number;
    }
    return lines.map(clean);
  };
  const drop = DROP_VERSES[song.id] ?? [];
  const verses = hasWords ? [words(notes), ...song.verses.map(words)].filter((_, i) => !drop.includes(i + 1)) : [bounds.map(() => "")];
  const from = THEISZ[song.id]
    ? `https://dalok.theisz.hu/index.php?lang=hu&page=song&id=${THEISZ[song.id]}`
    : (WIKI[song.id] ?? "Traditional. Public domain.");
  out.push({
    id: REPLACES[song.id] ?? song.id, title, lang, bpm: song.bpm, from, eightFold: "leap",
    tune: tune.map((l) => ({ source: l.source.join(" "), eight: l.eight.join(" "), fifteen: l.fifteen.join(" ") })),
    verses,
  });
}
const body = `import type { RepertoireSong } from "./repertoire.ts";

// GENERATED by scripts/book/import-recorder.ts from the vetted Recorder Hero book. Do not hand-edit;
// fix the source there and re-run. source = the written melody, fifteen = the same melody in C at its
// real range (only notes outside C4–C6 move an octave), eight = the one-octave fold of fifteen.
export const RECORDER: readonly RepertoireSong[] = ${JSON.stringify(out, null, 1)};

/** Older xylophone songs replaced by the vetted versions above (same id). */
export const REPLACED_IDS: ReadonlySet<string> = new Set(${JSON.stringify(Object.values(REPLACES))});
`;
writeFileSync(new URL("../../src/lib/xylophone/recorder.ts", import.meta.url), body);
console.log("songs", out.length);

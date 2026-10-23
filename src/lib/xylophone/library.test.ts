import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ParseError, parseEvents } from "./parse.ts";
import { adoptCore, mergeTunes, sheetChanged, type SavedTune } from "./storage.ts";
import { CORE_STAMPS } from "./repertoire.ts";
import { followSyllables, syllabifyLine } from "./syllables.ts";
import { builtinCharts, compareSongs, compilePaste, compileWritten, linesFromChart } from "./songs.ts";
import { REPERTOIRE } from "./repertoire.ts";
import { ADDED } from "./added.ts";
import { RECORDER } from "./recorder.ts";
import { barsForSpan, foldEight, foldEightKeep, foldFifteen, placeMelody, transposeToC } from "./theory.ts";

describe("xylophone library", () => {
  it("keeps the newer tune and copies an unstamped phone tune up", () => {
    const phone: SavedTune = { id: "saved-1", title: "Mine", bpm: 100, abc: "C", lines: [{ lyric: "a", abc: "C" }] };
    const remote: SavedTune = { id: "saved-2", title: "Theirs", bpm: 90, abc: "D", lines: [{ lyric: "b", abc: "D" }], updatedAt: 10 };
    const older: SavedTune = { id: "saved-1", title: "Old", bpm: 80, abc: "E", lines: [{ lyric: "c", abc: "E" }], updatedAt: 5 };
    const { merged, upload } = mergeTunes([phone], [remote, older]);
    assert.equal(upload.length, 1);
    assert.equal(upload[0]?.id, "saved-1");
    assert.ok((upload[0]?.updatedAt ?? 0) > 0);
    assert.equal(merged.find((tune) => tune.id === "saved-2")?.title, "Theirs");
    const again = mergeTunes(
      [{ ...phone, updatedAt: 20, title: "New" }],
      [{ ...phone, updatedAt: 30, title: "Newer" }],
    );
    assert.equal(again.upload.length, 0);
    assert.equal(again.merged[0]?.title, "Newer");
  });

  it("treats the same words and notes as nothing new", () => {
    const line = [{ lyric: "Boci", abc: "C E G" }];
    assert.equal(sheetChanged(line, [{ lyric: "Boci", abc: "C  E   G" }]), false);
    assert.equal(sheetChanged(line, [{ lyric: "Boci", abc: "C F G" }]), true);
    assert.equal(sheetChanged(line, [{ lyric: "Boci boci", abc: "C E G" }]), true);
  });

  it("replaces a stale built-in and keeps a song the person added", () => {
    const mine: SavedTune = { id: "saved-1", title: "Mine", bpm: 100, abc: "C", lines: [{ lyric: "a", abc: "C" }] };
    const stale: SavedTune = { id: "boci", title: "Boci", bpm: 100, abc: "C", lines: [{ lyric: "", abc: "C" }] };
    const edited: SavedTune = { ...stale, coreStamp: CORE_STAMPS.boci, lines: [{ lyric: "saját", abc: "C" }] };
    assert.deepEqual(adoptCore([stale, mine]).map((tune) => tune.id), ["saved-1"]);
    assert.deepEqual(adoptCore([edited, mine]).map((tune) => tune.id), ["boci", "saved-1"]);
    const { merged } = mergeTunes([stale, mine], [stale]);
    assert.deepEqual(merged.map((tune) => tune.id), ["saved-1"]);
  });
  it("puts one syllable on each note of a line", () => {
    assert.deepEqual(
      syllabifyLine("Boci, boci tarka").map((part) => part.text),
      ["Bo", "ci,", "bo", "ci", "tar", "ka"],
    );
    assert.deepEqual(
      syllabifyLine("Boci, boci tarka").map((part) => part.breakBefore),
      [false, false, true, false, true, false],
    );
    assert.deepEqual(
      syllabifyLine("megyünk könnyű").map((part) => part.text),
      ["me", "gyünk", "kön", "nyű"],
    );
    const fitted = followSyllables("Varrtam neki nadrágot", 6);
    assert.equal(fitted.parts.length, 6);
    assert.deepEqual(fitted.at, [0, 1, 2, 3, 4, 5]);
    const held = followSyllables("Virágom, virágom", [0.5, 1.5, 1, 0.5, 0.5, 2, 1]);
    assert.equal(held.parts.length < 7, true);
    assert.equal(held.at.length, 7);
    assert.equal(held.at[0], 0);
    assert.equal(held.at[1], 1);
    assert.equal(held.at[6], held.parts.length - 1);
    const line = followSyllables("Tavaszi szél vizet áraszt", [1, 1, 0.5, 1.5, 1, 0.5, 0.5, 1, 1]);
    assert.equal(line.at[0], 0);
    assert.equal(line.at[1], 1);
    assert.equal(line.at[line.at.length - 1], line.parts.length - 1);
    for (let i = 1; i < line.at.length; i += 1) assert.ok(line.at[i]! >= line.at[i - 1]!);
  });

  it("keeps written C4 and C5 when nothing came before them", () => {
    assert.deepEqual(placeMelody([60]), [60]);
    assert.deepEqual(placeMelody([72]), [72]);
    assert.deepEqual(placeMelody([84]), [72]);
    assert.deepEqual(placeMelody([48]), [60]);
  });

  it("keeps a written high C on the upper bar only when that bar exists", () => {
    const wide = compilePaste("High", "c'", 100, "high", 15);
    assert.equal(wide.notes[0]?.midi, 84);
    assert.equal(wide.notes[0]?.lane, 0);
    const folded = compilePaste("High", "c'", 100, "high", 8);
    assert.equal(folded.notes[0]?.midi, 72);
    assert.equal(folded.notes[0]?.lane, 0);
  });

  it("folds a written C to the nearer bar, and can keep it when asked", () => {
    assert.deepEqual(placeMelody([67, 72]), [67, 72]);
    assert.deepEqual(placeMelody([62, 60]), [62, 60]);
    assert.deepEqual(placeMelody([64, 72]), [64, 60]);
    assert.deepEqual(placeMelody([67, 60], undefined, true), [67, 60]);
  });

  it("transposes G major onto C major", () => {
    const gMajor = [67, 69, 71, 72, 74, 76, 78];
    const shifted = transposeToC(gMajor);
    assert.deepEqual(
      shifted.map((midi) => ((midi % 12) + 12) % 12),
      [0, 2, 4, 5, 7, 9, 11],
    );
  });

  it("reads length, octave, and high C", () => {
    const events = parseEvents("C2 c/2 G, z");
    assert.equal(events[0]?.midi, 60);
    assert.equal(events[0]?.beats, 2);
    assert.equal(events[1]?.midi, 72);
    assert.equal(events[1]?.beats, 0.5);
    assert.equal(events[2]?.midi, 55);
    assert.equal(events[3]?.midi, null);
  });

  it("reads a real ABC sheet, then folds it into C", () => {
    const events = parseEvents("|:G3 GAB|");
    assert.equal(events.length, 4);
    assert.equal(events[0]?.beats, 3);
    const chart = compilePaste(
      "Kesh",
      "K:G\nL:1/8\n|:G3 GAB|BAF G3:|",
      120,
      "kesh",
    );
    assert.equal(chart.notes[0]?.midi, 72);
    for (const note of chart.notes) assert.ok(note.lane >= 0 && note.lane <= 7);
  });

  it("rejects a word that is not a note", () => {
    assert.throws(() => parseEvents("C hello"), ParseError);
  });

  it("keeps a silence between notes and a line that is only silence", () => {
    const events = parseEvents("C z G");
    assert.deepEqual(
      events.map((event) => event.midi),
      [60, null, 67],
    );
    const chart = compileWritten("rest", "Rest", 100, [{ lyric: "la", abc: "C z G" }, { lyric: "", abc: "z" }], 8);
    assert.deepEqual(
      chart.notes.map((note) => note.startBeat),
      [0, 2],
    );
    assert.equal(chart.endBeat, 4);
    assert.throws(() => compileWritten("quiet", "Quiet", 100, [{ lyric: "", abc: "z" }], 8), ParseError);
  });

  it("builds the builtin songs on the eight bars", () => {
    const charts = builtinCharts();
    assert.equal(charts.length, REPERTOIRE.length);
    assert.ok(charts.length >= 80);
    assert.ok(charts.filter((chart) => chart.lang === "hu").length >= 30);
    for (const lang of ["en", "fr", "de", "es", "da"] as const) {
      assert.ok(charts.filter((chart) => chart.lang === lang).length >= 3, lang);
    }
    assert.equal(new Set(charts.map((chart) => chart.id)).size, charts.length);
    assert.equal(charts[0]?.id, "boci");
    const twinkle = charts.find((chart) => chart.id === "twinkle")!;
    assert.deepEqual(
      twinkle.notes.slice(0, 7).map((note) => note.midi),
      [60, 60, 67, 67, 69, 69, 67],
    );
    assert.ok(twinkle.notes.some((note) => note.phrase.startsWith("When the blazing")));
    const tavaszi = charts.find((chart) => chart.id === "tavaszi")!;
    assert.ok(tavaszi.notes.some((note) => note.phrase === "Te engemet, én Tégedet"));
    const row = charts.find((chart) => chart.id === "row")!;
    const merrily = row.notes.find((note) => note.phrase === "Merrily, merrily")!;
    assert.equal(merrily.lane, 0);
    for (const chart of charts) {
      assert.ok(chart.notes.length > 0);
      for (const note of chart.notes) assert.ok(note.lane >= 0 && note.lane <= 7);
    }
  });

  it("keeps the real range on fifteen bars and folds only the eight", () => {
    const eight = builtinCharts(8).find((chart) => chart.id === "boci")!;
    const wide = builtinCharts(15).find((chart) => chart.id === "boci")!;
    assert.deepEqual(wide.notes.map((note) => note.midi), eight.notes.map((note) => note.midi));
    assert.equal(wide.notes[5]?.midi, 67);
    assert.equal(wide.notes[6]?.midi, 60);
    // A tune that spans more than an octave must not be folded on the long instrument.
    for (const id of ["szilva", "erdo-erdo", "mennybol-az-angyal", "cuca", "alouette"]) {
      const w = builtinCharts(15).find((chart) => chart.id === id)!;
      const n = builtinCharts(8).find((chart) => chart.id === id)!;
      assert.ok(w.notes.some((note) => note.midi > 72), id);
      assert.ok(n.notes.every((note) => note.midi >= 60 && note.midi <= 72), id);
      const span = Math.max(...w.notes.map((note) => note.midi)) - Math.min(...w.notes.map((note) => note.midi));
      if (id !== "alouette") assert.ok(span > 12, id);
    }
    const itsy = builtinCharts(8).find((chart) => chart.id === "itsy")!;
    const itsy15 = builtinCharts(15).find((chart) => chart.id === "itsy")!;
    assert.equal(itsy.notes[1]?.midi, 72);
    assert.equal(itsy15.notes[1]?.midi, 60);
  });

  it("keeps each source line beside the two folds", () => {
    const later = new Set([...ADDED, ...RECORDER].map((song) => song.id));
    for (const song of REPERTOIRE) {
      assert.ok(song.from.length > 8, song.id);
      assert.ok(song.verses.length > 0, song.id);
      for (const verse of song.verses) assert.equal(verse.length, song.tune.length, song.id);
      const parsed = song.tune.map((line) => parseEvents(line.source));
      const flat = parsed.flat().map((event) => event.midi);
      const fifteenLine = song.tune.flatMap((line) => parseEvents(line.fifteen).map((event) => event.midi));
      const eightLine = song.tune.flatMap((line) => parseEvents(line.eight).map((event) => event.midi));
      assert.equal(fifteenLine.length, flat.length, song.id);
      assert.equal(eightLine.length, flat.length, song.id);
      if (later.has(song.id)) {
        // Fifteen is the written melody moved into C: on the bars, same shape (bar for a rare accidental).
        assert.deepEqual(foldFifteen(fifteenLine), fifteenLine, song.id);
        assert.deepEqual(eightLine, foldEight(fifteenLine), song.id);
        continue;
      }
      const eight = song.eightFold === "keep" ? foldEightKeep(flat) : foldEight(flat);
      assert.deepEqual(eightLine, eight, song.id);
      assert.deepEqual(fifteenLine, foldFifteen(flat), song.id);
    }
  });

  it("writes the notes that play, words included, for each size", () => {
    for (const span of [8, 15] as const) {
      for (const chart of builtinCharts(span)) {
        const lines = linesFromChart(chart);
        assert.ok(lines.every((line) => line.abc.length > 0));
        const again = compileWritten(chart.id, chart.title, chart.bpm, lines, span, chart.lang);
        assert.deepEqual(
          again.notes.map((note) => `${note.phrase}:${note.midi}:${note.beats}`),
          chart.notes.map((note) => `${note.phrase}:${note.midi}:${note.beats}`),
        );
      }
    }
    const boci = linesFromChart(builtinCharts(8).find((chart) => chart.id === "boci")!);
    assert.equal(boci[1]?.lyric, "Se füle, se farka");
    assert.match(boci[1]?.abc ?? "", /^C/);
    const wide = compileWritten("top", "Top", 100, [{ lyric: "up", abc: "c'" }], 15);
    assert.equal(wide.notes[0]?.midi, 84);
    assert.equal(wide.notes[0]?.phrase, "up");
  });

  it("folds a pasted tune and refuses an empty one", () => {
    const chart = compilePaste("Mine", "K:G\nG A B c d e ^f", 100, "saved-1");
    assert.equal(chart.notes[0]?.midi, 72);
    assert.throws(() => compilePaste("Nope", "||||", 100, "saved-2"), ParseError);
  });

  it("lists the app language, then English, then the other languages", () => {
    const songs = [
      { title: "Twinkle", lang: "en" as const },
      { title: "Alouette", lang: "fr" as const },
      { title: "Boci", lang: "hu" as const },
      { title: "Aki", lang: "hu" as const },
      { title: "Amazing", lang: "en" as const },
      { title: "Bjørnen", lang: "da" as const },
      { title: "Højt", lang: "da" as const },
      { title: "Hoppe", lang: "da" as const },
      { title: "Mine" },
    ];
    const names = (app: string) => songs.slice().sort((a, b) => compareSongs(a, b, app)).map((song) => song.title);
    assert.deepEqual(names("hu"), ["Aki", "Boci", "Amazing", "Twinkle", "Alouette", "Bjørnen", "Hoppe", "Højt", "Mine"]);
    assert.deepEqual(names("fr"), ["Alouette", "Amazing", "Twinkle", "Aki", "Boci", "Bjørnen", "Hoppe", "Højt", "Mine"]);
    assert.deepEqual(names("en"), ["Amazing", "Twinkle", "Aki", "Boci", "Alouette", "Bjørnen", "Hoppe", "Højt", "Mine"]);
    assert.deepEqual(names("da"), ["Bjørnen", "Hoppe", "Højt", "Amazing", "Twinkle", "Aki", "Boci", "Alouette", "Mine"]);
  });
});

it("a typed title already in the book is found without a search", async () => {
  const { findByTitle } = await import("./songs.ts");
  const book = [{ title: "Twinkle, Twinkle, Little Star" }, { title: "Tavaszi szél vizet áraszt" }, { title: "Tavaszi dal" }];
  assert.equal(findByTitle(book, "twinkle twinkle little star")?.title, book[0]!.title);
  assert.equal(findByTitle(book, "Twinkle")?.title, book[0]!.title);
  assert.equal(findByTitle(book, "tavaszi szel")?.title, book[1]!.title);
  assert.equal(findByTitle(book, "Tavaszi"), null);
  assert.equal(findByTitle(book, "Cucaracha"), null);
});

it("notes with no bar are counted after the best key is chosen", async () => {
  const { bentCount, parseEvents } = await import("./parse.ts");
  assert.equal(bentCount(parseEvents("F G A _B c")), 0);
  assert.equal(bentCount(parseEvents("G A B c d e ^f g")), 0);
  assert.equal(bentCount(parseEvents("C D E ^F G _B")), 2);
});

it("every recorder song is in the book", () => {
  assert.equal(RECORDER.length, 45);
});

it("the fox picks behaviors that fit the song and the moment", async () => {
  const { nextBehavior, sceneFor, BEHAVIORS } = await import("../../components/xylophone/fox-scene.tsx");
  assert.equal(sceneFor("jingle-bells", "Jingle Bells"), "winter");
  assert.equal(sceneFor("brahms", "x"), "night");
  assert.equal(sceneFor("x", "Tavaszi dal"), "spring");
  for (let r = 0; r < 1; r += 0.01) {
    assert.ok(BEHAVIORS.includes(nextBehavior("night", false, false, r)));
    assert.ok(["dance", "hop", "chase"].includes(nextBehavior("dance", true, false, r)));
    assert.ok(["sit", "tilt", "sniff", "yawn", "chase", "roll", "walk"].includes(nextBehavior("winter", false, true, r)));
  }
});

it("fox v3: every scene has 1-3 known toys and the engine steps without throwing", async () => {
  const eng = await import("../../components/xylophone/fox-engine.ts");
  for (const [kind, list] of Object.entries(eng.SCENE_OBJECTS)) {
    assert.ok(list.length >= 1 && list.length <= 3, kind);
    for (const k of list) assert.ok(eng.OBJECTS.includes(k));
  }
  for (const k of eng.OBJECTS) {
    const e = new eng.FoxEngine();
    e.resize(360);
    e.setObjects([k]);
    e.input = { ...e.input, forceObj: k };
    e.start("auto");
    for (let i = 0; i < 1200; i++) e.frame(1 / 60);
    for (const o of e.objs) assert.ok(Number.isFinite(o.x) && Number.isFinite(o.y), k);
  }
});

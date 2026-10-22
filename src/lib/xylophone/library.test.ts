import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ParseError, parseEvents } from "./parse.ts";
import { adoptCore, mergeTunes, sheetChanged, type SavedTune } from "./storage.ts";
import { CORE_STAMPS } from "./repertoire.ts";
import { followSyllables, syllabifyLine } from "./syllables.ts";
import { builtinCharts, compareSongs, compilePaste, compileWritten, linesFromChart } from "./songs.ts";
import { REPERTOIRE } from "./repertoire.ts";
import { ADDED } from "./added.ts";
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
    assert.equal(charts.length, 66);
    assert.equal(charts.filter((chart) => chart.lang === "hu").length, 15);
    for (const lang of ["en", "fr", "de", "es", "da"] as const) {
      assert.ok(charts.filter((chart) => chart.lang === lang).length >= 10, lang);
    }
    assert.equal(charts[0]?.id, "boci");
    const twinkle = charts.find((chart) => chart.id === "twinkle")!;
    assert.deepEqual(
      twinkle.notes.slice(0, 7).map((note) => note.lane),
      [7, 7, 3, 3, 2, 2, 3],
    );
    assert.equal(twinkle.notes[0]?.phrase, "Twinkle, twinkle, little star");
    assert.ok(twinkle.notes.some((note) => note.phrase === "When the blazing sun is gone"));
    const boci = charts.find((chart) => chart.id === "boci")!;
    assert.ok(boci.notes.some((note) => note.phrase === "Ágyba kellett fektetni"));
    const tavaszi = charts.find((chart) => chart.id === "tavaszi")!;
    assert.ok(tavaszi.notes.some((note) => note.phrase === "Te engemet, én tégedet"));
    const szolo = charts.find((chart) => chart.id === "szolo")!;
    assert.ok(szolo.notes.some((note) => note.phrase === "De kevés vacsora"));
    const szilva = charts.find((chart) => chart.id === "szilva")!;
    assert.ok(szilva.notes.some((note) => note.phrase === "pávatollu van benne"));
    const ode = charts.find((chart) => chart.id === "ode")!;
    assert.ok(ode.notes.some((note) => note.phrase === "Wo dein sanfter Flügel weilt"));
    assert.deepEqual(
      ode.notes.slice(0, 4).map((note) => note.lane),
      [5, 5, 4, 3],
    );
    const row = charts.find((chart) => chart.id === "row")!;
    const merrily = row.notes.find((note) => note.phrase === "Merrily, merrily")!;
    assert.equal(merrily.lane, 0);
    for (const chart of charts) {
      assert.ok(chart.notes.length > 0);
      for (const note of chart.notes) assert.ok(note.lane >= 0 && note.lane <= 7);
    }
  });

  it("does not invent a high C when fifteen bars play Boci", () => {
    const eight = builtinCharts(8).find((chart) => chart.id === "boci")!;
    const wide = builtinCharts(15).find((chart) => chart.id === "boci")!;
    assert.deepEqual(
      wide.notes.map((note) => note.midi),
      eight.notes.map((note) => note.midi),
    );
    assert.equal(wide.notes[0]?.phrase, "Boci, boci tarka");
    assert.equal(wide.notes[6]?.phrase, "Se füle, se farka");
    assert.equal(wide.notes[5]?.midi, 67);
    assert.equal(wide.notes[6]?.midi, 60);
    const golya8 = builtinCharts(8).find((chart) => chart.id === "golya")!;
    const golya15 = builtinCharts(15).find((chart) => chart.id === "golya")!;
    assert.deepEqual(
      golya15.notes.map((note) => note.midi),
      golya8.notes.map((note) => note.midi),
    );
    assert.deepEqual(
      golya15.notes.map((note) => note.phrase),
      golya8.notes.map((note) => note.phrase),
    );
    const ode8 = builtinCharts(8).find((chart) => chart.id === "ode")!;
    const ode15 = builtinCharts(15).find((chart) => chart.id === "ode")!;
    assert.deepEqual(
      ode8.notes.slice(0, 8).map((note) => note.midi),
      [64, 64, 65, 67, 67, 65, 64, 62],
    );
    assert.deepEqual(
      ode15.notes.map((note) => note.midi),
      ode8.notes.map((note) => note.midi),
    );
    assert.equal(ode8.notes[0]?.phrase, "Freude, schöner Götterfunken");
    assert.equal(ode8.notes.at(-1)?.phrase, "Und der Cherub steht vor Gott");
    const itsy = builtinCharts(8).find((chart) => chart.id === "itsy")!;
    const itsy15 = builtinCharts(15).find((chart) => chart.id === "itsy")!;
    assert.equal(itsy.notes[1]?.midi, 72);
    assert.equal(itsy15.notes[1]?.midi, 60);
    assert.ok(builtinCharts(8).find((chart) => chart.id === "boci")!.notes.some((note) => note.phrase === "Itt maradunk lakni"));
  });

  it("keeps each source line beside the two folds", () => {
    const addedIds = new Set(ADDED.map((song) => song.id));
    for (const song of REPERTOIRE) {
      if (addedIds.has(song.id)) continue;
      assert.ok(song.from.length > 8, song.id);
      assert.ok(song.verses.length > 0, song.id);
      for (const verse of song.verses) assert.equal(verse.length, song.tune.length, song.id);
      const parsed = song.tune.map((line) => parseEvents(line.source));
      const flat = parsed.flat().map((event) => event.midi);
      const eight = song.eightFold === "keep" ? foldEightKeep(flat) : foldEight(flat);
      const fifteen = foldFifteen(flat);
      let cursor = 0;
      for (const [index, line] of song.tune.entries()) {
        const count = parsed[index]!.length;
        assert.deepEqual(parseEvents(line.eight).map((event) => event.midi), eight.slice(cursor, cursor + count), song.id);
        assert.deepEqual(parseEvents(line.fifteen).map((event) => event.midi), fifteen.slice(cursor, cursor + count), song.id);
        cursor += count;
      }
    }
  });

  it("fits the new verses and folds only the eight bars", () => {
    for (const song of ADDED) {
      assert.equal(song.eightFold, "leap", song.id);
      for (const [index, line] of song.tune.entries()) {
        const source = parseEvents(line.source);
        const fifteen = parseEvents(line.fifteen);
        const eight = parseEvents(line.eight);
        const beats = (events: { beats: number }[]) => events.reduce((sum, event) => sum + event.beats, 0);
        assert.equal(beats(fifteen), beats(source), `${song.id} fifteen`);
        assert.equal(beats(eight), beats(source), `${song.id} eight`);
        const fitted: (number | null)[] = [];
        let cursor = 0;
        for (const event of source) {
          let got = 0;
          while (got + 1e-6 < event.beats) {
            const piece = fifteen[cursor];
            assert.ok(piece, song.id);
            got += piece.beats;
            fitted.push(event.midi);
            cursor += 1;
          }
          assert.ok(Math.abs(got - event.beats) < 1e-6, `${song.id} split`);
        }
        assert.equal(cursor, fifteen.length, song.id);
        assert.deepEqual(
          fifteen.map((event) => event.midi),
          foldFifteen(fitted),
          song.id,
        );
        assert.deepEqual(
          eight.map((event) => event.midi),
          foldEight(fifteen.map((event) => event.midi)),
          song.id,
        );
        const sounding = fifteen.filter((event) => event.midi !== null).length;
        for (const verse of song.verses) {
          assert.ok(syllabifyLine(verse[index] ?? "").length <= sounding, `${song.id} ${verse[index]}`);
        }
      }
    }
    const wide = builtinCharts(15).find((chart) => chart.id === "alouette")!;
    const narrow = builtinCharts(8).find((chart) => chart.id === "alouette")!;
    assert.ok(wide.notes.some((note) => note.midi > 72));
    assert.ok(narrow.notes.every((note) => note.midi <= 72));
    assert.ok(narrow.notes.some((note) => note.midi === 72));
  });

  it("writes the notes that play, words included, for each size", () => {
    for (const span of [8, 15] as const) {
      for (const chart of builtinCharts(span)) {
        const lines = linesFromChart(chart);
        assert.ok(lines.every((line) => line.lyric.length > 0 && line.abc.length > 0));
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

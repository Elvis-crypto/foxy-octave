import { useEffect, useMemo, useRef, useState } from "react";
import { peekAudio, scheduleBar, silenceAll, unlockAudio } from "@/lib/xylophone/audio";
import { playLabel } from "@/lib/xylophone/christmas";
import type { Lang } from "@/lib/xylophone/i18n";
import { noteTokens } from "@/lib/xylophone/letters";
import { DEFAULT_PAPER_TAG, partnerTag } from "@/lib/xylophone/partner";
import { REPERTOIRE, type RepertoireSong } from "@/lib/xylophone/repertoire";
import { builtinCharts, compareSongs } from "@/lib/xylophone/songs";
import { rememberPlayed } from "@/lib/xylophone/storage";
import { QrCode } from "./qr-code";
import { usePageLang, usePageSearch } from "./use-page-lang";

type PosterLang = "hu" | "de" | "en";

const POSTER: Record<PosterLang, { brand: string; line: string; scan: string; tag: string }> = {
  hu: {
    brand: "Rókás oktáv",
    line: "Énekeljünk a xilofonnal.",
    scan: "Olvasd be a kódot.",
    tag: "Jel",
  },
  de: {
    brand: "Fuchsoktave",
    line: "Wir singen mit dem Xylophon.",
    scan: "Lies den Code.",
    tag: "Kennung",
  },
  en: {
    brand: "Foxy Octave",
    line: "Sing with the xylophone.",
    scan: "Scan the code.",
    tag: "Tag",
  },
};

const ROOM: Record<Lang, { title: string; songs: string; print: string; poster: string; stop: string; home: string }> = {
  hu: { title: "Tanterem", songs: "Dalok", print: "Nyomtatás", poster: "Plakát", stop: "Állj", home: "Xilofon" },
  en: { title: "Classroom", songs: "Songs", print: "Print", poster: "Poster", stop: "Stop", home: "Xylophone" },
  fr: { title: "Classe", songs: "Chansons", print: "Imprimer", poster: "Affiche", stop: "Stop", home: "Xylophone" },
  de: { title: "Klassenzimmer", songs: "Lieder", print: "Drucken", poster: "Plakat", stop: "Stopp", home: "Xylophon" },
  es: { title: "Aula", songs: "Canciones", print: "Imprimir", poster: "Cartel", stop: "Para", home: "Xilófono" },
  da: { title: "Klasseværelse", songs: "Sange", print: "Udskriv", poster: "Plakat", stop: "Stop", home: "Xylofon" },
};

function letters(abc: string): string {
  return noteTokens(abc)
    .map((token) => `${token.letter}${token.length}`)
    .join(" ");
}

export function TeacherPage({ suggested, search }: { suggested: Lang; search: string }) {
  const lang = usePageLang(suggested);
  const liveSearch = usePageSearch(search);
  const text = ROOM[lang];
  const songs = useMemo(
    () => [...REPERTOIRE].sort((a, b) => compareSongs(a, b, lang)),
    [lang],
  );
  const charts = useMemo(() => builtinCharts(8), []);
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [verse, setVerse] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [tagInput, setTagInput] = useState(DEFAULT_PAPER_TAG);
  const [posterLang, setPosterLang] = useState<PosterLang>(suggested === "de" || suggested === "en" ? suggested : "hu");
  const [origin, setOrigin] = useState("");
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopRef.current(), []);

  useEffect(() => {
    const params = new URLSearchParams(liveSearch.startsWith("?") ? liveSearch.slice(1) : liveSearch);
    const from = partnerTag(params.get("from"));
    if (from) setTagInput(from);
    const linked = params.get("song");
    if (linked && REPERTOIRE.some((song) => song.id === linked)) setSongId(linked);
  }, [liveSearch]);

  const effective = partnerTag(tagInput) ?? DEFAULT_PAPER_TAG;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("from") === effective) return;
    url.searchParams.set("from", effective);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [effective]);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (window.location.hash !== "#poszter") return;
    const node = document.getElementById("poszter");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const song = songs.find((item) => item.id === songId) ?? songs[0];
  const poster = POSTER[posterLang];
  const qr = origin ? `${origin}/?from=${effective}&lang=${posterLang}` : "";
  const tuneLen = song?.tune.length ?? 1;
  const shownVerse = playing && activeLine >= 0 ? Math.floor(activeLine / tuneLen) : verse;
  const lineInVerse = activeLine >= 0 ? activeLine % tuneLen : -1;

  function choose(next: RepertoireSong) {
    stopRef.current();
    setSongId(next.id);
    setVerse(0);
    setActiveLine(-1);
  }

  function play(current: RepertoireSong) {
    const chart = charts.find((item) => item.id === current.id);
    if (!chart || chart.notes.length === 0) return;
    stopRef.current();
    const audio = unlockAudio();
    const originAt = audio.currentTime + 0.06;
    let frame = 0;
    let stopped = false;
    for (const note of chart.notes) {
      scheduleBar(note.midi, originAt + (note.startBeat * 60) / chart.bpm);
    }
    const endBeat = Math.max(chart.endBeat, chart.notes.at(-1)?.startBeat ?? 0);
    setPlaying(true);
    const finish = (done: boolean) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      silenceAll();
      setPlaying(false);
      setActiveLine(-1);
      if (done) rememberPlayed(chart.id);
    };
    stopRef.current = () => finish(false);
    const tick = () => {
      if (stopped) return;
      const now = peekAudio()?.currentTime ?? 0;
      const beat = ((now - originAt) * chart.bpm) / 60;
      let line = chart.notes[0]?.line ?? 0;
      for (const note of chart.notes) {
        if (note.startBeat <= beat + 0.05) line = note.line;
        else break;
      }
      setActiveLine(line);
      setVerse(Math.floor(line / current.tune.length));
      if (beat > endBeat + 0.75) {
        finish(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  if (!song) return null;
  const words = song.verses[Math.min(shownVerse, song.verses.length - 1)] ?? song.verses[0] ?? [];

  return (
    <main className="min-h-dvh bg-wall text-ink">
      <div className="no-print mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[20rem_1fr]">
        <section>
          <nav className="text-sm">
            <a href={`/?${new URLSearchParams({ lang, ...(effective ? { from: effective } : {}) }).toString()}`} className="font-medium">
              {text.home}
            </a>
          </nav>
          <h1 className="mt-4 font-display text-4xl font-medium">{text.title}</h1>
          <p className="mt-4 text-sm font-medium">{text.songs}</p>
          <ul className="song-list mt-2 max-h-[50dvh] overflow-y-auto rounded-2xl bg-track">
            {songs.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  className={`flex h-12 w-full items-center px-3 text-left text-base font-medium ${item.id === song.id ? "bg-ink text-wall" : "text-ink"}`}
                  aria-current={item.id === song.id ? "true" : undefined}
                >
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (playing ? stopRef.current() : play(song))}
              className="h-12 rounded-full bg-ink px-6 text-base font-medium text-wall"
            >
              {playing ? text.stop : playLabel(lang)}
            </button>
            {song.verses.length > 1 ? (
              <div className="flex flex-wrap gap-1">
                {song.verses.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={shownVerse === index}
                    onClick={() => setVerse(index)}
                    className={`h-12 min-w-12 rounded-full px-3 text-base font-medium ${shownVerse === index ? "bg-coral text-ink" : "bg-track text-ink"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <h2 className="mt-6 font-display text-5xl font-medium text-balance sm:text-6xl">{song.title}</h2>
          <div className="mt-6 space-y-4">
            {words.map((line, index) => (
              <div key={index} className={lineInVerse === index ? "rounded-3xl bg-coral/40 px-4 py-3" : "px-4 py-3"}>
                <p className="font-display text-4xl leading-tight text-balance sm:text-5xl">{line}</p>
                <p className="mt-2 text-2xl tracking-wide sm:text-3xl">{letters(song.tune[index]?.eight ?? "")}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section id="poszter" className="no-print mx-auto max-w-6xl px-4 pb-10 scroll-mt-4">
        <h2 className="font-display text-3xl font-medium">{text.poster}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-muted">{POSTER[posterLang].tag}</span>
            <input
              value={tagInput}
              maxLength={32}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setTagInput(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32))}
              className="mt-1 h-11 rounded-full bg-track px-4 text-base text-ink outline-none"
            />
          </label>
          <div className="flex gap-1">
            {(["hu", "de", "en"] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={posterLang === id}
                onClick={() => setPosterLang(id)}
                className={`h-11 rounded-full px-4 text-sm font-medium ${posterLang === id ? "bg-ink text-wall" : "bg-track text-ink"}`}
              >
                {id}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => window.print()} className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-wall">
            {text.print}
          </button>
        </div>
      </section>

      <article className="poster-sheet mx-auto my-6 flex max-w-[210mm] flex-col items-center justify-between bg-white px-8 py-10 text-center text-[#241f1c] shadow-none">
        <img src="/fox-head.png" alt="" width={120} height={134} className="poster-fox object-contain" />
        <div>
          <h2 className="font-display text-5xl font-medium">{poster.brand}</h2>
          <p className="mt-4 text-2xl">{poster.line}</p>
        </div>
        <div className="poster-qr">
          <QrCode text={qr} label={poster.scan} />
        </div>
        <div>
          <p className="text-2xl">{poster.scan}</p>
          <p className="mt-3 text-xl">
            {poster.tag}: {effective}
          </p>
        </div>
      </article>
    </main>
  );
}

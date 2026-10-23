import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Bug, Eye, Heart, Moon, Pause, Pencil, Play, Plus, Settings, Square, Sun, Volume2, VolumeX } from "lucide-react";
import {
  cancelUpcoming,
  peekAudio,
  playBarNow,
  previewChime,
  scheduleBar,
  scheduleClick,
  setChime,
  setMuted,
  silenceAll,
  unlockAudio,
  type Chime,
} from "@/lib/xylophone/audio";
import { ParseError } from "@/lib/xylophone/parse";
import { builtinCharts, compareSongs, findByTitle, compilePaste, compileWritten, linesFromChart, type SheetLine, type SongChart, type TuneLang } from "@/lib/xylophone/songs";
import { FoxScene, type FoxCue } from "./fox-scene";
import { lookupSheet } from "@/lib/xylophone/lookup";
import { centsBetween, nearestBar } from "@/lib/xylophone/pitch";
import { gradeHit, shouldCall, tallyGrades, type Grade, type Tally, type Verdict } from "@/lib/xylophone/score";
import { ToyEar } from "@/lib/xylophone/ear";
import { clearToy, loadToy, saveToy } from "@/lib/xylophone/toy";
import { loadDisk, adoptCore, mergeTunes, sheetChanged, writeDisk, type SavedTune } from "@/lib/xylophone/storage";
import { CORE_STAMPS } from "@/lib/xylophone/repertoire";
import { captureTune, listMyTunes, removeMyTune, saveMyTune } from "@/lib/xylophone/cloud";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SignInGate, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { copy, isLang, localizeError, UI_LANGS, type Lang } from "@/lib/xylophone/i18n";
import { REPERTOIRE } from "@/lib/xylophone/repertoire";
import { followSyllables } from "@/lib/xylophone/syllables";
import { countPartnerVisit, saveReport } from "@/lib/xylophone/reports";
import { barsForSpan, type Bar, type Span } from "@/lib/xylophone/theory";

const KEYS = ["A", "S", "D", "F", "G", "H", "J", "K"];
const EXTRA_KEYS = ["1", "2", "3", "4", "5", "6", "7"];
const TIP_ADDRESS = "0xd9c2b215bCB0695048C6A8300eEd769F1C9dD6fA";
const TIP_WALLETS = [
  { id: "evm", address: TIP_ADDRESS },
  { id: "sol", address: "B7D49viYPRt9Z5SZs9fzumYqH6vA5fnuPeo17C4QexXg" },
  { id: "btc", address: "bc1q5p5anqgcrhh8876xwwl6jmd4eslwr6g7kgfp79" },
  { id: "tap", address: "bc1penwr0pnpqt6wzjewzad0g6jnjvam00gw2hwjws7nqj4ahsu79yrqtgleyz" },
] as const;
/** Hosted card checkouts. Remove an entry to drop that amount; with none left (and no wallets) the jar hides. */
const TIP_CARDS: readonly (readonly [string, string])[] = [
  ["500 Ft", "https://buy.stripe.com/7sYeVdaQm7VC248gJZ1sQ00"],
  ["1 500 Ft", "https://buy.stripe.com/5kQ9AT6A63Fm7os1P51sQ02"],
  ["4 000 Ft", "https://buy.stripe.com/eVqfZh9Migs8104bpF1sQ01"],
];
const TIP_JAR = TIP_CARDS.length > 0 || TIP_WALLETS.length > 0;

function compileStored(tune: SavedTune, span: Span): SongChart {
  const lines = span === 15 && tune.wide?.length ? tune.wide : tune.lines;
  if (lines?.length) return compileWritten(tune.id, tune.title, tune.bpm, lines, span);
  return compilePaste(tune.title, tune.abc, tune.bpm, tune.id, span);
}

function playedLines(id: string, tune: SavedTune | undefined, span: Span): SheetLine[] {
  if (span === 15 && tune?.wide?.length) return tune.wide.map((line) => ({ ...line }));
  if (tune?.lines?.length) {
    if (span === 8) return tune.lines.map((line) => ({ ...line }));
    try {
      return linesFromChart(compileWritten(id, tune.title, tune.bpm, tune.lines, 15));
    } catch {
      /* the eight-bar sheet did not fit; fall through */
    }
  }
  if (tune?.abc) {
    try {
      return linesFromChart(compilePaste(tune.title, tune.abc, tune.bpm, id, span));
    } catch {
      /* unreadable older sheet */
    }
  }
  const built = builtinCharts(span).find((item) => item.id === id);
  return built ? linesFromChart(built) : [{ lyric: "", abc: "" }];
}

function copyText(value: string): boolean {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
type Phase = "idle" | "playing" | "paused";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function noteAt(notes: SongChart["notes"], beat: number): SongChart["notes"][number] | undefined {
  if (notes.length === 0) return undefined;
  if (beat < notes[0]!.startBeat) return notes[0];
  let current = notes[0]!;
  for (const note of notes) {
    if (note.startBeat <= beat + 0.05) current = note;
    else break;
  }
  return current;
}

function phraseAt(notes: SongChart["notes"], beat: number): string {
  if (notes.length === 0) return "";
  if (beat < notes[0]!.startBeat) return notes[0]!.phrase;
  let phrase = notes[0]!.phrase;
  for (const note of notes) {
    if (note.startBeat <= beat + 0.05) phrase = note.phrase;
    else break;
  }
  return phrase;
}

function laneIndex(bar: Bar, bars: readonly Bar[]): number {
  return bars.findIndex((item) => item.id === bar.id);
}

function keyLabel(index: number): string {
  return KEYS[index] ?? EXTRA_KEYS[index - KEYS.length] ?? "";
}

/** The original eight bars. On the long instrument they sit after the lighter octave. */
function baseLane(step: number, size: Span): number {
  return size === 15 ? step + 7 : step;
}

function keyColumn(key: string): number {
  const letter = KEYS.indexOf(key.toUpperCase());
  if (letter >= 0) return letter;
  const extra = EXTRA_KEYS.indexOf(key);
  return extra >= 0 ? KEYS.length + extra : -1;
}

/** Low C on the left, unless the bars were flipped. */
function shownBars(bars: readonly Bar[], flipped: boolean): Bar[] {
  return flipped ? [...bars] : [...bars].reverse();
}

function mergeCharts(builtins: SongChart[], savedCharts: SongChart[]): SongChart[] {
  const byId = new Map(savedCharts.map((chart) => [chart.id, chart]));
  const used = new Set<string>();
  const list = builtins.map((chart) => {
    const edited = byId.get(chart.id);
    if (!edited) return chart;
    used.add(chart.id);
    return { ...edited, lang: edited.lang ?? chart.lang };
  });
  for (const chart of savedCharts) {
    if (!used.has(chart.id)) list.push(chart);
  }
  return list;
}

export function XylophoneApp({ suggestedLang = "hu" }: { suggestedLang?: Lang }) {
  const [saved, setSaved] = useState<SavedTune[]>([]);
  const [charts, setCharts] = useState<SongChart[]>(() => builtinCharts(8));
  const [songId, setSongId] = useState(charts[0]!.id);
  const [reversed, setReversed] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [chartOnly, setChartOnly] = useState(false);
  const [syllablesOn, setSyllablesOn] = useState(true);
  const [foxToys, setFoxToys] = useState(true);
  const [bpm, setBpm] = useState(charts[0]!.bpm);
  const [phase, setPhase] = useState<Phase>("idle");
  const [beat, setBeat] = useState(0);
  const [held, setHeld] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [miss, setMiss] = useState("");
  const [looking, setLooking] = useState(false);
  const [lang, setLang] = useState<Lang>(suggestedLang);
  const [turn, setTurn] = useState<"off" | "tune" | "play" | "score">("off");
  const [tuneStep, setTuneStep] = useState(0);
  const [callout, setCallout] = useState<Verdict | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const text = copy[lang];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ id: string; title: string; bpm: number; lines: SheetLine[]; wide: SheetLine[]; span: Span } | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [songLang, setSongLang] = useState<"all" | TuneLang>("all");
  const [span, setSpan] = useState<Span>(8);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [voice, setVoice] = useState<Chime>("wood");
  const [keepClosed, setKeepClosed] = useState(false);
  const [hint, setHint] = useState(false);
  const [diskReady, setDiskReady] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [tipWallet, setTipWallet] = useState<(typeof TIP_WALLETS)[number]["id"]>("evm");
  const [payNote, setPayNote] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBody, setReportBody] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [fromTag, setFromTag] = useState("");
  const [reportHint, setReportHint] = useState(false);
  const [foxCue, setFoxCue] = useState<FoxCue>(null);
  const touchTapRef = useRef(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  const resolvedTheme = theme ?? (systemDark ? "dark" : "light");
  const [trackHeight, setTrackHeight] = useState(320);

  const { user, isPending } = useCurrentUserState();
  const savedRef = useRef(saved);
  const userIdRef = useRef<string | null>(null);
  const syncedRef = useRef<string | null>(null);
  savedRef.current = saved;
  userIdRef.current = user?.id ?? null;
  const chart = charts.find((item) => item.id === songId) ?? charts[0]!;
  const phaseRef = useRef<Phase>("idle");
  const bpmRef = useRef(bpm);
  const originRef = useRef(0);
  const chartRef = useRef(chart);
  const beatRef = useRef(0);
  const scheduledRef = useRef(new Set<number>());
  const addingRef = useRef(false);
  const lookingRef = useRef(false);
  const reversedRef = useRef(false);
  const chartOnlyRef = useRef(false);
  const turnRef = useRef(turn);
  const earRef = useRef<ToyEar | null>(null);
  const toyRef = useRef<number[] | null>(null);
  const learnedRef = useRef<number[]>([]);
  const takenRef = useRef(new Set<number>());
  const gradesRef = useRef<Grade[]>([]);
  const lastCallRef = useRef<{ verdict: Verdict; atMs: number } | null>(null);
  const onHitRef = useRef<(freq: number) => void>(() => {});
  const listenRef = useRef<() => void>(() => {});
  const playLaneRef = useRef<(lane: number, midi: number) => void>(() => {});
  const releaseLaneRef = useRef<(lane: number) => void>(() => {});
  const trackRef = useRef<HTMLDivElement>(null);
  const syllableLine = useRef<HTMLDivElement>(null);
  const syllableDot = useRef<HTMLSpanElement>(null);
  const syllableSpot = useRef<{ x: number; y: number; line: string; syllable: number } | null>(null);
  const syllableAnim = useRef<Animation | null>(null);
  const barsRef = useRef(barsForSpan(8));

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    chartRef.current = chart;
  }, [chart]);
  useEffect(() => {
    addingRef.current = adding;
  }, [adding]);
  reversedRef.current = reversed;
  turnRef.current = turn;
  barsRef.current = barsForSpan(span);

  useEffect(() => {
    const disk = loadDisk();
    const size: Span = disk.span === 15 ? 15 : 8;
    const compiled: SongChart[] = [];
    const parsed: SavedTune[] = [];
    for (const tune of disk.saved) {
      try {
        compileStored(tune, size);
        parsed.push(tune);
      } catch {
        /* drop a tune that no longer parses */
      }
    }
    const kept = adoptCore(parsed);
    if (kept.length !== disk.saved.length) {
      writeDisk({ ...disk, saved: kept });
    }
    for (const tune of kept) compiled.push(compileStored(tune, size));
    const built = builtinCharts(size);
    const merged = mergeCharts(built, compiled);
    setSaved(kept);
    setCharts(merged);
    const nextId = disk.lastId && merged.some((item) => item.id === disk.lastId) ? disk.lastId : built[0]!.id;
    const next = merged.find((item) => item.id === nextId) ?? built[0]!;
    setSongId(next.id);
    setBpm(next.bpm);
    setReversed(Boolean(disk.reversed));
    setMutedState(Boolean(disk.muted));
    setMuted(Boolean(disk.muted));
    setChartOnly(Boolean(disk.chartOnly));
    chartOnlyRef.current = Boolean(disk.chartOnly);
    if (disk.syllables === false) setSyllablesOn(false);
    if (disk.foxToys === false) setFoxToys(false);
    if (disk.lang) {
      setLang(disk.lang);
      document.cookie = `lo-lang=${disk.lang}; Max-Age=31536000; Path=/; SameSite=Lax`;
    }
    if (disk.theme) setTheme(disk.theme);
    if (size === 15) setSpan(15);
    if (disk.voice) {
      setVoice(disk.voice);
      setChime(disk.voice);
    }
    setKeepClosed(Boolean(disk.keepClosed));
    setDiskReady(true);
    toyRef.current = loadToy(span);
  }, []);

  useEffect(() => {
    const compiled: SongChart[] = [];
    for (const tune of saved) {
      try {
        compiled.push(compileStored(tune, span));
      } catch {
        /* drop a tune that no longer parses */
      }
    }
    setCharts(mergeCharts(builtinCharts(span), compiled));
  }, [saved, span]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setTrackHeight(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [adding, browsing]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        const audio = peekAudio();
        if (audio?.state === "suspended") void audio.resume();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (phaseRef.current !== "playing") return;
      const audio = peekAudio();
      if (!audio) return;
      const bpmNow = bpmRef.current;
      const beatNow = ((audio.currentTime - originRef.current) * bpmNow) / 60;
      beatRef.current = beatNow;
      const horizon = beatNow + (0.3 * bpmNow) / 60;
      const notes = chartRef.current.notes;
      for (let i = 0; i < notes.length; i += 1) {
        const note = notes[i]!;
        if (note.startBeat > horizon) break;
        if (scheduledRef.current.has(i)) continue;
        if (note.startBeat < beatNow - 0.08) {
          scheduledRef.current.add(i);
          continue;
        }
        if (!chartOnlyRef.current && turnRef.current !== "play") {
          scheduleBar(note.midi, originRef.current + (note.startBeat * 60) / bpmNow);
        }
        scheduledRef.current.add(i);
      }
      if (beatNow > Math.max(chartRef.current.endBeat, notes.at(-1)?.startBeat ?? 0) + 0.75) {
        if (turnRef.current === "play") {
          setTally(tallyGrades(notes.length, gradesRef.current));
          turnRef.current = "score";
          setTurn("score");
          setCallout(null);
          earRef.current?.stop();
          earRef.current = null;
        }
        phaseRef.current = "idle";
        beatRef.current = 0;
        setPhase("idle");
        setBeat(0);
        setFoxCue({ kind: "done", at: performance.now() });
        return;
      }
      setBeat(beatNow);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = copy[lang].brand;
  }, [lang]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setSystemDark(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    const color = resolvedTheme === "dark" ? "#1b1714" : "#f3efe6";
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
  }, [theme, resolvedTheme]);

  useEffect(() => {
    // Offline: our own small service worker (public/sw.js). Not in dev, where it would cache the dev server.
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!reportHint) return;
    const timer = window.setTimeout(() => setReportHint(false), 3500);
    return () => window.clearTimeout(timer);
  }, [reportHint]);

  useEffect(() => {
    if (!callout) return;
    const timer = window.setTimeout(() => setCallout(null), 700);
    return () => window.clearTimeout(timer);
  }, [callout]);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from") ?? "";
    if (!/^[a-z0-9-]{1,24}$/i.test(from)) return;
    setFromTag(from);
    // Count the visit once per tab session, so a refresh is not a second visit.
    const seenKey = `little-octave.from.${from.toLowerCase()}`;
    try {
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
    } catch {
      // Private mode: still count it once for this load.
    }
    void countPartnerVisit({ data: { tag: from } }).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "idle" || turn !== "off") {
      setOptionsOpen(false);
      setSupportOpen(false);
      setCryptoOpen(false);
    }
  }, [phase, turn]);

  const phrase = phraseAt(chart.notes, phase === "idle" ? 0 : beat);
  const sounding = noteAt(chart.notes, phase === "idle" ? 0 : beat);
  const lineNotes = sounding ? chart.notes.filter((note) => note.line === sounding.line) : [];
  const noteIndex = sounding ? Math.max(0, lineNotes.indexOf(sounding)) : 0;
  const followed = followSyllables(
    sounding?.phrase ?? "",
    lineNotes.map((note) => note.beats),
  );
  const syllableIndex = followed.at[noteIndex] ?? 0;

  useEffect(() => {
    const box = syllableLine.current;
    if (!box || !syllablesOn) return;
    const place = (hop: boolean) => {
      const dot = syllableDot.current;
      const el = box.querySelector<HTMLElement>(`[data-syllable="${syllableIndex}"]`);
      if (!dot || !el) return;
      const boxRect = box.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const x = rect.left - boxRect.left + box.scrollLeft + rect.width / 2 - 3;
      const y = rect.top - boxRect.top - 8;
      const line = `${chart.id}:${sounding?.line ?? 0}`;
      const previous = syllableSpot.current;
      const sameLine = previous?.line === line;
      const newLine = !sameLine || !previous;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let fromX = x;
      let fromY = y;
      let travel = false;
      if (hop && !newLine && previous.syllable !== syllableIndex && !reduced) {
        const live = dot.getBoundingClientRect();
        fromX = live.left - boxRect.left + box.scrollLeft;
        fromY = live.top - boxRect.top;
        travel = Math.abs(x - fromX) >= 1.5;
      }
      dot.style.left = `${travel ? fromX : x}px`;
      dot.style.top = `${travel ? fromY : hop && !reduced ? y - 8 : y}px`;
      syllableAnim.current?.cancel();
      syllableSpot.current = { x, y, line, syllable: syllableIndex };
      if (!hop || reduced) {
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        return;
      }
      const midX = (fromX + x) / 2;
      const arc = Math.min(14, 6 + Math.abs(x - fromX) * 0.12);
      const frames: Keyframe[] = travel
        ? [
            { left: `${fromX}px`, top: `${fromY}px` },
            { left: `${midX}px`, top: `${Math.min(fromY, y) - arc}px`, offset: 0.42 },
            { left: `${x}px`, top: `${y + 3}px`, offset: 0.74 },
            { left: `${x}px`, top: `${y - 2}px`, offset: 0.88 },
            { left: `${x}px`, top: `${y}px` },
          ]
        : [
            { left: `${x}px`, top: `${y - 8}px` },
            { left: `${x}px`, top: `${y + 3}px`, offset: 0.55 },
            { left: `${x}px`, top: `${y - 2}px`, offset: 0.78 },
            { left: `${x}px`, top: `${y}px` },
          ];
      const flight = dot.animate(frames, { duration: travel ? 260 : 200, easing: "linear", fill: "forwards" });
      flight.addEventListener("finish", () => {
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
      });
      syllableAnim.current = flight;
    };
    place(true);
    let skip = true;
    const observer = new ResizeObserver(() => {
      if (skip) {
        skip = false;
        return;
      }
      place(false);
    });
    observer.observe(box);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = box.querySelector<HTMLElement>(`[data-syllable="${syllableIndex}"]`);
    if (el) {
      const visibleLeft = box.scrollLeft;
      const visibleRight = visibleLeft + box.clientWidth;
      if (el.offsetLeft < visibleLeft + 8 || el.offsetLeft + el.clientWidth > visibleRight - 8) {
        const left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
        box.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
      }
    }
    return () => {
      observer.disconnect();
      const dot = syllableDot.current;
      const anim = syllableAnim.current;
      if (dot && anim) {
        const live = dot.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        dot.style.left = `${live.left - boxRect.left + box.scrollLeft}px`;
        dot.style.top = `${live.top - boxRect.top}px`;
        anim.cancel();
      }
    };
  }, [syllableIndex, noteIndex, chart.id, sounding?.line, syllablesOn, followed.parts.length]);

  function persist(next: { saved?: SavedTune[]; lastId?: string; reversed?: boolean; muted?: boolean; chartOnly?: boolean; lang?: Lang; theme?: "light" | "dark" | null; span?: Span; voice?: Chime; keepClosed?: boolean; syllables?: boolean; foxToys?: boolean }) {
    const chosen = next.theme === null ? undefined : (next.theme ?? theme ?? undefined);
    return writeDisk({
      saved: next.saved ?? saved,
      lastId: next.lastId ?? songId,
      reversed: next.reversed ?? reversed,
      muted: next.muted ?? muted,
      chartOnly: next.chartOnly ?? chartOnly,
      lang: next.lang ?? lang,
      theme: chosen,
      span: next.span ?? span,
      voice: next.voice ?? voice,
      keepClosed: next.keepClosed ?? keepClosed,
      syllables: next.syllables ?? syllablesOn,
      foxToys: next.foxToys ?? foxToys,
    });
  }

  const accountId = user?.id ?? "";
  useEffect(() => {
    if (!diskReady || !accountId) return;
    if (syncedRef.current === accountId) return;
    let cancel = false;
    void (async () => {
      try {
        const remote = await listMyTunes();
        if (cancel) return;
        for (const tune of remote) {
          if (CORE_STAMPS[tune.id] && tune.coreStamp !== CORE_STAMPS[tune.id]) {
            await removeMyTune({ data: { id: tune.id } });
          }
        }
        const { merged, upload } = mergeTunes(savedRef.current, remote);
        for (const tune of upload) await saveMyTune({ data: tune });
        if (cancel) return;
        syncedRef.current = accountId;
        setSaved(merged);
        persist({ saved: merged });
        setHint(false);
      } catch {
        /* stay on the phone copy; try again next time they sign in */
      }
    })();
    return () => {
      cancel = true;
    };
    // persist is the disk writer from this render; accountId is the signed-in person.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diskReady, accountId]);

  function stopEar() {
    earRef.current?.stop();
    earRef.current = null;
  }

  function halt() {
    stopEar();
    turnRef.current = "off";
    setTurn("off");
    setCallout(null);
    silenceAll();
    scheduledRef.current = new Set();
    phaseRef.current = "idle";
    beatRef.current = 0;
    setPhase("idle");
    setBeat(0);
  }

  function pause() {
    const beatNow = beatRef.current;
    cancelUpcoming();
    for (const index of [...scheduledRef.current]) {
      const note = chartRef.current.notes[index];
      if (note && note.startBeat > beatNow - 0.04) scheduledRef.current.delete(index);
    }
    phaseRef.current = "paused";
    setPhase("paused");
    setBeat(beatNow);
  }

  function listen() {
    if (turnRef.current !== "off") {
      stopEar();
      turnRef.current = "off";
      setTurn("off");
      setTally(null);
      setCallout(null);
      phaseRef.current = "idle";
    }
    if (phaseRef.current === "playing") {
      pause();
      return;
    }
    setBrowsing(false);
    const audio = unlockAudio();
    const resuming = phaseRef.current === "paused";
    const from = resuming ? beatRef.current : -4;
    if (!resuming) {
      silenceAll();
      scheduledRef.current = new Set();
    }
    const now = audio.currentTime + 0.05;
    originRef.current = now - (from * 60) / bpmRef.current;
    if (from < 0 && !chartOnlyRef.current) {
      for (const clickBeat of [-4, -3, -2, -1]) {
        scheduleClick(originRef.current + (clickBeat * 60) / bpmRef.current);
      }
    }
    phaseRef.current = "playing";
    setPhase("playing");
  }

  function startPlay() {
    takenRef.current = new Set();
    gradesRef.current = [];
    lastCallRef.current = null;
    setCallout(null);
    setTally(null);
    setBrowsing(false);
    turnRef.current = "play";
    setTurn("play");
    const audio = unlockAudio();
    silenceAll();
    scheduledRef.current = new Set();
    const from = -4;
    originRef.current = audio.currentTime + 0.06 - (from * 60) / bpmRef.current;
    beatRef.current = from;
    phaseRef.current = "playing";
    setPhase("playing");
    setBeat(from);
  }

  async function openEar() {
    if (earRef.current) return;
    earRef.current = await ToyEar.start((freq) => onHitRef.current(freq));
  }

  async function yourTurn() {
    if (turnRef.current === "tune" || turnRef.current === "play") {
      halt();
      return;
    }
    halt();
    setBrowsing(false);
    setTally(null);
    const held = toyRef.current;
    const profile = held && held.length === span ? held : loadToy(span);
    try {
      if (!profile) {
        learnedRef.current = [];
        setTuneStep(0);
        turnRef.current = "tune";
        setTurn("tune");
        await openEar();
        return;
      }
      toyRef.current = profile;
      await openEar();
      startPlay();
    } catch {
      halt();
      setMiss(copy[lang].micOff);
    }
  }

  async function retune() {
    clearToy(span);
    toyRef.current = null;
    halt();
    setBrowsing(false);
    learnedRef.current = [];
    setTuneStep(0);
    turnRef.current = "tune";
    setTurn("tune");
    try {
      await openEar();
    } catch {
      halt();
      setMiss(copy[lang].micOff);
    }
  }

  onHitRef.current = (freq) => {
    if (turnRef.current === "tune") {
      const learned = learnedRef.current;
      if (learned.some((known) => Math.abs(centsBetween(freq, known)) < 50)) return;
      learned.push(freq);
      setTuneStep(learned.length);
      if (learned.length < span) return;
      const next = learned.slice(0, span);
      toyRef.current = next;
      saveToy(next);
      startPlay();
      return;
    }
    if (turnRef.current !== "play" || beatRef.current < 0) return;
    const profile = toyRef.current;
    if (!profile) return;
    const heard = nearestBar(freq, profile);
    if (heard === null) return;
    // Fifteen learned bars are already in lane order; eight sit after the lighter octave.
    const lane = profile.length === 15 ? heard : baseLane(heard, span);
    const grade = gradeHit(chartRef.current.notes, { lane, beat: beatRef.current }, bpmRef.current, takenRef.current);
    if (!grade) return;
    gradesRef.current.push(grade);
    const now = performance.now();
    setFoxCue({ kind: grade.verdict === "next" ? "oops" : "good", at: now });
    if (!shouldCall(grade.verdict, lastCallRef.current, now)) return;
    lastCallRef.current = { verdict: grade.verdict, atMs: now };
    setCallout(grade.verdict);
  };

  function choose(next: SongChart) {
    halt();
    setBrowsing(false);
    setQuery("");
    setMiss("");
    setSongId(next.id);
    setBpm(next.bpm);
    bpmRef.current = next.bpm;
    persist({ lastId: next.id });
  }

  function onTempo(next: number) {
    const audio = peekAudio();
    if (audio && phaseRef.current === "playing") {
      const beatNow = ((audio.currentTime - originRef.current) * bpmRef.current) / 60;
      cancelUpcoming();
      for (const index of [...scheduledRef.current]) {
        const note = chartRef.current.notes[index];
        if (note && note.startBeat > beatNow - 0.05) scheduledRef.current.delete(index);
      }
      originRef.current = audio.currentTime - (beatNow * 60) / next;
    }
    bpmRef.current = next;
    setBpm(next);
  }

  function playLane(lane: number, midi: number) {
    unlockAudio();
    playBarNow(midi);
    setHeld((current) => (current.includes(lane) ? current : [...current, lane]));
  }

  function releaseLane(lane: number) {
    setHeld((current) => current.filter((item) => item !== lane));
  }

  listenRef.current = listen;
  playLaneRef.current = playLane;
  releaseLaneRef.current = releaseLane;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || addingRef.current) return;
      if (event.repeat) return;
      if (event.key === " ") {
        event.preventDefault();
        listenRef.current();
        return;
      }
      const index = keyColumn(event.key);
      if (index < 0) return;
      event.preventDefault();
      const columns = shownBars(barsRef.current, reversedRef.current);
      const bar = columns[index];
      if (!bar) return;
      playLaneRef.current(laneIndex(bar, barsRef.current), bar.midi);
    }
    function onKeyUp(event: KeyboardEvent) {
      const index = keyColumn(event.key);
      if (index < 0) return;
      const columns = shownBars(barsRef.current, reversedRef.current);
      const bar = columns[index];
      if (!bar) return;
      releaseLaneRef.current(laneIndex(bar, barsRef.current));
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function saveTune(title: string, lines: SheetLine[], wide: SheetLine[], speed: number, credit = "") {
    const name = title.trim();
    if (!name) return text.nameTheTune;
    if (name.length > 48) return text.nameLong;
    const tempo = Math.min(160, Math.max(60, Math.round(speed) || 100));
    const from = credit.trim().slice(0, 240);
    const id = draft?.id ?? `saved-${crypto.randomUUID()}`;
    const eight = lines.map((line) => ({ lyric: line.lyric.trim(), abc: line.abc.trim() })).filter((line) => line.abc);
    let fifteen = wide.map((line) => ({ lyric: line.lyric.trim(), abc: line.abc.trim() })).filter((line) => line.abc);
    if (eight.length === 0 && fifteen.length === 0) return text.noNotes;
    const written8 = eight.length > 0 ? eight : fifteen;
    if (fifteen.length === 0) fifteen = written8;
    try {
      compileWritten(id, name, tempo, written8, 8);
      compileWritten(id, name, tempo, fifteen, 15);
      const tune: SavedTune = {
        id,
        title: name,
        bpm: tempo,
        abc: written8.map((line) => line.abc).join("\n"),
        lines: written8,
        wide: fifteen,
        updatedAt: Date.now(),
        coreStamp: CORE_STAMPS[id],
        from,
      };
      const prior = saved.find((item) => item.id === id);
      const before8 = playedLines(id, prior, 8).filter((line) => line.abc.trim());
      const before15 = playedLines(id, prior, 15).filter((line) => line.abc.trim());
      const beforeTitle = prior?.title ?? builtinCharts(8).find((item) => item.id === id)?.title ?? "";
      const beforeFrom = typeof prior?.from === "string" ? prior.from : (REPERTOIRE.find((song) => song.id === id)?.from ?? "");
      const fresh = beforeTitle !== name || beforeFrom !== from || sheetChanged(before8, written8) || sheetChanged(before15, fifteen);
      const nextSaved = saved.some((item) => item.id === id) ? saved.map((item) => (item.id === id ? tune : item)) : [...saved, tune];
      const problem = persist({ saved: nextSaved, lastId: id });
      if (problem) return localizeError(lang, problem);
      const compiled = compileStored(tune, span);
      setSaved(nextSaved);
      setCharts(mergeCharts(builtinCharts(span), [...charts.filter((item) => item.source === "saved" && item.id !== id), compiled]));
      halt();
      setSongId(id);
      setBpm(tempo);
      bpmRef.current = tempo;
      setDraft(null);
      setAdding(false);
      if (fresh) {
        void captureTune({ data: tune }).catch(() => {});
        if (userIdRef.current) {
          setHint(false);
          void saveMyTune({ data: tune }).catch(() => {});
        } else if (!keepClosed) {
          setHint(true);
        }
      }
      return null;
    } catch (error) {
      if (error instanceof ParseError) return localizeError(lang, error.message);
      return text.unreadable;
    }
  }

  async function lookupAndSave(raw: string) {
    const name = raw.trim();
    if (name.length < 2 || lookingRef.current) return;
    const exact = findByTitle(charts, name);
    if (exact) {
      choose(exact);
      setQuery("");
      setMiss("");
      return;
    }
    lookingRef.current = true;
    setLooking(true);
    setMiss(text.looking);
    try {
      const result = await lookupSheet({ data: { title: name, lang } });
      if (!result.ok) {
        setMiss(result.error);
        return;
      }
      const problem = saveTune(result.title, result.lines, result.wide ?? result.lines, result.bpm);
      setMiss(problem ?? text.folded);
      if (!problem) setQuery("");
    } catch {
      setMiss(text.lookupFail);
    } finally {
      lookingRef.current = false;
      setLooking(false);
    }
  }

  function removeTune(id: string) {
    const nextSaved = saved.filter((tune) => tune.id !== id);
    const compiled: SongChart[] = [];
    for (const tune of nextSaved) {
      try {
        compiled.push(compileStored(tune, span));
      } catch {
        /* drop a tune that no longer parses */
      }
    }
    const built = builtinCharts(span);
    const nextCharts = mergeCharts(built, compiled);
    const nextId = nextCharts.some((item) => item.id === songId) ? songId : built[0]!.id;
    setSaved(nextSaved);
    setCharts(nextCharts);
    persist({ saved: nextSaved, lastId: nextId });
    if (userIdRef.current) void removeMyTune({ data: { id } }).catch(() => {});
    if (songId !== nextId || id === songId) {
      halt();
      const next = nextCharts.find((item) => item.id === nextId) ?? built[0]!;
      setSongId(next.id);
      setBpm(next.bpm);
      bpmRef.current = next.bpm;
    }
  }

  function openEdit(chart: SongChart) {
    const stored = saved.find((tune) => tune.id === chart.id);
    setDraft({
      id: chart.id,
      title: stored?.title ?? chart.title,
      bpm: stored?.bpm ?? chart.bpm,
      lines: playedLines(chart.id, stored, 8),
      wide: playedLines(chart.id, stored, 15),
      span,
    });
    setAdding(true);
  }

  async function sendReport() {
    const body = reportBody.trim();
    if (body.length < 3 || reportBusy) return;
    setReportBusy(true);
    setReportNote("");
    try {
      await saveReport({ data: { body, songId: chart.id, songTitle: chart.title, lang, span } });
      setReportBody("");
      setReportNote(text.reportSent);
    } catch {
      setReportNote(text.reportFail);
    } finally {
      setReportBusy(false);
    }
  }

  function creditOf(id: string | undefined): string {
    if (!id) return "";
    const stored = saved.find((tune) => tune.id === id);
    if (stored && typeof stored.from === "string") return stored.from;
    return REPERTOIRE.find((song) => song.id === id)?.from ?? "";
  }

  if (adding) {
    return (
      <AddTune
        key={draft?.id ?? "new"}
        initial={draft}
        span={span}
        source={creditOf(draft?.id)}
        saved={saved}
        onBack={() => {
          setAdding(false);
          setDraft(null);
        }}
        onSave={saveTune}
        onRemove={removeTune}
        onEdit={(tune) => {
          setDraft({
            id: tune.id,
            title: tune.title,
            bpm: tune.bpm,
            lines: playedLines(tune.id, tune, 8),
            wide: playedLines(tune.id, tune, 15),
            span,
          });
        }}
        text={text}
      />
    );
  }

  const bars = barsForSpan(span);
  const columns = shownBars(bars, reversed);
  const drawBeat = phase === "idle" ? -0.35 : beat;
  const px = trackHeight / 4.6;
  const visible = chart.notes.filter(
    (note) => note.startBeat < drawBeat + 5.2 && note.startBeat + note.beats > drawBeat - 0.4,
  );
  const count = phase === "playing" && beat < 0 ? Math.min(4, Math.ceil(-beat)) : null;
  const filtered = charts
    .filter((item) => {
      const titleOk = query.trim() ? normalize(item.title).includes(normalize(query)) : true;
      const langOk = !browsing || songLang === "all" || !item.lang || item.lang === songLang;
      return titleOk && langOk;
    })
    .sort((a, b) => compareSongs(a, b, lang));
  const onStage = phase !== "idle" || turn !== "off";

  return (
    <div className="mx-auto flex h-dvh max-w-md touch-manipulation flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/fox-head.png" alt="" width={176} height={196} className="size-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">
              {chart.bent ? <span title={text.bentHint}>{text.bent.replace("{n}", String(chart.bent))}</span> : text.brand}
            </p>
            <h1 className="truncate font-display text-xl leading-tight font-medium">{chart.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="group relative">
            <button
              type="button"
              aria-label={text.report}
              onPointerDown={(event) => {
                touchTapRef.current = event.pointerType === "touch";
              }}
              onClick={() => {
                // A finger never hovers: the first touch tap shows the hint, a second tap opens the sheet.
                if (touchTapRef.current && !reportHint) {
                  setReportHint(true);
                  return;
                }
                setReportHint(false);
                setReportOpen(true);
                setReportNote("");
              }}
              className="flex size-9 items-center justify-center rounded-full bg-track text-ink"
            >
              <Bug className="size-4" aria-hidden />
            </button>
            <span
              role="tooltip"
              className={`pointer-events-none absolute top-full right-0 z-30 mt-2 hidden w-40 rounded-xl bg-ink px-3 py-2 text-left text-xs font-medium leading-snug text-pretty text-wall ${reportOpen ? "" : reportHint ? "block" : "group-hover:block"}`}
            >
              {text.report}
            </span>
          </div>
          <button
            type="button"
            aria-pressed={resolvedTheme === "dark"}
            aria-label={resolvedTheme === "dark" ? text.dark : text.light}
            onClick={() => {
              const next = resolvedTheme === "dark" ? "light" : "dark";
              setTheme(next);
              persist({ theme: next });
            }}
            className="flex size-9 items-center justify-center rounded-full bg-track text-ink"
          >
            {resolvedTheme === "dark" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
          </button>
          <label className="sr-only" htmlFor="ui-lang">
            {text.language}
          </label>
          <select
            id="ui-lang"
            value={lang}
            aria-label={text.language}
            onChange={(event) => {
              const next = event.target.value;
              if (!isLang(next)) return;
              setLang(next);
              document.cookie = `lo-lang=${next}; Max-Age=31536000; Path=/; SameSite=Lax`;
              persist({ lang: next });
            }}
            className="h-9 max-w-28 rounded-full bg-track px-2 text-sm font-medium text-ink"
          >
            {UI_LANGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {onStage ? null : (
      <div className={`mt-2 flex min-h-0 flex-col overflow-hidden ${browsing ? "flex-1" : "max-h-36 flex-1"}`}>
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {text.songs}
            <span className="tabular-nums"> · {filtered.length}</span>
          </p>
          <button
            type="button"
            aria-expanded={browsing}
            onClick={() => {
              setBrowsing((open) => !open);
              setQuery("");
              setMiss("");
            }}
            className="h-9 rounded-full bg-track px-3 text-sm font-medium"
          >
            {browsing ? text.done : text.browse}
          </button>
        </div>
        {browsing ? (
          <div className="mt-2 shrink-0">
            <div className="flex flex-wrap gap-1" role="group" aria-label={text.songLanguage}>
              {(
                [
                  ["all", text.langAll],
                  ["hu", text.langHu],
                  ["en", text.langEn],
                  ["fr", text.langFr],
                  ["de", text.langDe],
                  ["es", text.langEs],
                  ["da", text.langDa],
                  ["sco", text.langSco],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={songLang === value}
                  onClick={() => setSongLang(value)}
                  className={`h-8 rounded-full px-2.5 text-xs font-medium ${songLang === value ? "bg-ink text-wall" : "bg-track text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="find-tune">
              {text.find}
            </label>
            <input
              id="find-tune"
              value={query}
              autoComplete="off"
              placeholder={text.find}
              onChange={(event) => {
                setQuery(event.target.value);
                setMiss("");
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (filtered.length === 1) {
                  choose(filtered[0]!);
                  return;
                }
                if (filtered.length === 0) void lookupAndSave(query);
              }}
              className="mt-2 h-10 w-full rounded-full bg-track px-4 text-base text-ink outline-none placeholder:text-muted"
            />
            {query.trim().length >= 2 ? (
              <button
                type="button"
                disabled={looking}
                onClick={() => void lookupAndSave(query)}
                className="mt-2 h-11 rounded-full bg-track px-4 text-sm font-medium disabled:opacity-60"
              >
                {looking ? text.looking : text.lookup}
              </button>
            ) : null}
            {miss ? (
              <p className="mt-2 text-sm text-pretty text-ink" role="status">
                {miss}
              </p>
            ) : null}
          </div>
        ) : null}
        <ul className="song-list mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center gap-1">
              <button
                id={`song-${item.id}`}
                type="button"
                onClick={() => choose(item)}
                className={`flex h-11 min-w-0 flex-1 items-center rounded-xl px-3 text-left text-sm font-medium ${item.id === chart.id ? "bg-ink text-wall" : "text-ink"}`}
                aria-current={item.id === chart.id ? "true" : undefined}
              >
                <span className="truncate">{item.title}</span>
              </button>
              <button
                type="button"
                aria-label={`${text.edit}: ${item.title}`}
                onClick={() => openEdit(item)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
      )}

      {browsing && !onStage ? null : (
        <div className={`flex shrink-0 items-end gap-1 transition-[height,margin-top] duration-[400ms] ease-out motion-reduce:transition-none ${onStage && syllablesOn ? "mt-1 h-[4.125rem]" : "mt-1 h-11"}`}>
          <div ref={syllableLine} className="syllable-line h-full min-w-0 flex-1 overflow-x-auto">
            {turn === "tune" ? (
              <p className="flex h-full items-center justify-center text-center font-display text-base leading-none">{`${text.strikeThis} ${tuneStep + 1} / ${span}`}</p>
            ) : syllablesOn && followed.parts.length > 0 ? (
              <div className="relative flex h-full w-max min-w-full items-end justify-center px-1 pb-0.5">
                <p className="whitespace-nowrap text-center font-display text-base leading-none text-ink">
                  {followed.parts.map((part, index) => (
                    <span key={`${sounding?.line ?? 0}-${index}`} data-syllable={index}>
                      {part.breakBefore ? " " : ""}
                      {part.text}
                    </span>
                  ))}
                </p>
                <span ref={syllableDot} className="pointer-events-none absolute size-1.5 rounded-full bg-coral" />
              </div>
            ) : (
              <p className="flex h-full items-center justify-center truncate text-center font-display text-base leading-none">{phrase || text.follow}</p>
            )}
          </div>
          {turn === "tune" ? null : (
            <div className="group relative mb-0.5 shrink-0">
              <button
                type="button"
                aria-pressed={syllablesOn}
                aria-label={syllablesOn ? text.syllablesOff : text.syllablesOn}
                onClick={() => {
                  const next = !syllablesOn;
                  setSyllablesOn(next);
                  persist({ syllables: next });
                }}
                className={`flex size-8 items-center justify-center rounded-full ${syllablesOn ? "bg-coral" : "bg-track"}`}
              >
                <span className={`size-1.5 rounded-full ${syllablesOn ? "bg-ink" : "bg-muted"}`} aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-48 rounded-xl bg-ink px-3 py-2 text-left text-xs font-medium leading-snug text-pretty text-wall group-hover:block group-focus-within:block"
              >
                {syllablesOn ? text.syllableHintOn : text.syllableHintOff}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={browsing && !onStage ? "mt-2 shrink-0" : "flex min-h-0 flex-1 flex-col overflow-hidden"}>
        {browsing && !onStage ? null : (
        <div ref={trackRef} className="relative min-h-12 flex-1 overflow-hidden rounded-t-2xl bg-track">
          <img
            src="/fox-mallet.png"
            alt=""
            width={280}
            height={332}
            className="pointer-events-none absolute top-1 right-1 h-16 w-auto select-none sm:h-20"
          />
          <div className="absolute inset-0 grid gap-1 px-1.5" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((bar) => {
              const lane = laneIndex(bar, bars);
              return (
                <div key={bar.id} className="relative">
                  {visible
                    .filter((note) => note.lane === lane)
                    .map((note) => {
                      const noteH = Math.max(8, note.beats * px * 0.86);
                      const top = trackHeight - (note.startBeat - drawBeat) * px - noteH;
                      return (
                        <div
                          key={`${note.startBeat}-${note.lane}`}
                          className={`bar-face absolute inset-x-0 flex items-center justify-center rounded-md font-display text-lg ${bar.swatch} ${bar.ink}`}
                          style={{ top, height: noteH }}
                        >
                          {noteH > 26 ? bar.letter : ""}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
          {count !== null ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-display text-6xl font-medium tabular-nums">{count}</span>
            </div>
          ) : null}
          {callout && count === null ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded-full bg-wall/90 px-4 py-1 font-display text-3xl text-ink">
                {callout === "spot" ? text.spot : callout === "early" ? text.early : callout === "late" ? text.late : text.nextDoor}
              </span>
            </div>
          ) : null}
          {turn === "score" && tally ? (
            <div className="absolute inset-0 z-10 flex flex-col justify-center bg-wall/95 px-5 text-ink">
              <p className="font-display text-2xl">{text.scoreTitle}</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex justify-between gap-4"><span>{text.spot}</span><span className="tabular-nums">{tally.spot}</span></li>
                <li className="flex justify-between gap-4"><span>{text.early}</span><span className="tabular-nums">{tally.early}</span></li>
                <li className="flex justify-between gap-4"><span>{text.late}</span><span className="tabular-nums">{tally.late}</span></li>
                <li className="flex justify-between gap-4"><span>{text.nextDoor}</span><span className="tabular-nums">{tally.next}</span></li>
                <li className="flex justify-between gap-4"><span>{text.missed}</span><span className="tabular-nums">{tally.missed}</span></li>
              </ul>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => void yourTurn()} className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-wall">
                  {text.again}
                </button>
                <button type="button" onClick={() => void retune()} className="h-10 rounded-full bg-track px-4 text-sm font-medium">
                  {text.retune}
                </button>
              </div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-coral" />
        </div>
        )}
        <div className={`grid shrink-0 gap-1 bg-coral px-1.5 pt-1.5 pb-2 ${browsing && !onStage ? "rounded-2xl" : "rounded-b-2xl"}`} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((bar, index) => {
            const lane = laneIndex(bar, bars);
            const hot =
              held.includes(lane) ||
              (phase === "playing" && chart.notes.some((note) => note.lane === lane && Math.abs(note.startBeat - beat) < 0.12));
            const coaching = turn === "tune" && lane === tuneStep;
            return (
              <button
                key={bar.id}
                type="button"
                aria-label={bar.name}
                className={`bar-key bar-face flex shrink-0 flex-col items-center justify-center rounded-lg font-display leading-none active:scale-95 ${span === 15 ? "h-12 text-base" : "h-14 text-2xl sm:h-16"} ${bar.swatch} ${bar.ink} ${hot ? "brightness-110" : ""} ${coaching ? "is-next" : ""}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  playLane(lane, bar.midi);
                }}
                onPointerUp={() => releaseLane(lane)}
                onPointerCancel={() => releaseLane(lane)}
                onPointerLeave={() => releaseLane(lane)}
              >
                {bar.letter}
                <span className="mt-0.5 hidden font-sans text-xs font-medium opacity-70 sm:block">{keyLabel(index)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 shrink-0 space-y-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={listen}
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-medium text-wall"
          >
            {phase === "playing" && turn === "off" ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
            {phase === "playing" && turn === "off" ? text.pause : phase === "paused" && turn === "off" ? text.resume : text.listen}
          </button>
          <button
            type="button"
            onClick={() => void yourTurn()}
            className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full font-medium ${turn === "tune" || turn === "play" ? "bg-coral text-ink" : "bg-ink text-wall"}`}
          >
            {turn === "tune" || turn === "play" ? text.stop : text.yourTurn}
          </button>
          <button
            type="button"
            aria-pressed={chartOnly}
            aria-label={text.chartOnly}
            onClick={() => {
              const next = !chartOnly;
              setChartOnly(next);
              chartOnlyRef.current = next;
              if (next) cancelUpcoming();
              persist({ chartOnly: next });
            }}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${chartOnly ? "bg-coral text-ink" : "bg-track text-ink"}`}
          >
            <Eye className="size-5" aria-hidden />
          </button>
          {phase !== "idle" ? (
            <button
              type="button"
              onClick={halt}
              aria-label={text.stop}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/20"
            >
              <Square className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <label className="flex h-8 items-center gap-3 text-sm text-muted">
          <span className="w-10 tabular-nums text-ink">{bpm}</span>
          <input
            type="range"
            min={60}
            max={160}
            value={bpm}
            aria-label={text.tempo}
            onChange={(event) => onTempo(Number(event.target.value))}
            className="h-8 min-w-0 flex-1 accent-coral"
          />
        </label>
        <FoxScene id={chart.id} title={chart.title} playing={phase === "playing"} paused={phase === "paused"} cue={foxCue} bpm={bpm} toys={foxToys} />
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-[400ms] ease-out motion-reduce:transition-none ${optionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className={optionsOpen ? "overflow-hidden" : "pointer-events-none overflow-hidden"}>
          <div className="max-h-[min(22rem,46dvh)] overflow-y-auto rounded-2xl bg-track px-3 py-3">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-track pb-1">
              <p className="text-sm font-medium">{text.options}</p>
              <button type="button" onClick={() => { setOptionsOpen(false); setSupportOpen(false); setCryptoOpen(false); setPayNote(""); }} className="h-9 rounded-full bg-wall px-3 text-sm font-medium">
                {text.done}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">{text.size}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {([8, 15] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={span === choice}
                  onClick={() => {
                    setSpan(choice);
                    persist({ span: choice });
                  }}
                  className={`h-11 rounded-full text-sm font-medium ${span === choice ? "bg-ink text-wall" : "bg-wall text-ink"}`}
                >
                  {choice === 8 ? text.size8 : text.size15}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">{text.chime}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {([
                ["wood", text.chimeWood],
                ["bell", text.chimeBell],
                ["glass", text.chimeGlass],
                ["metal", text.chimeMetal],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={voice === id}
                  onClick={() => {
                    setVoice(id);
                    setChime(id);
                    persist({ voice: id });
                    previewChime(id);
                  }}
                  className={`h-11 rounded-full text-sm font-medium ${voice === id ? "bg-ink text-wall" : "bg-wall text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">{text.foxToys}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {([
                [true, text.foxToysOn],
                [false, text.foxToysOff],
              ] as const).map(([on, label]) => (
                <button
                  key={String(on)}
                  type="button"
                  aria-pressed={foxToys === on}
                  onClick={() => {
                    setFoxToys(on);
                    persist({ foxToys: on });
                  }}
                  className={`h-11 rounded-full text-sm font-medium ${foxToys === on ? "bg-ink text-wall" : "bg-wall text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">{text.account}</p>
            <div className="mt-1 rounded-2xl bg-wall px-3 py-3">
              {!authEnabled ? (
                <p className="text-xs text-pretty text-muted">{text.accountOff}</p>
              ) : isPending ? (
                <div className="h-11 animate-pulse rounded-full bg-track" />
              ) : (
                <SignInGate
                  fallback={
                    <div className="space-y-2">
                      <p className="text-xs text-pretty text-muted">{text.accountHint}</p>
                      {GROK_PROVIDERS.map((provider) => (
                        <button
                          key={provider.providerId}
                          type="button"
                          onClick={() => void signIn(provider.providerId, { callbackURL: "/" }).catch(() => undefined)}
                          className="h-11 w-full rounded-full bg-ink text-sm font-medium text-wall"
                        >
                          {text.continueWith} {provider.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <UserButton />
                </SignInGate>
              )}
            </div>
            {fromTag || !TIP_JAR ? null : (
              <button
                type="button"
                aria-expanded={supportOpen}
                onClick={() => {
                  setSupportOpen((open) => !open);
                  setCryptoOpen(false);
                  setPayNote("");
                }}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-wall px-3 py-2 text-left"
              >
                <span className="relative size-10 shrink-0" aria-hidden>
                  <img src="/fox-head.png" alt="" width={40} height={40} className="size-10 object-contain" />
                  <Heart className="absolute -top-1 -right-1 size-3.5 fill-coral text-coral" />
                  <Heart className="absolute -bottom-0.5 -left-1 size-3 fill-coral text-coral" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{text.foxTreat}</span>
                  <span className="block text-xs text-pretty text-muted">{text.foxTreatHint}</span>
                </span>
              </button>
            )}
            {supportOpen && !fromTag && TIP_JAR ? (
              <div className="mt-2">
                <div className="grid grid-cols-3 gap-2">
                  {TIP_CARDS.map(([amount, href]) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setPayNote(text.payOpened);
                        window.open(href, "_blank", "noopener,noreferrer");
                      }}
                      className="h-11 rounded-full bg-ink text-sm font-medium text-wall"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-expanded={cryptoOpen}
                  onClick={() => {
                    setCryptoOpen((open) => !open);
                    setPayNote("");
                  }}
                  className="mt-2 h-11 w-full rounded-full bg-wall text-sm font-medium"
                >
                  {text.payCrypto}
                </button>
                {cryptoOpen ? (
                  <div className="mt-2 rounded-2xl bg-wall px-3 py-2">
                    <label className="block text-xs text-muted">
                      {text.payChain}
                      <select
                        value={tipWallet}
                        onChange={(event) => {
                          const next = TIP_WALLETS.find((item) => item.id === event.target.value);
                          if (next) setTipWallet(next.id);
                          setPayNote("");
                        }}
                        className="mt-1 h-11 w-full rounded-full bg-track px-3 text-sm text-ink"
                      >
                        {TIP_WALLETS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.id === "evm" ? text.payNetEvm : item.id === "sol" ? text.payNetSol : item.id === "btc" ? text.payNetBtc : text.payNetTap}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-pretty text-muted">
                      {tipWallet === "sol" ? text.payHintSol : tipWallet === "btc" ? text.payHintBtc : tipWallet === "tap" ? text.payHintTap : text.payChainHint}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-ink select-all">{TIP_WALLETS.find((item) => item.id === tipWallet)!.address}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const address = TIP_WALLETS.find((item) => item.id === tipWallet)!.address;
                        if (copyText(address)) {
                          setPayNote(text.payCopied);
                          return;
                        }
                        void navigator.clipboard?.writeText(address).then(
                          () => setPayNote(text.payCopied),
                          () => setPayNote(text.payCopyFail),
                        );
                      }}
                      className="mt-2 h-11 w-full rounded-full bg-ink text-sm font-medium text-wall"
                    >
                      {text.payCopy}
                    </button>
                  </div>
                ) : null}
                {payNote ? <p className="mt-2 text-sm text-pretty text-ink" role="status">{payNote}</p> : null}
              </div>
            ) : null}
          </div>
          </div>
        </div>
        <div className={`grid grid-cols-4 gap-2 transition-[height,opacity,margin] duration-[400ms] ease-out motion-reduce:transition-none ${optionsOpen ? "pointer-events-none mt-0 h-0 overflow-hidden opacity-0" : "mt-1 h-9 opacity-100"}`}>
          <button
            type="button"
            aria-pressed={reversed}
            onClick={() => {
              const next = !reversed;
              setReversed(next);
              persist({ reversed: next });
            }}
            className="flex h-9 min-w-0 items-center justify-center gap-1 rounded-full bg-track px-1 text-xs font-medium"
          >
            <ArrowLeftRight className="size-4 shrink-0" aria-hidden />
            {text.flip}
          </button>
          <button
            type="button"
            aria-pressed={muted}
            onClick={() => {
              const next = !muted;
              setMutedState(next);
              setMuted(next);
              persist({ muted: next });
            }}
            className="flex h-9 min-w-0 items-center justify-center gap-1 rounded-full bg-track px-1 text-xs font-medium"
          >
            {muted ? <VolumeX className="size-4 shrink-0" aria-hidden /> : <Volume2 className="size-4 shrink-0" aria-hidden />}
            {muted ? text.off : text.sound}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setAdding(true);
            }}
            className="flex h-9 min-w-0 items-center justify-center gap-1 rounded-full bg-track px-1 text-xs font-medium"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            {text.add}
          </button>
          <div className="relative">
            {hint && !keepClosed && !user && !isPending && !optionsOpen && phase === "idle" && turn === "off" ? (
              <div className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-2xl bg-ink px-3 py-2 text-sm text-pretty text-wall shadow-lg">
                <p>{text.keepBubble}</p>
                <button
                  type="button"
                  onClick={() => {
                    setHint(false);
                    setKeepClosed(true);
                    persist({ keepClosed: true });
                  }}
                  className="mt-2 h-8 rounded-full bg-wall px-3 text-xs font-medium text-ink"
                >
                  {text.keepClose}
                </button>
                <span className="absolute -bottom-1 right-6 size-2.5 rotate-45 bg-ink" aria-hidden />
              </div>
            ) : null}
            <button
              type="button"
              aria-expanded={optionsOpen}
              onClick={() => setOptionsOpen((open) => !open)}
              className="flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full bg-track px-1 text-xs font-medium"
            >
              <Settings className="size-4 shrink-0" aria-hidden />
              {text.options}
            </button>
          </div>
        </div>
        <p className="hidden text-center text-xs text-muted sm:block">{span === 15 ? text.keysWide : text.keys}</p>
      </div>
      {reportOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          onClick={() => setReportOpen(false)}
        >
          <form
            className="w-full max-w-md rounded-2xl bg-wall p-3 shadow-lg"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void sendReport();
            }}
          >
            <p className="text-sm font-medium">{text.reportTitle}</p>
            <textarea
              value={reportBody}
              autoFocus
              maxLength={800}
              placeholder={text.reportPlaceholder}
              aria-label={text.reportTitle}
              onChange={(event) => {
                setReportBody(event.target.value);
                setReportNote("");
              }}
              className="mt-2 h-28 w-full resize-none rounded-2xl bg-track px-3 py-2 text-base text-ink outline-none placeholder:text-muted"
            />
            {reportNote ? (
              <p className="mt-2 text-sm text-pretty text-ink" role="status">
                {reportNote}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="h-11 rounded-full bg-track text-sm font-medium">
                {text.back}
              </button>
              <button
                type="submit"
                disabled={reportBusy || reportBody.trim().length < 3}
                className="h-11 rounded-full bg-ink text-sm font-medium text-wall disabled:opacity-50"
              >
                {text.reportSend}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AddTune({
  initial,
  span,
  source,
  saved,
  onBack,
  onSave,
  onRemove,
  onEdit,
  text,
}: {
  initial: { id: string; title: string; bpm: number; lines: SheetLine[]; wide: SheetLine[]; span: Span } | null;
  span: Span;
  source: string;
  saved: SavedTune[];
  onBack: () => void;
  onSave: (title: string, lines: SheetLine[], wide: SheetLine[], bpm: number, credit: string) => string | null;
  onRemove: (id: string) => void;
  onEdit: (tune: SavedTune) => void;
  text: (typeof copy)["hu"];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [credit, setCredit] = useState(source);
  const [bpm, setBpm] = useState(initial?.bpm ?? 100);
  const [sheet, setSheet] = useState<Span>(initial?.span ?? span);
  const [lines, setLines] = useState<SheetLine[]>(initial?.lines ?? [{ lyric: "", abc: "" }]);
  const [wide, setWide] = useState<SheetLine[]>(initial?.wide ?? [{ lyric: "", abc: "" }]);
  const [error, setError] = useState("");
  const rows = sheet === 15 ? wide : lines;
  const setRows = sheet === 15 ? setWide : setLines;

  function editRow(index: number, patch: Partial<SheetLine>) {
    setRows((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addRest(index: number) {
    const input = document.getElementById(`tune-notes-${index}`) as HTMLInputElement | null;
    const value = rows[index]?.abc ?? "";
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lead = before.length > 0 && !/\s$/.test(before) ? " " : "";
    const tail = after.length > 0 && !/^\s/.test(after) ? " " : "";
    const next = `${before}${lead}z${tail}${after}`;
    const caret = before.length + lead.length + 1;
    editRow(index, { abc: next });
    requestAnimationFrame(() => {
      const field = document.getElementById(`tune-notes-${index}`) as HTMLInputElement | null;
      field?.focus();
      field?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" onClick={onBack} className="h-11 self-start text-sm font-medium text-muted">
        {text.back}
      </button>
      <h1 className="mt-2 font-display text-3xl leading-tight font-medium text-balance">{initial ? text.editTitle : text.addTitle}</h1>
      <p className="mt-2 text-sm text-pretty text-muted">{text.addHelp}</p>
      <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={text.size}>
        {([8, 15] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={sheet === choice}
            onClick={() => setSheet(choice)}
            className={`h-11 rounded-full text-sm font-medium ${sheet === choice ? "bg-ink text-wall" : "bg-track text-ink"}`}
          >
            {choice === 8 ? text.size8 : text.size15}
          </button>
        ))}
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const problem = onSave(title, lines, wide, bpm, credit);
          setError(problem ?? "");
        }}
      >
        <label className="block text-sm font-medium" htmlFor="tune-title">
          {text.name}
          <input
            id="tune-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl bg-track px-3 text-base font-normal outline-none"
            maxLength={48}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="tune-source">
          {text.source}
          <input
            id="tune-source"
            value={credit}
            onChange={(event) => setCredit(event.target.value)}
            placeholder={text.sourcePlaceholder}
            className="mt-1 h-11 w-full rounded-xl bg-track px-3 text-base font-normal outline-none"
            maxLength={240}
          />
        </label>
        {/^https?:\/\//.test(credit.trim()) ? (
          <a href={credit.trim()} target="_blank" rel="noreferrer" className="block text-sm break-all underline">
            {credit.trim()}
          </a>
        ) : null}
        <ol className="space-y-3">
          {rows.map((line, index) => (
            <li key={`${sheet}-${index}`} className="rounded-2xl bg-track px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor={`tune-words-${index}`}>
                  {text.words}
                </label>
                {rows.length > 1 ? (
                  <button type="button" onClick={() => setRows((current) => current.filter((_, i) => i !== index))} className="h-8 text-sm text-muted">
                    {text.remove}
                  </button>
                ) : null}
              </div>
              <input
                id={`tune-words-${index}`}
                value={line.lyric}
                onChange={(event) => editRow(index, { lyric: event.target.value })}
                className="mt-1 h-11 w-full rounded-xl bg-wall px-3 text-base font-normal outline-none"
                maxLength={160}
              />
              <label className="mt-2 flex items-center justify-between gap-2 text-sm font-medium" htmlFor={`tune-notes-${index}`}>
                {text.notes}
                <button type="button" onClick={() => addRest(index)} className="h-8 rounded-full bg-wall px-3 text-sm font-medium">
                  {text.rest}
                </button>
              </label>
              <input
                id={`tune-notes-${index}`}
                value={line.abc}
                onChange={(event) => editRow(index, { abc: event.target.value })}
                placeholder="C C z G2"
                className="mt-1 h-11 w-full rounded-xl bg-wall px-3 font-normal outline-none"
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setRows((current) => [...current, { lyric: "", abc: "" }])}
          className="h-11 w-full rounded-full bg-track text-sm font-medium"
        >
          {text.addLine}
        </button>
        <label className="flex items-center gap-3 text-sm font-medium" htmlFor="tune-bpm">
          {text.speed}
          <input
            id="tune-bpm"
            type="number"
            min={60}
            max={160}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            className="h-11 w-24 rounded-xl bg-track px-3 font-normal tabular-nums outline-none"
          />
        </label>
        {error ? (
          <p className="text-sm text-pretty" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="h-12 w-full rounded-full bg-ink font-medium text-wall">
          {text.keep}
        </button>
      </form>
      {saved.length > 0 ? (
        <ul className="mt-8 divide-y divide-ink/10">
          {saved.map((tune) => (
            <li key={tune.id} className="flex items-center justify-between gap-3 py-1">
              <button type="button" onClick={() => onEdit(tune)} className="h-11 min-w-0 flex-1 truncate text-left text-sm">
                {tune.title}
              </button>
              <button type="button" onClick={() => onRemove(tune.id)} className="h-11 shrink-0 px-2 text-sm text-muted">
                {text.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : initial ? null : (
        <p className="mt-8 text-sm text-muted">{text.savedEmpty}</p>
      )}
    </div>
  );
}

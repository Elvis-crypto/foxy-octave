import type { SheetLine } from "./songs.ts";
import { CORE_STAMPS } from "./repertoire.ts";
import { isLang, type Lang } from "./i18n.ts";

export type { SheetLine };

export type SavedTune = {
  id: string;
  title: string;
  bpm: number;
  /** Eight-bar notes joined, so an older save still opens. */
  abc: string;
  /** Eight-bar sheet: words and the notes that play. */
  lines?: SheetLine[];
  /** Fifteen-bar sheet. Absent until that size is edited. */
  wide?: SheetLine[];
  /** Milliseconds. Missing on a tune that was saved before accounts. */
  updatedAt?: number;
  /** Set when this is an edit of a built-in song, and only for the core version it was edited from. */
  coreStamp?: string;
  /** Where the song comes from. Empty means the person cleared it. Missing means it was never set. */
  from?: string;
};

export type Disk = {
  saved: SavedTune[];
  lastId?: string;
  reversed?: boolean;
  muted?: boolean;
  chartOnly?: boolean;
  lang?: Lang;
  theme?: "light" | "dark";
  span?: 8 | 15;
  voice?: Chime;
  /** The "sign in to keep this" bubble was closed. */
  keepClosed?: boolean;
  /** False hides the syllable dot. Missing means on. */
  syllables?: boolean;
  foxToys?: boolean;
};

export type Chime = "wood" | "bell" | "glass" | "metal";

const CHIMES: readonly Chime[] = ["wood", "bell", "glass", "metal"];

const KEY = "little-octave.v1";
const MAX_JSON = 200_000;

function sheetLines(value: unknown): SheetLine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const lines: SheetLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { lyric?: unknown; abc?: unknown };
    if (typeof row.abc !== "string") continue;
    lines.push({
      lyric: typeof row.lyric === "string" ? row.lyric.slice(0, 160) : "",
      abc: row.abc.slice(0, 800),
    });
  }
  return lines.length > 0 ? lines : undefined;
}

export function loadDisk(): Disk {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { saved: [] };
    const parsed = JSON.parse(raw) as Disk;
    if (!parsed || !Array.isArray(parsed.saved)) return { saved: [] };
    return {
      saved: parsed.saved.flatMap((tune) => {
        if (!tune || typeof tune.id !== "string" || typeof tune.title !== "string") return [];
        const abc = typeof tune.abc === "string" ? tune.abc : "";
        const lines = sheetLines(tune.lines);
        if (!abc && !lines) return [];
        return [{
          id: tune.id,
          title: tune.title,
          bpm: Number(tune.bpm) || 100,
          abc,
          lines,
          wide: sheetLines(tune.wide),
          updatedAt: finite(tune.updatedAt),
          coreStamp: typeof tune.coreStamp === "string" ? tune.coreStamp : undefined,
          from: typeof tune.from === "string" ? tune.from.trim().slice(0, 240) : undefined,
        }];
      }),
      lastId: typeof parsed.lastId === "string" ? parsed.lastId : undefined,
      reversed: Boolean(parsed.reversed),
      muted: Boolean(parsed.muted),
      chartOnly: Boolean(parsed.chartOnly),
      lang: isLang(parsed.lang) ? parsed.lang : undefined,
      theme: parsed.theme === "dark" || parsed.theme === "light" ? parsed.theme : undefined,
      span: parsed.span === 15 ? 15 : parsed.span === 8 ? 8 : undefined,
      voice: CHIMES.includes(parsed.voice as Chime) ? (parsed.voice as Chime) : undefined,
      keepClosed: Boolean(parsed.keepClosed),
      syllables: parsed.syllables === false ? false : undefined,
      foxToys: parsed.foxToys === false ? false : undefined,
    };
  } catch {
    return { saved: [] };
  }
}

function finite(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

/** Drop a stored copy of a built-in song when the core sheet has changed. Songs the person added stay. */
export function adoptCore(saved: readonly SavedTune[]): SavedTune[] {
  return saved.filter((tune) => {
    const stamp = CORE_STAMPS[tune.id];
    if (!stamp) return true;
    return tune.coreStamp === stamp;
  });
}

/** The phone copy wins when it has no stamp yet. Otherwise the newer stamp wins. */
export function mergeTunes(local: readonly SavedTune[], remote: readonly SavedTune[]): { merged: SavedTune[]; upload: SavedTune[] } {
  const phone = adoptCore(local);
  const account = adoptCore(remote);
  const byId = new Map<string, SavedTune>();
  for (const tune of account) byId.set(tune.id, tune);
  const upload: SavedTune[] = [];
  for (const tune of phone) {
    const other = byId.get(tune.id);
    const stamped = tune.updatedAt ? tune : { ...tune, updatedAt: Date.now() };
    if (!other || tune.updatedAt == null || tune.updatedAt >= (other.updatedAt ?? 0)) {
      byId.set(tune.id, stamped);
      upload.push(stamped);
    }
  }
  return { merged: [...byId.values()], upload };
}

function normSheet(lines: readonly SheetLine[]): string {
  return lines.map((line) => `${line.lyric.trim()}\u0000${line.abc.replace(/\s+/g, " ").trim()}`).join("\n");
}

/** True when the words or the notes differ. Tempo alone does not count. */
export function sheetChanged(before: readonly SheetLine[], after: readonly SheetLine[]): boolean {
  return normSheet(before) !== normSheet(after);
}

export function writeDisk(disk: Disk): string | null {
  const json = JSON.stringify(disk);
  if (json.length > MAX_JSON) return "Not enough room to keep another tune.";
  localStorage.setItem(KEY, json);
  return null;
}

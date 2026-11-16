/** Pure sanitizers and report-row formatters. No DB, no request, no cookies. */

export type TrackInput = {
  kind?: unknown;
  ref?: unknown;
  from?: unknown;
  referrer?: unknown;
  song?: unknown;
  channel?: unknown;
  sessionStart?: unknown;
  path?: unknown;
};

export type TrackClean = {
  kind: "view" | "share" | "play" | "finish";
  src: string;
  referrerHost: string | null;
  song: string | null;
  channel: string | null;
  sessionStart: boolean;
  path: string | null;
};

const TAG = /^[a-z0-9_-]{1,32}$/;
const SONG = /^[A-Za-z0-9_-]{1,80}$/;
const DAL_PATH = /^\/dal\/[a-z0-9-]{1,80}$/;
const FIXED_PATHS = new Set(["/", "/advent", "/plakat", "/tanar"]);

const tag = (v: unknown) => (typeof v === "string" && TAG.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null);

/** Whitelist only: `/`, `/advent`, `/plakat`, `/tanar`, `/dal/<slug>`. Query strings and fragments become null. */
export function cleanPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/[?#\s]/.test(value)) return null;
  if (FIXED_PATHS.has(value)) return value;
  if (DAL_PATH.test(value)) return value;
  return null;
}

/** `/dal/<slug>` rolls up to `/dal/*` for the combined page-hit row. Unknown paths drop out. */
export function normalizePagePath(path: string): string | null {
  const cleaned = cleanPath(path);
  if (!cleaned) return null;
  return cleaned.startsWith("/dal/") ? "/dal/*" : cleaned;
}

export const PAGE_HIT_PAGES = ["/", "/advent", "/plakat", "/tanar", "/dal/*"] as const;

export function fillPageHits(
  rows: readonly { page?: unknown; views?: unknown; visitors?: unknown }[],
): { page: string; views: number; visitors: number }[] {
  const wanted: readonly string[] = PAGE_HIT_PAGES;
  const by = new Map<string, { page: string; views: number; visitors: number }>();
  for (const row of rows) {
    const page = typeof row.page === "string" ? row.page : "";
    if (!wanted.includes(page)) continue;
    by.set(page, { page, views: Number(row.views) || 0, visitors: Number(row.visitors) || 0 });
  }
  return PAGE_HIT_PAGES.map((page) => by.get(page) ?? { page, views: 0, visitors: 0 });
}

/** `finished / started` as a whole-percent string. En-dash when nothing was started. */
export function formatCompletionRate(started: number, finished: number): string {
  const s = Number(started);
  const f = Number(finished);
  if (!Number.isFinite(s) || s <= 0) return "–";
  const n = Number.isFinite(f) ? f : 0;
  return `${Math.round((100 * n) / s)}%`;
}

export function addCompletion<T extends { started: number; finished: number }>(row: T): T & { completion: string } {
  return { ...row, completion: formatCompletionRate(row.started, row.finished) };
}

export function topSongRow(row: { song: string; started: number; finished: number }): {
  song: string;
  starts: number;
  finishes: number;
  completion: string;
} {
  return {
    song: row.song,
    starts: row.started,
    finishes: row.finished,
    completion: formatCompletionRate(row.started, row.finished),
  };
}

export function cleanTrack(input: TrackInput): TrackClean | null {
  const raw = input?.kind;
  const kind = raw === "share" || raw === "play" || raw === "finish" ? raw : "view";
  const song = typeof input.song === "string" && SONG.test(input.song) ? input.song : null;
  if ((kind === "play" || kind === "finish") && !song) return null;

  let referrerHost: string | null = null;
  if (typeof input.referrer === "string" && input.referrer) {
    try {
      referrerHost = new URL(input.referrer).hostname.toLowerCase().replace(/^www\./, "").slice(0, 80) || null;
    } catch {
      referrerHost = null;
    }
  }
  const channel =
    typeof input.channel === "string" && /^(native|copy|whatsapp|facebook)$/.test(input.channel) ? input.channel : null;
  return {
    kind,
    src: tag(input.ref) ?? tag(input.from) ?? "direct",
    referrerHost,
    song,
    channel: kind === "share" ? channel : null,
    sessionStart: kind === "view" && input.sessionStart === true,
    path: kind === "view" ? cleanPath(input.path) : null,
  };
}

import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type TrackInput = {
  kind?: unknown;
  ref?: unknown;
  from?: unknown;
  referrer?: unknown;
  song?: unknown;
  channel?: unknown;
  sessionStart?: unknown;
};

const TAG = /^[a-z0-9_-]{1,32}$/;
const tag = (v: unknown) => (typeof v === "string" && TAG.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null);

export function cleanTrack(input: TrackInput) {
  const kind = input?.kind === "share" ? "share" : "view";
  let referrerHost: string | null = null;
  if (typeof input.referrer === "string" && input.referrer) {
    try {
      referrerHost = new URL(input.referrer).hostname.toLowerCase().replace(/^www\./, "").slice(0, 80) || null;
    } catch {
      referrerHost = null;
    }
  }
  const channel = typeof input.channel === "string" && /^(native|copy|whatsapp|facebook)$/.test(input.channel) ? input.channel : null;
  const song = typeof input.song === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(input.song) ? input.song : null;
  return {
    kind,
    src: tag(input.ref) ?? tag(input.from) ?? "direct",
    referrerHost,
    song,
    channel: kind === "share" ? channel : null,
    sessionStart: kind === "view" && input.sessionStart === true,
  };
}

/** One page view or share click. Cookieless; see migration 0009. */
export const trackEvent = createServerFn({ method: "POST" })
  .validator((input: TrackInput) => cleanTrack(input))
  .handler(async ({ data }) => {
    const { visitorKey } = await import("./stats.server");
    const visitor = visitorKey();
    const sql = await getSql();
    // A soft cap per daily visitor so a stuck tab can't flood the table.
    const [row] = await sql<{ n: number }>`
      select count(*)::int as n from site_events where visitor = ${visitor} and created_at > now() - interval '1 hour'
    `;
    if ((row?.n ?? 0) >= 120) return { ok: false as const };
    await sql`
      insert into site_events (kind, src, session_start, referrer_host, song, channel, visitor)
      values (${data.kind}, ${data.src}, ${data.sessionStart}, ${data.referrerHost}, ${data.song}, ${data.channel}, ${visitor})
    `;
    return { ok: true as const };
  });

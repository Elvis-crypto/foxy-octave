import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { cleanTrack, type TrackInput } from "./stats-clean";

export type { TrackInput };
export { cleanTrack };

/** One page view, share click, song start, or finished play-through. Cookieless; see migrations 0009–0010. */
export const trackEvent = createServerFn({ method: "POST" })
  .validator((input: TrackInput) => {
    const data = cleanTrack(input);
    if (!data) throw new Error("ignored");
    return data;
  })
  .handler(async ({ data }) => {
    const { visitorKey } = await import("./stats.server");
    const visitor = visitorKey();
    const sql = await getSql();
    // A soft cap per daily visitor so a stuck tab can't flood the table.
    const [row] = await sql<{ n: number }>`
      select count(*)::int as n from site_events where visitor = ${visitor} and created_at > now() - interval '1 hour'
    `;
    if ((row?.n ?? 0) >= 300) return { ok: false as const };
    await sql`
      insert into site_events (kind, src, session_start, referrer_host, song, channel, visitor, path)
      values (${data.kind}, ${data.src}, ${data.sessionStart}, ${data.referrerHost}, ${data.song}, ${data.channel}, ${visitor}, ${data.path})
    `;
    return { ok: true as const };
  });

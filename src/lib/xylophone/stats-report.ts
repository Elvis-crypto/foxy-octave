import { addCompletion, fillPageHits, topSongRow } from "./stats-clean";

/** Minimal tagged-template SQL surface used by the HTML report. */
export type StatsSql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
};

type Row = Record<string, unknown>;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function table(title: string, rows: Row[], cols: string[]): string {
  if (!rows.length) return `<h2>${esc(title)}</h2><p class="m">No data yet.</p>`;
  return `<h2>${esc(title)}</h2><table><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join("")}</tr>`)
    .join("")}</table>`;
}

function chart(days: { day: string; visitors: number; views: number }[]): string {
  const w = 640,
    h = 180,
    max = Math.max(1, ...days.map((d) => d.views));
  const bw = w / Math.max(1, days.length);
  const bars = days
    .map((d, i) => {
      const vh = (d.views / max) * (h - 30),
        uh = (d.visitors / max) * (h - 30);
      return `<rect x="${i * bw + 2}" y="${h - 20 - vh}" width="${bw - 4}" height="${vh}" fill="#e6c85a"><title>${d.day}: ${d.views} views</title></rect>
<rect x="${i * bw + bw * 0.25}" y="${h - 20 - uh}" width="${bw * 0.5}" height="${uh}" fill="#e07a28"><title>${d.day}: ${d.visitors} visitors</title></rect>
${i % Math.ceil(days.length / 10) === 0 ? `<text x="${i * bw + 2}" y="${h - 4}" font-size="10" fill="#6f6660">${d.day.slice(5)}</text>` : ""}`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img">${bars}</svg><p class="m"><span style="color:#e07a28">■</span> unique visitors <span style="color:#e6c85a">■</span> page views (last 30 days)</p>`;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function playSrcRows(rows: Row[]) {
  return rows.map((r) => addCompletion({ src: String(r.src ?? ""), started: num(r.started), finished: num(r.finished) }));
}

function playDayRows(rows: Row[]) {
  return rows.map((r) => addCompletion({ day: String(r.day ?? ""), started: num(r.started), finished: num(r.finished) }));
}

function topSongRows(rows: Row[]) {
  return rows.map((r) => topSongRow({ song: String(r.song ?? ""), started: num(r.started), finished: num(r.finished) }));
}

export async function statsHtmlFrom(sql: StatsSql): Promise<string> {
  const bySrc = (days: number) =>
    sql<Row>`
      select src,
        count(distinct visitor) filter (where kind = 'view')::int as visitors,
        count(*) filter (where kind = 'view' and session_start)::int as sessions,
        count(*) filter (where kind = 'view')::int as views,
        count(*) filter (where kind = 'share')::int as shares
      from site_events where day > current_date - ${days}::int group by src order by visitors desc, views desc`;
  const playBySrc = (days: number) =>
    sql<Row>`
      select src,
        count(*) filter (where kind = 'play')::int as started,
        count(*) filter (where kind = 'finish')::int as finished
      from site_events
      where day > current_date - ${days}::int and kind in ('play', 'finish')
      group by src order by started desc, finished desc`;
  const pageHits = (days: number) =>
    sql<Row>`
      select
        case when path like '/dal/%' then '/dal/*' else path end as page,
        count(*)::int as views,
        count(distinct visitor)::int as visitors
      from site_events
      where kind = 'view' and day > current_date - ${days}::int
        and (path in ('/', '/advent', '/plakat', '/tanar') or path like '/dal/%')
      group by 1`;
  const dalHits = (days: number) =>
    sql<Row>`
      select path, count(*)::int as views, count(distinct visitor)::int as visitors
      from site_events
      where kind = 'view' and path like '/dal/%' and day > current_date - ${days}::int
      group by path order by views desc, path limit 20`;

  const [
    today,
    week,
    total,
    days,
    referrers,
    songs,
    shares,
    partner,
    playDays,
    playToday,
    playWeek,
    playTotal,
    topSongs,
    hits7,
    hits30,
    dal7,
    dal30,
  ] = await Promise.all([
    bySrc(1),
    bySrc(7),
    bySrc(100000),
    sql<{ day: string; visitors: number; views: number }>`
      select to_char(d, 'YYYY-MM-DD') as day,
        coalesce((select count(distinct visitor) from site_events e where e.day = d and kind = 'view'), 0)::int as visitors,
        coalesce((select count(*) from site_events e where e.day = d and kind = 'view'), 0)::int as views
      from generate_series(current_date - 29, current_date, interval '1 day') as d order by d`,
    sql<Row>`
      select coalesce(referrer_host, '(none)') as referrer, count(*)::int as sessions
      from site_events where kind = 'view' and session_start and day > current_date - 30
      group by 1 order by 2 desc limit 20`,
    sql<Row>`
      select song, count(*)::int as landings from site_events
      where kind = 'view' and song is not null and day > current_date - 30 group by 1 order by 2 desc limit 20`,
    sql<Row>`
      select coalesce(channel, '?') as channel, count(*)::int as clicks from site_events
      where kind = 'share' and day > current_date - 30 group by 1 order by 2 desc`,
    sql<Row>`
      select tag, sum(visits)::int as visits from partner_visits group by tag order by 2 desc limit 30`,
    sql<Row>`
      select to_char(d, 'YYYY-MM-DD') as day,
        coalesce((select count(*) from site_events e where e.day = d and kind = 'play'), 0)::int as started,
        coalesce((select count(*) from site_events e where e.day = d and kind = 'finish'), 0)::int as finished
      from generate_series(current_date - 29, current_date, interval '1 day') as d order by d`,
    playBySrc(1),
    playBySrc(7),
    playBySrc(100000),
    sql<Row>`
      select song,
        count(*) filter (where kind = 'play')::int as started,
        count(*) filter (where kind = 'finish')::int as finished
      from site_events
      where kind in ('play', 'finish') and song is not null and day > current_date - 30
      group by song order by started desc, song limit 20`,
    pageHits(7),
    pageHits(30),
    dalHits(7),
    dalHits(30),
  ]);
  const cols = ["src", "visitors", "sessions", "views", "shares"];
  const playCols = ["src", "started", "finished", "completion"];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Foxy Octave stats</title>
<style>body{font-family:system-ui,sans-serif;background:#f3efe6;color:#241f1c;max-width:720px;margin:0 auto;padding:16px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #e6dfd0}
th{color:#6f6660;font-weight:500}td:not(:first-child),th:not(:first-child){text-align:right}h2{font-size:16px;margin-top:24px}.m{color:#6f6660;font-size:13px}</style></head><body>
<h1>🦊 Foxy Octave stats</h1><p class="m">Cookieless. Visitors = distinct daily hashes (a person on two days counts twice in totals). Sessions = arrivals from outside the site. Times in UTC days.</p>
${chart(days)}
${table("Today, by ref / from", today, cols)}
${table("Last 7 days, by ref / from", week, cols)}
${table("All time, by ref / from", total, cols)}
${table("Referrers (sessions, 30 days)", referrers, ["referrer", "sessions"])}
${table("Landing songs (30 days)", songs, ["song", "landings"])}
${table("Share clicks (30 days)", shares, ["channel", "clicks"])}
${table("Partner visits (?from=, all time, older counter)", partner, ["tag", "visits"])}
${table("Songs started / finished (last 30 days)", playDayRows(playDays), ["day", "started", "finished", "completion"])}
${table("Songs started / finished today, by ref / from", playSrcRows(playToday), playCols)}
${table("Songs started / finished, last 7 days, by ref / from", playSrcRows(playWeek), playCols)}
${table("Songs started / finished, all time, by ref / from", playSrcRows(playTotal), playCols)}
${table("Top songs (last 30 days)", topSongRows(topSongs), ["song", "starts", "finishes", "completion"])}
${table("Page hits (last 7 days)", fillPageHits(hits7), ["page", "views", "visitors"])}
${table("Page hits (last 30 days)", fillPageHits(hits30), ["page", "views", "visitors"])}
${table("Song pages /dal/* (last 7 days)", dal7, ["path", "views", "visitors"])}
${table("Song pages /dal/* (last 30 days)", dal30, ["path", "views", "visitors"])}
</body></html>`;
}

import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CORE_STAMPS } from "./repertoire.ts";
import type { SavedTune, SheetLine } from "./storage.ts";

function linesOf(value: unknown): SheetLine[] | null {
  const raw = typeof value === "string" ? safeParse(value) : value;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 80) return null;
  const lines: SheetLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const row = item as { lyric?: unknown; abc?: unknown };
    if (typeof row.abc !== "string" || !row.abc.trim() || row.abc.length > 800) return null;
    lines.push({ lyric: typeof row.lyric === "string" ? row.lyric.slice(0, 160) : "", abc: row.abc });
  }
  return lines;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function tuneOf(row: { id: unknown; title: unknown; bpm: unknown; lines: unknown; wide: unknown; updated_at: unknown; core_stamp?: unknown; source?: unknown }): SavedTune | null {
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;
  const lines = linesOf(row.lines);
  if (!lines) return null;
  const wide = row.wide == null ? undefined : linesOf(row.wide) ?? undefined;
  const updatedAt = Number(row.updated_at);
  const stamp = typeof row.core_stamp === "string" ? row.core_stamp : undefined;
  return {
    id: row.id,
    title: row.title.slice(0, 48),
    bpm: Math.min(160, Math.max(60, Number(row.bpm) || 100)),
    abc: lines.map((line) => line.abc).join("\n"),
    lines,
    wide,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : undefined,
    coreStamp: stamp && CORE_STAMPS[row.id] === stamp ? stamp : undefined,
    from: typeof row.source === "string" ? row.source.slice(0, 240) : undefined,
  };
}

function incoming(input: SavedTune): SavedTune {
  if (!input || typeof input.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input.id)) throw new Error("bad tune");
  if (typeof input.title !== "string" || !input.title.trim()) throw new Error("bad tune");
  const lines = linesOf(input.lines);
  if (!lines) throw new Error("bad tune");
  const wide = input.wide == null ? null : linesOf(input.wide);
  return {
    id: input.id,
    title: input.title.trim().slice(0, 48),
    bpm: Math.min(160, Math.max(60, Math.round(Number(input.bpm)) || 100)),
    abc: lines.map((line) => line.abc).join("\n"),
    lines,
    wide: wide ?? undefined,
    updatedAt: Number.isFinite(input.updatedAt) ? Math.round(input.updatedAt!) : Date.now(),
    coreStamp: typeof input.coreStamp === "string" && CORE_STAMPS[input.id] === input.coreStamp ? input.coreStamp : undefined,
    from: typeof input.from === "string" ? input.from.trim().slice(0, 240) : undefined,
  };
}

export const listMyTunes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SavedTune[]> => {
    const sql = await getSql();
    const rows = await sql<{ id: string; title: string; bpm: number; lines: unknown; wide: unknown; updated_at: string; core_stamp: string | null; source: string | null }>`
      select id, title, bpm, lines, wide, (extract(epoch from updated_at) * 1000)::bigint as updated_at, core_stamp, source
      from tunes
      where user_id = ${context.userId}
      order by updated_at desc
    `;
    return rows.flatMap((row) => {
      const tune = tuneOf(row);
      return tune ? [tune] : [];
    });
  });

export const saveMyTune = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SavedTune) => incoming(input))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const updatedAt = data.updatedAt ?? Date.now();
    await sql`
      insert into tunes (user_id, id, title, bpm, lines, wide, updated_at, core_stamp, source)
      values (
        ${context.userId},
        ${data.id},
        ${data.title},
        ${data.bpm},
        ${JSON.stringify(data.lines)}::jsonb,
        ${data.wide ? JSON.stringify(data.wide) : null}::jsonb,
        to_timestamp(${updatedAt} / 1000.0),
        ${data.coreStamp ?? null},
        ${data.from ?? null}
      )
      on conflict (user_id, id) do update set
        title = excluded.title,
        bpm = excluded.bpm,
        lines = excluded.lines,
        wide = excluded.wide,
        updated_at = excluded.updated_at,
        core_stamp = excluded.core_stamp,
        source = excluded.source
    `;
    return { ok: true as const };
  });

/** A copy of a sheet that was not already stored. No account, and no way to list them. */
export const captureTune = createServerFn({ method: "POST" })
  .validator((input: SavedTune) => incoming(input))
  .handler(async ({ data }) => {
    const { createHash } = await import("node:crypto");
    const lines = data.lines ?? [];
    const wide = data.wide ?? lines;
    // The reference is part of the identity, so a citation-only fix is its own row.
    const body = `${data.title}\n${data.from ?? ""}\n${lines.map((line) => `${line.lyric}\n${line.abc}`).join("\n")}\n--\n${wide.map((line) => `${line.lyric}\n${line.abc}`).join("\n")}`;
    const id = createHash("sha256").update(body).digest("hex");
    const { clientKey, overLimit, RateLimited, CAPTURE_LIMIT } = await import("./limit.server");
    const key = clientKey();
    const sql = await getSql();
    const [counts] = await sql<{ mine: number; everyone: number }>`
      select
        count(*) filter (where client_key = ${key} and created_at > now() - make_interval(mins => ${CAPTURE_LIMIT.clientMinutes}))::int as mine,
        count(*)::int as everyone
      from captures where created_at > now() - interval '1 hour'
    `;
    if (overLimit(CAPTURE_LIMIT, counts?.mine ?? 0, counts?.everyone ?? 0)) throw new RateLimited();
    const rows = await sql<{ id: string }>`
      insert into captures (id, tune_id, title, bpm, lines, wide, source, client_key)
      values (
        ${id},
        ${data.id},
        ${data.title},
        ${data.bpm},
        ${JSON.stringify(data.lines)}::jsonb,
        ${data.wide ? JSON.stringify(data.wide) : null}::jsonb,
        ${data.from ?? null},
        ${key}
      )
      on conflict (id) do nothing
      returning id
    `;
    return { fresh: rows.length > 0 };
  });

export const removeMyTune = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => {
    if (!input || typeof input.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input.id)) throw new Error("bad tune");
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`delete from tunes where user_id = ${context.userId} and id = ${data.id}`;
    return { ok: true as const };
  });

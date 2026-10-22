import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { isLang } from "./i18n.ts";

export type ReportInput = {
  body?: unknown;
  songId?: unknown;
  songTitle?: unknown;
  lang?: unknown;
  span?: unknown;
};

export function cleanReport(input: ReportInput): {
  body: string;
  songId: string | null;
  songTitle: string | null;
  lang: string | null;
  span: 8 | 15 | null;
} {
  const body = typeof input?.body === "string" ? input.body.replace(/\s+/g, " ").trim() : "";
  if (body.length < 3 || body.length > 800) throw new Error("bad report");
  const songId = typeof input.songId === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(input.songId) ? input.songId : null;
  const songTitle = typeof input.songTitle === "string" ? input.songTitle.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  return {
    body,
    songId,
    songTitle: songTitle || null,
    lang: isLang(input.lang) ? input.lang : null,
    span: input.span === 15 ? 15 : input.span === 8 ? 8 : null,
  };
}

/** A problem note. No account, and no list in the app — read them from the database later. */
export const saveReport = createServerFn({ method: "POST" })
  .validator((input: ReportInput) => cleanReport(input))
  .handler(async ({ data }) => {
    const { randomUUID } = await import("node:crypto");
    const sql = await getSql();
    await sql`
      insert into reports (id, body, song_id, song_title, ui_lang, span)
      values (${randomUUID()}, ${data.body}, ${data.songId}, ${data.songTitle}, ${data.lang}, ${data.span})
    `;
    return { ok: true as const };
  });

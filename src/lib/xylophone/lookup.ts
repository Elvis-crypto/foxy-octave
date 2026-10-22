import { createServerFn } from "@tanstack/react-start";
import { copy, isLang } from "./i18n.ts";
import { ParseError } from "./parse.ts";
import { compileWritten, type SheetLine } from "./songs.ts";

export type SheetLookup =
  | { ok: true; title: string; abc: string; bpm: number; lines: SheetLine[]; wide?: SheetLine[] }
  | { ok: false; error: string };

type ModelLine = { lyric?: unknown; abc?: unknown };

type ModelSheet = {
  ok?: boolean;
  pd?: boolean;
  title?: unknown;
  bpm?: unknown;
  abc?: unknown;
  lines?: unknown;
  wide?: unknown;
  reason?: unknown;
};

export const lookupSheet = createServerFn({ method: "POST" })
  .validator((input: { title: string; lang?: string }) => ({
    title: input.title.trim().slice(0, 80),
    lang: isLang(input.lang) ? input.lang : "en",
  }))
  .handler(async ({ data }): Promise<SheetLookup> => {
    const text = copy[data.lang];
    if (data.title.length < 2) return { ok: false, error: text.nameTheTune };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: text.lookupOff };

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model: "grok-4.5",
          max_output_tokens: 2200,
          input: [
            {
              role: "user",
              content: `Look up one monophonic melody for a children's xylophone.

Search for an openly published transcription of the tune below. Accept it only when the melody is public domain or traditional, from an open page, not a paid sheet store.

If it is still in copyright, or you cannot find an open melody, do not include any notes.

Reply with one JSON object and nothing else.
{"ok":true,"pd":true,"title":"Name","bpm":100,"lines":[{"lyric":"the full line","abc":"C D E"}],"wide":[{"lyric":"the full line","abc":"C D E"}]}
{"ok":false,"pd":false,"reason":"copyright"}
{"ok":false,"pd":false,"reason":"notfound"}

lines is the eight-bar toy. C is the low C, lowercase c is the high C. wide is the fifteen-bar toy, same words, and c' only for the top C. The letters are the notes that should sound. One object per musical line, full verse, under 80 notes.

Tune: ${data.title}`,
            },
          ],
          tools: [
            {
              type: "web_search",
              excluded_domains: [
                "musescore.com",
                "musicnotes.com",
                "sheetmusicplus.com",
                "noteflight.com",
                "jellynote.com",
              ],
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: text.lookupFail };
    }
    if (!response.ok) return { ok: false, error: text.lookupFail };

    let payload: ModelSheet;
    try {
      const body = (await response.json()) as {
        output?: { type?: string; content?: { type?: string; text?: string }[] }[];
      };
      const raw = (body.output ?? [])
        .flatMap((item) => (item.type === "message" ? (item.content ?? []) : []))
        .map((part) => (part.type === "output_text" ? (part.text ?? "") : ""))
        .join("\n");
      const start = raw.lastIndexOf("{");
      const end = raw.lastIndexOf("}");
      if (start < 0 || end <= start) return { ok: false, error: text.notFound };
      payload = JSON.parse(raw.slice(start, end + 1)) as ModelSheet;
    } catch {
      return { ok: false, error: text.notFound };
    }

    if (!payload.ok || payload.pd !== true) {
      return { ok: false, error: payload.reason === "copyright" ? text.copyright : text.notFound };
    }

    const title = cleanTitle(typeof payload.title === "string" ? payload.title : data.title, data.title);
    const bpm = clampBpm(payload.bpm);
    const lines = readLines(payload.lines) ?? (typeof payload.abc === "string" ? [{ lyric: "", abc: payload.abc.trim() }] : undefined);
    if (!lines) return { ok: false, error: text.sheetUnread };
    const wide = readLines(payload.wide);
    try {
      const chart = compileWritten("lookup", title, bpm, lines, 8);
      if (chart.notes.length > 200) return { ok: false, error: text.tooLongSheet };
      if (wide) compileWritten("lookup", title, bpm, wide, 15);
    } catch (error) {
      if (error instanceof ParseError) return { ok: false, error: text.sheetUnread };
      return { ok: false, error: text.sheetUnread };
    }
    return { ok: true, title, abc: lines.map((line) => line.abc).join("\n"), bpm, lines, wide };
  });

function readLines(value: unknown): SheetLine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const lines: SheetLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as ModelLine;
    if (typeof row.abc !== "string" || !row.abc.trim() || row.abc.length > 800) continue;
    lines.push({
      lyric: typeof row.lyric === "string" ? row.lyric.replace(/\s+/g, " ").trim().slice(0, 160) : "",
      abc: row.abc.trim(),
    });
  }
  return lines.length > 0 ? lines.slice(0, 80) : undefined;
}

function cleanTitle(title: string, fallback: string): string {
  const name = title.replace(/\s+/g, " ").trim();
  if (!name) return fallback.slice(0, 48);
  return name.slice(0, 48);
}

function clampBpm(value: unknown): number {
  const bpm = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(bpm)) return 100;
  return Math.min(160, Math.max(60, Math.round(bpm)));
}

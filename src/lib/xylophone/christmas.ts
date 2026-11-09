import type { Lang } from "./i18n.ts";
import { partnerTag } from "./partner.ts";
import { REPERTOIRE, type RepertoireSong } from "./repertoire.ts";

/**
 * Christmas songs that are actually in the book, in Advent order.
 * The public slug is the song id, so Mennyből az angyal is /dal/mennybol-az-angyal
 * and Hull a pelyhes is /dal/pelyhes. One scheme, no second map.
 */
export const CHRISTMAS_IDS = [
  "pelyhes",
  "mennybol-az-angyal",
  "kirje",
  "pasztorok",
  "kiskaracsony",
  "jingle-bells",
] as const;

export function christmasSongs(): RepertoireSong[] {
  const byId = new Map(REPERTOIRE.map((song) => [song.id, song]));
  return CHRISTMAS_IDS.flatMap((id) => {
    const song = byId.get(id);
    return song ? [song] : [];
  });
}

export function songBySlug(slug: string): RepertoireSong | undefined {
  return christmasSongs().find((song) => song.id === slug);
}

/** Paths a crawler should see: home, the new public pages, and every Christmas song. */
export function publicPaths(): string[] {
  return ["/", "/advent", "/tanar", "/plakat", ...christmasSongs().map((song) => `/dal/${song.id}`)];
}

export function sitemapXml(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const body = publicPaths()
    .map((path) => `  <url><loc>${escapeXml(base + path)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PLAY_LABEL: Record<Lang, string> = {
  hu: "Szóljon",
  en: "Play",
  fr: "Jouer",
  de: "Spielen",
  es: "Tocar",
  da: "Spil",
};

export function playLabel(lang: Lang): string {
  return PLAY_LABEL[lang];
}

/** Hungarian search phrases, with the song's own title and its diacritics. */
export function songMeta(song: RepertoireSong): { title: string; description: string } {
  return {
    title: `${song.title} szöveg`,
    description: `${song.title} xilofon kotta. ${song.title} szöveg.`,
  };
}

/** Keep `lang` and a safe `from` / `ref` on a link to another page of this app. */
export function keepQuery(path: string, lang: Lang, search: string): string {
  const incoming = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const query = new URLSearchParams();
  query.set("lang", lang);
  const from = partnerTag(incoming.get("from"));
  if (from) query.set("from", from);
  const ref = partnerTag(incoming.get("ref"));
  if (ref) query.set("ref", ref);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/** Player link. `lang` is the page language (`?lang=` already won). Keeps a safe `from` / `ref`. */
export function playerHref(songId: string, lang: Lang, search: string): string {
  const href = keepQuery("/", lang, search);
  const query = new URLSearchParams(href.startsWith("/?") ? href.slice(2) : "");
  query.set("song", songId);
  return `/?${query.toString()}`;
}

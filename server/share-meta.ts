/**
 * Our own share-card meta tags, added after the platform head injector.
 * The platform skips og:image on *.vercel.app hosts, so without this a link
 * pasted into WhatsApp / Facebook shows no picture. Share links
 * (`?from=share&song=<id>`) get a per-song "we played <song>" card.
 */
import { REPERTOIRE } from "../src/lib/xylophone/repertoire";
import { parseShare, playedLine, SHARE_COPY } from "../src/lib/xylophone/share";

const OWN_KEYS = /^(og:title|og:description|og:image|og:image:width|og:image:height|og:image:type|og:url|og:site_name|twitter:title|twitter:description|twitter:image|twitter:card)$/i;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function shareMetaTags(url: URL, host: string): string {
  const safe = /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? host : "foxy-octave.vercel.app";
  const origin = `${/^(localhost|127\.)/.test(safe) ? "http" : "https"}://${safe}`;
  const share = parseShare(url.searchParams);
  const song = share ? REPERTOIRE.find((s) => s.id === share.song) : undefined;
  const lang = share?.lang ?? "hu";
  let title = "Foxy Octave";
  let description = SHARE_COPY.hu.desc;
  let image = `${origin}/og.jpg`;
  let type = "image/jpeg";
  if (share && song) {
    title = `${playedLine(lang, song.title)} · Foxy Octave`;
    description = SHARE_COPY[lang].desc;
    const q = new URLSearchParams({ song: song.id, lang });
    if (share.stars) q.set("stars", String(share.stars));
    image = `${origin}/api/og/share?${q.toString()}`;
    type = "image/png";
  }
  const pageUrl = `${origin}${url.pathname}${url.search}`;
  const tags: [string, string, string][] = [
    ["name", "twitter:card", "summary_large_image"],
    ["property", "og:site_name", "Foxy Octave"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", pageUrl],
    ["property", "og:image", image],
    ["property", "og:image:type", type],
    ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", image],
  ];
  return tags.map(([k, n, v]) => `<meta ${k}="${n}" content="${esc(v)}">`).join("");
}

function stripOwn(head: string): string {
  return head.replace(/<meta\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
    return m && OWN_KEYS.test(m[1]!) ? "" : tag;
  });
}

/** Rewrite the head once `</head>` arrives, then stream the rest untouched. */
export function withShareMeta(response: Response, tags: string): Response {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = "";
  let done = false;
  const body = response.body!.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (done) return controller.enqueue(chunk);
        buffered += decoder.decode(chunk, { stream: true });
        const at = buffered.search(/<\/head>/i);
        if (at < 0) return;
        done = true;
        const head = stripOwn(buffered.slice(0, at));
        controller.enqueue(encoder.encode(head + tags + buffered.slice(at)));
        buffered = "";
      },
      flush(controller) {
        const rest = buffered + decoder.decode();
        if (rest) controller.enqueue(encoder.encode(rest));
      },
    }),
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

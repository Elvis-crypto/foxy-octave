import { Resvg } from "@resvg/resvg-js";
import { FOX_PNG, FRAUNCES_600, OUTFIT_600 } from "./share-assets.gen";
import { SHARE_COPY } from "./share.ts";
import type { Lang } from "./i18n.ts";

const FONTS = [Buffer.from(OUTFIT_600, "base64"), Buffer.from(FRAUNCES_600, "base64")];
const BARS = ["#e4dfa8", "#e6c85a", "#e07a28", "#e14b42", "#c9a39c", "#c5c9a8", "#6fb56a", "#8b97a3"];

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Greedy wrap by an average glyph width; good enough for a fixed card. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!line) line = word;
    else if ((line + " " + word).length <= maxChars) line += " " + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1]!.replace(/.{0,1}$/, "…");
    return kept;
  }
  return lines;
}

function star(cx: number, cy: number, r: number, filled: boolean): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${filled ? "#e6c85a" : "none"}" stroke="#241f1c" stroke-width="4" stroke-linejoin="round"/>`;
}

export function shareCardSvg(input: { title: string; stars: number | null; lang: Lang }): string {
  const copy = SHARE_COPY[input.lang];
  const prefix = copy.played.replace("{song}", "").trim();
  const size = input.title.length > 34 ? 64 : input.title.length > 20 ? 78 : 92;
  const lines = wrap(input.title, Math.floor(1150 / size), 3);
  const top = 240;
  const titleSvg = lines
    .map((l, i) => `<text x="80" y="${top + i * size * 1.08}" font-family="Fraunces" font-size="${size}" fill="#241f1c">${esc(l)}</text>`)
    .join("");
  const afterTitle = top + (lines.length - 1) * size * 1.08 + 90;
  const stars = input.stars
    ? [0, 1, 2].map((i) => star(115 + i * 82, afterTitle, 32, i < input.stars!)).join("")
    : "";
  const barW = 1200 / BARS.length;
  const bars = BARS.map(
    (c, i) => `<rect x="${i * barW + 6}" y="${560 + (i % 2) * 6}" width="${barW - 12}" height="90" rx="14" fill="${c}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f3efe6"/>
<circle cx="1000" cy="300" r="250" fill="#e6dfd0"/>
<rect x="0" y="546" width="1200" height="8" fill="#e08a7c"/>
${bars}
<image x="820" y="80" width="354" height="420" xlink:href="data:image/png;base64,${FOX_PNG}"/>
<text x="80" y="95" font-family="Outfit" font-size="34" fill="#6f6660">Foxy Octave</text>
<text x="80" y="160" font-family="Fraunces" font-size="46" fill="#e07a28">${esc(prefix)}</text>
${titleSvg}
${stars}
</svg>`;
}

export function renderShareCard(input: { title: string; stars: number | null; lang: Lang }): Buffer {
  const resvg = new Resvg(shareCardSvg(input), {
    fitTo: { mode: "width", value: 1200 },
    // fontBuffers is supported at runtime (resvg-js 2.5+) but missing from its types.
    font: { fontBuffers: FONTS, loadSystemFonts: false, defaultFontFamily: "Outfit" } as never,
  });
  return resvg.render().asPng();
}

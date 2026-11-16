import { DEFAULT_PAPER_TAG, partnerTag, slugTagInput } from "@/lib/xylophone/partner";
import { QrCode } from "./qr-code";

export type PosterLang = "hu" | "de" | "en";

export const POSTER: Record<PosterLang, { brand: string; line: string; scan: string; tag: string; tagHint: string }> = {
  hu: {
    brand: "Rókás oktáv",
    line: "Énekeljünk a xilofonnal.",
    scan: "Olvasd be a kódot.",
    tag: "Jel",
    tagHint: "Írd be az óvoda rövid nevét (pl. napsugar-tata). A kód ezzel a jellel kerül a plakátra, így látjuk, hány beolvasás jön innen.",
  },
  de: {
    brand: "Fuchsoktave",
    line: "Wir singen mit dem Xylophon.",
    scan: "Lies den Code.",
    tag: "Kennung",
    tagHint: "Kurzname eures Kindergartens (z. B. sonnenschein-wien). Er steht im Code, so sehen wir, wie viele Scans von diesem Plakat kommen.",
  },
  en: {
    brand: "Foxy Octave",
    line: "Sing with the xylophone.",
    scan: "Scan the code.",
    tag: "Tag",
    tagHint: "Type a short name for your kindergarten (e.g. sunshine-leeds). It goes into the code, so we can see how many scans come from this poster.",
  },
};

/** Controls + A4 sheet. Parent owns tag / language / origin so /tanar and /plakat can share it. */
export function ClassroomPoster({
  heading,
  printLabel,
  tagInput,
  onTagChange,
  posterLang,
  onPosterLang,
  origin,
  sectionId,
}: {
  heading: string;
  printLabel: string;
  tagInput: string;
  onTagChange: (value: string) => void;
  posterLang: PosterLang;
  onPosterLang: (lang: PosterLang) => void;
  origin: string;
  sectionId?: string;
}) {
  const poster = POSTER[posterLang];
  const effective = partnerTag(tagInput) ?? DEFAULT_PAPER_TAG;
  const qr = origin ? `${origin}/?from=${effective}&lang=${posterLang}` : "";

  return (
    <>
      <section id={sectionId} className="no-print mx-auto max-w-6xl px-4 pb-10 scroll-mt-4">
        <h2 className="font-display text-3xl font-medium">{heading}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-muted">{POSTER[posterLang].tag}</span>
            <input
              value={tagInput}
              maxLength={32}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) =>
                onTagChange(slugTagInput(event.target.value))
              }
              className="mt-1 h-11 rounded-full bg-track px-4 text-base text-ink outline-none"
            />
          </label>
          <p className="basis-full text-sm text-muted max-w-xl order-last">{POSTER[posterLang].tagHint}</p>
          <div className="flex gap-1">
            {(["hu", "de", "en"] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={posterLang === id}
                onClick={() => onPosterLang(id)}
                className={`h-11 rounded-full px-4 text-sm font-medium ${posterLang === id ? "bg-ink text-wall" : "bg-track text-ink"}`}
              >
                {id}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => window.print()} className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-wall">
            {printLabel}
          </button>
        </div>
      </section>

      <article className="poster-sheet mx-auto my-6 flex max-w-[210mm] flex-col items-center justify-between bg-white px-8 py-10 text-center text-[#241f1c] shadow-none">
        <img src="/fox-head.png" alt="" width={120} height={134} className="poster-fox object-contain" />
        <div>
          <h2 className="font-display text-5xl font-medium">{poster.brand}</h2>
          <p className="mt-4 text-2xl">{poster.line}</p>
        </div>
        <div className="poster-qr">
          <QrCode text={qr} label={poster.scan} />
        </div>
        <div>
          <p className="text-2xl">{poster.scan}</p>
          <p className="mt-3 text-xl">
            {poster.tag}: {effective}
          </p>
        </div>
      </article>
    </>
  );
}

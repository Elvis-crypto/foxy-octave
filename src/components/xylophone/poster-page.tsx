import { useEffect, useState } from "react";
import type { Lang } from "@/lib/xylophone/i18n";
import { DEFAULT_PAPER_TAG, partnerTag } from "@/lib/xylophone/partner";
import { ClassroomPoster, type PosterLang } from "./classroom-poster";
import { usePageLang, usePageSearch } from "./use-page-lang";

const PAGE: Record<Lang, { title: string; print: string; home: string }> = {
  hu: { title: "Plakát", print: "Nyomtatás", home: "Xilofon" },
  en: { title: "Poster", print: "Print", home: "Xylophone" },
  fr: { title: "Affiche", print: "Imprimer", home: "Xylophone" },
  de: { title: "Plakat", print: "Drucken", home: "Xylophon" },
  es: { title: "Cartel", print: "Imprimir", home: "Xilófono" },
  da: { title: "Plakat", print: "Udskriv", home: "Xylofon" },
};

/** Printable A4 QR poster only — no classroom playlist or lyrics. */
export function PosterPage({ suggested, search }: { suggested: Lang; search: string }) {
  const lang = usePageLang(suggested);
  const liveSearch = usePageSearch(search);
  const text = PAGE[lang];
  const [tagInput, setTagInput] = useState(DEFAULT_PAPER_TAG);
  const [posterLang, setPosterLang] = useState<PosterLang>(suggested === "de" || suggested === "en" ? suggested : "hu");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(liveSearch.startsWith("?") ? liveSearch.slice(1) : liveSearch);
    const from = partnerTag(params.get("from"));
    if (from) setTagInput(from);
  }, [liveSearch]);

  const effective = partnerTag(tagInput) ?? DEFAULT_PAPER_TAG;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("from") === effective) return;
    url.searchParams.set("from", effective);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [effective]);

  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <main className="min-h-dvh bg-wall text-ink">
      <nav className="no-print mx-auto max-w-6xl px-4 pt-6 text-sm">
        <a href={`/?${new URLSearchParams({ lang, ...(effective ? { from: effective } : {}) }).toString()}`} className="font-medium">
          {text.home}
        </a>
      </nav>
      <ClassroomPoster
        heading={text.title}
        printLabel={text.print}
        tagInput={tagInput}
        onTagChange={setTagInput}
        posterLang={posterLang}
        onPosterLang={setPosterLang}
        origin={origin}
      />
    </main>
  );
}

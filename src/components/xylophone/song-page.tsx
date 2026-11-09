import { keepQuery, playLabel, playerHref } from "@/lib/xylophone/christmas";
import type { Lang } from "@/lib/xylophone/i18n";
import { noteTokens } from "@/lib/xylophone/letters";
import type { RepertoireSong } from "@/lib/xylophone/repertoire";
import { usePageLang, usePageSearch } from "./use-page-lang";

const HOME: Record<Lang, string> = {
  hu: "Xilofon",
  en: "Xylophone",
  fr: "Xylophone",
  de: "Xylophon",
  es: "Xilófono",
  da: "Xylofon",
};

const ADVENT: Record<Lang, string> = {
  hu: "Advent",
  en: "Advent",
  fr: "Avent",
  de: "Advent",
  es: "Adviento",
  da: "Advent",
};

function Letters({ abc }: { abc: string }) {
  const tokens = noteTokens(abc);
  return (
    <p className="font-display text-2xl leading-relaxed tracking-wide text-ink">
      {tokens.map((token, index) => (
        <span key={`${token.letter}-${index}`} className="mr-3 inline-block">
          {token.letter}
          {token.length ? <span className="text-base text-muted">{token.length}</span> : null}
        </span>
      ))}
    </p>
  );
}

export function SongPage({
  song,
  suggested,
  search,
}: {
  song: RepertoireSong;
  suggested: Lang;
  search: string;
}) {
  const lang = usePageLang(suggested);
  const liveSearch = usePageSearch(search);
  const href = playerHref(song.id, lang, liveSearch);
  const eight = song.tune.map((line) => line.eight);
  const fifteen = song.tune.map((line) => line.fifteen);
  const wider = eight.join("\n") !== fifteen.join("\n");
  const home = keepQuery("/", lang, liveSearch);
  const advent = keepQuery("/advent", lang, liveSearch);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-wall px-4 py-6 text-ink">
      <nav className="flex items-center justify-between gap-3 text-sm">
        <a href={home} className="font-medium">
          {HOME[lang]}
        </a>
        <a href={advent} className="text-muted">
          {ADVENT[lang]}
        </a>
      </nav>
      <h1 className="mt-6 font-display text-4xl font-medium text-balance">{song.title}</h1>
      <a
        href={href}
        className="mt-5 inline-flex h-12 items-center rounded-full bg-ink px-6 text-base font-medium text-wall"
      >
        {playLabel(lang)}
      </a>
      <h2 className="mt-8 font-display text-2xl font-medium">Szöveg</h2>
      <div className="mt-3 space-y-4">
        {song.verses.map((verse, index) => (
          <p key={index} className="text-lg leading-relaxed text-pretty">
            {verse.map((line, lineIndex) => (
              <span key={lineIndex} className="block">
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
      <h2 className="mt-8 font-display text-2xl font-medium">Xilofon kotta</h2>
      <div className="mt-3 space-y-2">
        {eight.map((line, index) => (
          <Letters key={index} abc={line} />
        ))}
      </div>
      {wider ? (
        <>
          <h2 className="mt-8 font-display text-2xl font-medium">Tizenöt lap</h2>
          <div className="mt-3 space-y-2">
            {fifteen.map((line, index) => (
              <Letters key={index} abc={line} />
            ))}
          </div>
        </>
      ) : null}
      {song.from.startsWith("http") ? (
        <p className="mt-8 text-sm text-muted">
          <a href={song.from} className="underline">
            {song.from}
          </a>
        </p>
      ) : null}
    </main>
  );
}

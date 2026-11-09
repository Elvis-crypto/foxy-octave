import { adventDoors, type BudapestDate } from "@/lib/xylophone/calendar";
import { CHRISTMAS_IDS, christmasSongs, keepQuery, playLabel, playerHref } from "@/lib/xylophone/christmas";
import type { Lang } from "@/lib/xylophone/i18n";
import { usePageLang, usePageSearch } from "./use-page-lang";

const COPY: Record<Lang, { title: string; waiting: string; home: string }> = {
  hu: {
    title: "Adventi naptár",
    waiting: "Az adventi naptár december 1-jén nyílik.",
    home: "Xilofon",
  },
  en: {
    title: "Advent calendar",
    waiting: "The advent calendar opens on 1 December.",
    home: "Xylophone",
  },
  fr: {
    title: "Calendrier de l'Avent",
    waiting: "Le calendrier de l'Avent s'ouvre le 1er décembre.",
    home: "Xylophone",
  },
  de: {
    title: "Adventskalender",
    waiting: "Der Adventskalender öffnet am 1. Dezember.",
    home: "Xylophon",
  },
  es: {
    title: "Calendario de Adviento",
    waiting: "El calendario de Adviento se abre el 1 de diciembre.",
    home: "Xilófono",
  },
  da: {
    title: "Adventskalender",
    waiting: "Adventskalenderen åbner den 1. december.",
    home: "Xylofon",
  },
};

export function AdventPage({
  suggested,
  search,
  date,
}: {
  suggested: Lang;
  search: string;
  date: BudapestDate;
}) {
  const lang = usePageLang(suggested);
  const liveSearch = usePageSearch(search);
  const text = COPY[lang];
  const songs = new Map(christmasSongs().map((song) => [song.id, song]));
  const doors = adventDoors(date, CHRISTMAS_IDS);
  const waiting = doors.every((door) => door.state === "waiting");

  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-wall px-4 py-6 text-ink">
      <nav className="text-sm">
        <a href={keepQuery("/", lang, liveSearch)} className="font-medium">
          {text.home}
        </a>
      </nav>
      <h1 className="mt-6 font-display text-4xl font-medium text-balance">{text.title}</h1>
      {waiting ? <p className="mt-3 text-lg text-pretty">{text.waiting}</p> : null}
      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {doors.map((door) => {
          const song = door.state === "open" && door.songId ? songs.get(door.songId) : undefined;
          if (song && door.songId) {
            return (
              <li key={door.day} className="rounded-2xl bg-track p-3">
                <p className="font-display text-2xl">{door.day}</p>
                <a href={keepQuery(`/dal/${song.id}`, lang, liveSearch)} className="mt-1 block text-sm font-medium">
                  {song.title}
                </a>
                <a href={playerHref(door.songId, lang, liveSearch)} className="mt-2 inline-flex text-sm text-muted">
                  {playLabel(lang)}
                </a>
              </li>
            );
          }
          return (
            <li key={door.day} className="rounded-2xl bg-track/60 p-3 text-muted">
              <p className="font-display text-2xl">{door.day}</p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

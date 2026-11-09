import { createFileRoute, notFound } from "@tanstack/react-router";
import { SongPage } from "@/components/xylophone/song-page";
import { songBySlug, songMeta } from "@/lib/xylophone/christmas";
import { publicPageContext } from "@/lib/xylophone/locale";

export const Route = createFileRoute("/dal/$slug")({
  loader: async ({ params }) => {
    const song = songBySlug(params.slug);
    if (!song) throw notFound();
    const ctx = await publicPageContext();
    return { song, suggested: ctx.lang, search: ctx.search };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const meta = songMeta(loaderData.song);
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
      ],
    };
  },
  notFoundComponent: MissingSong,
  component: DalPage,
});

function DalPage() {
  const data = Route.useLoaderData();
  return <SongPage song={data.song} suggested={data.suggested} search={data.search} />;
}

function MissingSong() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-wall px-6 py-10 text-ink">
      <h1 className="font-display text-3xl">Nincs ilyen dal</h1>
      <a href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-wall">
        Xilofon
      </a>
    </main>
  );
}

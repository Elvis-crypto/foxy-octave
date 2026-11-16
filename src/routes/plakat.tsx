import { createFileRoute } from "@tanstack/react-router";
import { PosterPage } from "@/components/xylophone/poster-page";
import { publicPageContext } from "@/lib/xylophone/locale";
import { useTrackPage } from "@/lib/xylophone/track-page";

export const Route = createFileRoute("/plakat")({
  loader: async () => {
    const ctx = await publicPageContext();
    return { suggested: ctx.lang, search: ctx.search };
  },
  head: () => ({
    meta: [
      { title: "Plakát" },
      { name: "description", content: "Nyomtatható QR-plakát óvodáknak." },
    ],
  }),
  component: PlakatRoute,
});

function PlakatRoute() {
  const data = Route.useLoaderData();
  useTrackPage("/plakat");
  return <PosterPage suggested={data.suggested} search={data.search} />;
}

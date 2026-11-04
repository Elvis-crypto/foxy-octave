import { createFileRoute } from "@tanstack/react-router";
import { REPERTOIRE } from "@/lib/xylophone/repertoire";
import { parseShare } from "@/lib/xylophone/share";

/** The share preview image: `/api/og/share?song=<id>&stars=<1-3>&lang=<ui>`. */
export const Route = createFileRoute("/api/og/share")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = parseShare(new URL(request.url).searchParams);
        const song = params ? REPERTOIRE.find((s) => s.id === params.song) : undefined;
        const { renderShareCard } = await import("@/lib/xylophone/share-card.server");
        const png = renderShareCard({
          title: song?.title ?? "Foxy Octave",
          stars: song ? (params?.stars ?? null) : null,
          lang: params?.lang ?? "hu",
        });
        return new Response(new Uint8Array(png), {
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
          },
        });
      },
    },
  },
});

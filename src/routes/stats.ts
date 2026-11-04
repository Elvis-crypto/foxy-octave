import { createFileRoute } from "@tanstack/react-router";

/** Private stats: /stats?token=<STATS_TOKEN>. 404 without the right token. */
export const Route = createFileRoute("/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { tokenOk, statsHtml } = await import("@/lib/xylophone/stats.server");
        const token = new URL(request.url).searchParams.get("token");
        if (!tokenOk(token)) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
        return new Response(await statsHtml(), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" },
        });
      },
    },
  },
});

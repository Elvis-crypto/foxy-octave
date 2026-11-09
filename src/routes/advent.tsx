import { createFileRoute } from "@tanstack/react-router";
import { AdventPage } from "@/components/xylophone/advent-page";
import { budapestDate } from "@/lib/xylophone/calendar";
import { publicPageContext } from "@/lib/xylophone/locale";

export const Route = createFileRoute("/advent")({
  loader: async () => {
    const ctx = await publicPageContext();
    return { suggested: ctx.lang, search: ctx.search, date: budapestDate() };
  },
  head: () => ({
    meta: [
      { title: "Adventi naptár" },
      { name: "description", content: "Karácsonyi dalok december 1-jétől, Budapest szerint." },
    ],
  }),
  component: AdventRoute,
});

function AdventRoute() {
  const data = Route.useLoaderData();
  return <AdventPage suggested={data.suggested} search={data.search} date={data.date} />;
}

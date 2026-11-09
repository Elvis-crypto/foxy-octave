import { createFileRoute } from "@tanstack/react-router";
import { TeacherPage } from "@/components/xylophone/teacher-page";
import { publicPageContext } from "@/lib/xylophone/locale";

export const Route = createFileRoute("/tanar")({
  loader: async () => {
    const ctx = await publicPageContext();
    return { suggested: ctx.lang, search: ctx.search };
  },
  head: () => ({
    meta: [
      { title: "Tanterem" },
      { name: "description", content: "Nagy kotta a tanteremnek." },
    ],
  }),
  component: TanarRoute,
});

function TanarRoute() {
  const data = Route.useLoaderData();
  return <TeacherPage suggested={data.suggested} search={data.search} />;
}

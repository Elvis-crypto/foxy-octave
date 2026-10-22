import { createFileRoute } from "@tanstack/react-router";
import { XylophoneApp } from "@/components/xylophone/app";
import { languageFromIp } from "@/lib/xylophone/locale";

export const Route = createFileRoute("/")({
  loader: () => languageFromIp(),
  component: Home,
});

function Home() {
  const suggestedLang = Route.useLoaderData();
  return <XylophoneApp suggestedLang={suggestedLang} />;
}


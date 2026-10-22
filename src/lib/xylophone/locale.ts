import { createServerFn } from "@tanstack/react-start";
import { isLang, type Lang } from "./i18n.ts";

const COUNTRY: Partial<Record<string, Lang>> = {
  HU: "hu",
  FR: "fr",
  DE: "de",
  AT: "de",
  ES: "es",
  DK: "da",
};

/** Saved choice, then the viewer's country, then the browser language. */
export function langFromSignals(input: { cookie: string | null; country: string | null; accept: string | null }): Lang {
  const saved = input.cookie?.match(/(?:^|;\s*)lo-lang=(hu|en|fr|de|es|da)(?:\s*;|$)/);
  if (saved?.[1] && isLang(saved[1])) return saved[1];
  if (input.country && /^[A-Za-z]{2}$/.test(input.country)) {
    const mapped = COUNTRY[input.country.toUpperCase()];
    if (mapped) return mapped;
  }
  if (input.accept) {
    for (const part of input.accept.split(",")) {
      const tag = part.split(";")[0]?.trim().toLowerCase().split("-")[0];
      if (tag && isLang(tag)) return tag;
    }
  }
  return "en";
}

export const languageFromIp = createServerFn({ method: "GET" }).handler(async (): Promise<Lang> => {
  const { resolveRequestLang } = await import("./locale.server.ts");
  return resolveRequestLang();
});

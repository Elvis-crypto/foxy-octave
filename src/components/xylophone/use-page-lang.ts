import { useEffect, useState } from "react";
import { isLang, type Lang } from "@/lib/xylophone/i18n";
import { loadDisk } from "@/lib/xylophone/storage";

/** `?lang=` wins over the saved disk language, which wins over the server guess. */
export function usePageLang(suggested: Lang): Lang {
  const [lang, setLang] = useState(suggested);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    const next = isLang(query) ? query : (loadDisk().lang ?? suggested);
    setLang(next);
    document.documentElement.lang = next;
  }, [suggested]);
  return lang;
}

/** The address the server saw, then the address in the browser (so `from` survives). */
export function usePageSearch(serverSearch: string): string {
  const [search, setSearch] = useState(serverSearch);
  useEffect(() => setSearch(window.location.search), [serverSearch]);
  return search;
}

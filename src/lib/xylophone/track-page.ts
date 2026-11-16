import { useEffect } from "react";
import { trackEvent } from "./stats";

function sessionFields(): { sessionStart: boolean; referrer?: string } {
  let sessionStart = true;
  try {
    sessionStart = !document.referrer || new URL(document.referrer).host !== window.location.host;
  } catch {
    /* keep true */
  }
  return { sessionStart, referrer: sessionStart ? document.referrer : undefined };
}

function tags(): { ref?: string; from?: string } {
  const q = new URLSearchParams(window.location.search);
  return { ref: q.get("ref") ?? undefined, from: q.get("from") ?? undefined };
}

/** One cookieless page view. Client-only; call from useEffect / useTrackPage. */
export function trackPageView(path: string, song?: string) {
  const q = new URLSearchParams(window.location.search);
  const { sessionStart, referrer } = sessionFields();
  void trackEvent({
    data: {
      kind: "view",
      path,
      ...tags(),
      referrer,
      song: song ?? q.get("song") ?? undefined,
      sessionStart,
    },
  }).catch(() => {});
}

/** Song start or finished play-through. Fire-and-forget; never await on the play path. */
export function trackSongEvent(kind: "play" | "finish", song: string) {
  void trackEvent({ data: { kind, song, ...tags() } }).catch(() => {});
}

export function useTrackPage(path: string, song?: string) {
  useEffect(() => {
    trackPageView(path, song);
  }, [path, song]);
}

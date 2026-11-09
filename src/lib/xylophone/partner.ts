/** Same charset as cleanTrack in stats.ts: lowercase [a-z0-9_-], 1 to 32. */
const TAG = /^[a-z0-9_-]{1,32}$/;

/** A partner tag from `?from=` or `?ref=`. Null when the text is not safe to store. */
export function partnerTag(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const tag = value.trim().toLowerCase();
  return TAG.test(tag) ? tag : null;
}

/** Printed on a teacher poster when the kindergarten has not set its own tag. */
export const DEFAULT_PAPER_TAG = "paper";

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

/** Turn typed text into a tag: accents to plain letters, spaces to dashes ("Napsugár Óvoda" -> "napsugar-ovoda"). */
export function slugTagInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s.]+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

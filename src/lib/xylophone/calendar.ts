export type BudapestDate = { year: number; month: number; day: number };

/** Calendar date in Europe/Budapest, not the visitor's local zone. */
export function budapestDate(now: Date = new Date()): BudapestDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

export const ADVENT_DAYS = 24;

export type DoorState = "waiting" | "locked" | "empty" | "open";

export type AdventDoor = {
  day: number;
  /** Set only when the door is open. Hidden before its day, and on days with no song. */
  songId: string | null;
  state: DoorState;
};

/**
 * One door per day from 1 December, Budapest time.
 * Songs fill days from the start of the list. Later days stay empty.
 * Outside December every door waits, so nothing opens early.
 */
export function adventDoors(date: BudapestDate, songIds: readonly string[]): AdventDoor[] {
  const inDecember = date.month === 12;
  return Array.from({ length: ADVENT_DAYS }, (_, index) => {
    const day = index + 1;
    const songId = songIds[index] ?? null;
    if (!inDecember) return { day, songId: null, state: "waiting" };
    if (day > date.day) return { day, songId: null, state: "locked" };
    if (!songId) return { day, songId: null, state: "empty" };
    return { day, songId, state: "open" };
  });
}

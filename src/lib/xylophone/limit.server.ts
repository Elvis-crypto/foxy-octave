import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";

/**
 * A caller key for rate limits: SHA-256 of the forwarded address and today's
 * date, so it rotates daily and the address itself is never stored.
 */
export function clientKey(): string {
  let ip = "unknown";
  try {
    const headers = getRequest().headers;
    ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip")?.trim() ||
      "unknown";
  } catch {
    // Outside a request (tests): one shared key.
  }
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${day}|${ip}`).digest("hex").slice(0, 32);
}

export type Limit = { perClient: number; clientMinutes: number; perHour: number };

export const REPORT_LIMIT: Limit = { perClient: 5, clientMinutes: 10, perHour: 300 };
export const CAPTURE_LIMIT: Limit = { perClient: 20, clientMinutes: 10, perHour: 1000 };

export class RateLimited extends Error {
  constructor() {
    super("Too many notes for now. Try again a little later.");
    this.name = "RateLimited";
  }
}

/** True when this caller (or everyone together) is over the window. */
export function overLimit(limit: Limit, mine: number, everyone: number): boolean {
  return mine >= limit.perClient || everyone >= limit.perHour;
}

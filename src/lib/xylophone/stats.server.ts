import { createHash, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { statsHtmlFrom } from "./stats-report";

/** Daily-rotating, salted visitor hash. The address and browser string are never stored. */
export function visitorKey(): string {
  let ip = "unknown";
  let ua = "";
  try {
    const h = getRequest().headers;
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
    ua = h.get("user-agent") ?? "";
  } catch {
    // outside a request
  }
  const salt = process.env.STATS_SALT ?? "foxy-octave";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

export function tokenOk(given: string | null): boolean {
  const want = process.env.STATS_TOKEN?.trim();
  if (!want || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function statsHtml(): Promise<string> {
  return statsHtmlFrom(await getSql());
}

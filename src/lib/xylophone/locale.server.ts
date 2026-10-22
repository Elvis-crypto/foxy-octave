import { getRequest } from "@tanstack/react-start/server";
import type { Lang } from "./i18n.ts";
import { langFromSignals } from "./locale.ts";

function publicIp(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const ip = part.trim();
    if (!ip || isPrivate(ip)) continue;
    return ip;
  }
  return null;
}

function isPrivate(ip: string): boolean {
  const host = ip.replace(/^::ffff:/i, "");
  if (host === "::1" || host === "localhost") return true;
  if (host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^(fc|fd|fe80)/i.test(host)) return true;
  return false;
}

async function countryOf(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://get.geojs.io/v1/ip/country/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const code = (await response.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

export async function resolveRequestLang(): Promise<Lang> {
  const request = getRequest();
  if (!request) return "en";
  const headers = request.headers;
  const cookie = headers.get("cookie");
  const headerCountry =
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("cloudfront-viewer-country") ||
    headers.get("x-country-code");
  let country = headerCountry && headerCountry !== "XX" && headerCountry !== "T1" ? headerCountry : null;
  if (!country) {
    const ip =
      publicIp(headers.get("x-forwarded-for")) ||
      publicIp(headers.get("x-real-ip")) ||
      publicIp(headers.get("fly-client-ip")) ||
      publicIp(headers.get("true-client-ip"));
    if (ip) country = await countryOf(ip);
  }
  return langFromSignals({ cookie, country, accept: headers.get("accept-language") });
}

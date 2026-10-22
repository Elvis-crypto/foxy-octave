import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Server half of Clerk sign-in: verify the session JWT the browser sends as a
 * bearer token. Only public values are needed (no Clerk secret key):
 *   CLERK_ISSUER              https://<instance>.clerk.accounts.dev
 *   CLERK_JWKS_URL            <issuer>/.well-known/jwks.json (derived when unset)
 *   CLERK_AUTHORIZED_PARTIES  comma-separated origins allowed as `azp`;
 *                             a `*` label matches one subdomain label, e.g.
 *                             https://foxy-octave-*.vercel.app
 */
const env = (name: string) => process.env[name]?.trim() || undefined;

const issuer = env("CLERK_ISSUER");
const jwksUrl = env("CLERK_JWKS_URL") ?? (issuer ? `${issuer.replace(/\/$/, "")}/.well-known/jwks.json` : undefined);

export const clerkServerConfigured = Boolean(issuer && jwksUrl);

const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;

export function partyAllowed(azp: string, parties: readonly string[]): boolean {
  return parties.some((party) => {
    if (!party.includes("*")) return party === azp;
    const pattern = new RegExp(
      "^" + party.split("*").map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[a-z0-9-]+") + "$",
      "i",
    );
    return pattern.test(azp);
  });
}

function parties(): string[] {
  return (env("CLERK_AUTHORIZED_PARTIES") ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** The Clerk user id (`sub`) for a valid session token, or null. */
export async function verifyClerkToken(token: string | undefined): Promise<string | null> {
  if (!token || !jwks || !issuer) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: issuer.replace(/\/$/, ""), clockTolerance: 5 });
    const allowed = parties();
    const azp = typeof payload.azp === "string" ? payload.azp : "";
    if (allowed.length > 0 && azp && !partyAllowed(azp, allowed)) return null;
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

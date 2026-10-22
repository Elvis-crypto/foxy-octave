/**
 * Clerk sign-in (Google and X), browser side. ClerkJS is loaded from Clerk's own
 * frontend API, so no Clerk SDK or secret key is needed in this app. The server
 * only verifies the short-lived session JWT against Clerk's JWKS
 * (see `clerk.server.ts`).
 *
 * The publishable key is public by design. It is read at build time from
 * CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY). Without it Clerk is off
 * and the instrument works as before, with no account controls.
 */

declare const __CLERK_PUBLISHABLE_KEY__: string;

export const CLERK_PUBLISHABLE_KEY: string =
  typeof __CLERK_PUBLISHABLE_KEY__ === "string" ? __CLERK_PUBLISHABLE_KEY__ : "";

export const clerkEnabled = CLERK_PUBLISHABLE_KEY.startsWith("pk_");

export type ClerkUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

type ClerkLike = {
  load: (opts?: Record<string, unknown>) => Promise<void>;
  user?: {
    id: string;
    fullName?: string | null;
    username?: string | null;
    imageUrl?: string;
    primaryEmailAddress?: { emailAddress: string } | null;
  } | null;
  session?: { getToken: () => Promise<string | null> } | null;
  addListener: (cb: (state: unknown) => void) => void;
  openSignIn: (opts?: Record<string, unknown>) => void;
  signOut: (opts?: Record<string, unknown>) => Promise<void>;
};

declare global {
  interface Window {
    Clerk?: ClerkLike;
  }
}

/** pk_test_<base64("host$")> → the instance frontend API host. */
export function frontendApiOf(key: string): string | null {
  const body = key.replace(/^pk_(test|live)_/, "");
  try {
    const decoded = typeof atob === "function" ? atob(body) : Buffer.from(body, "base64").toString("utf8");
    const host = decoded.replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

type State = { user: ClerkUser | null; isPending: boolean };
let state: State = { user: null, isPending: clerkEnabled };
const listeners = new Set<() => void>();
let loading: Promise<ClerkLike | null> | null = null;

function emit(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

function userOf(clerk: ClerkLike): ClerkUser | null {
  const user = clerk.user;
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.fullName || user.username || null,
    primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
    profileImageUrl: user.imageUrl ?? null,
  };
}

export function loadClerk(): Promise<ClerkLike | null> {
  if (!clerkEnabled || typeof window === "undefined") return Promise.resolve(null);
  if (loading) return loading;
  loading = new Promise<ClerkLike | null>((resolve) => {
    const host = frontendApiOf(CLERK_PUBLISHABLE_KEY);
    if (!host) {
      emit({ user: null, isPending: false });
      resolve(null);
      return;
    }
    const finish = async () => {
      const clerk = window.Clerk;
      if (!clerk) {
        emit({ user: null, isPending: false });
        resolve(null);
        return;
      }
      try {
        await clerk.load();
        clerk.addListener(() => emit({ user: userOf(clerk), isPending: false }));
        emit({ user: userOf(clerk), isPending: false });
        resolve(clerk);
      } catch {
        emit({ user: null, isPending: false });
        resolve(null);
      }
    };
    if (window.Clerk) {
      void finish();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://${host}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.clerkPublishableKey = CLERK_PUBLISHABLE_KEY;
    script.onload = () => void finish();
    script.onerror = () => {
      emit({ user: null, isPending: false });
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function subscribeClerk(listener: () => void): () => void {
  listeners.add(listener);
  void loadClerk();
  return () => listeners.delete(listener);
}

export function clerkSnapshot(): State {
  return state;
}

const serverState: State = { user: null, isPending: clerkEnabled };
export function clerkServerSnapshot(): State {
  return serverState;
}

/** Opens Clerk's sign-in sheet; it lists Google and X as enabled in the Clerk dashboard. */
export async function clerkSignIn(): Promise<void> {
  const clerk = await loadClerk();
  if (!clerk) throw new Error("Sign-in is not available right now");
  clerk.openSignIn({ forceRedirectUrl: window.location.href, fallbackRedirectUrl: window.location.href });
}

export async function clerkSignOut(): Promise<void> {
  const clerk = await loadClerk();
  if (clerk) await clerk.signOut();
}

/** The current session JWT for server calls, or null when signed out. */
export async function clerkToken(): Promise<string | null> {
  const clerk = await loadClerk();
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

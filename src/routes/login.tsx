import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-wall px-6 text-ink">
      <div className="w-full max-w-sm">
        <img src="/fox-head.png" alt="" width={72} height={72} className="size-16 object-contain" />
        <h1 className="mt-3 font-display text-3xl font-medium">Foxy Octave</h1>
        {authEnabled ? (
          <div className="mt-6 space-y-2">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
                className="h-11 w-full rounded-full bg-ink text-sm font-medium text-wall"
              >
                {provider.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}

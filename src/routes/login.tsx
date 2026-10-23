import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteShell } from "@/components/site/shell";
import { documentHead } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    documentHead({
      title: "Staff sign-in",
      description: "Staff sign-in for Showbizz Cars.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);
  const waiting = !ready || isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
      } else {
        navigate({ to: "/admin" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-4xl">Staff sign-in</h1>
        <p className="mt-4 text-sm text-muted">
          Sign in with your authorized staff credentials to access the management desk.
        </p>
        <div className="mt-8 rounded-card border border-line bg-surface p-6">
          {waiting ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-11 animate-pulse rounded-control bg-line" />
              <div className="h-11 animate-pulse rounded-control bg-line" />
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">You are currently signed in as {user.primaryEmail || user.displayName || user.id}.</p>
              <UserButton />
              <div>
                <Link
                  to="/admin"
                  className="inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-accent-fg"
                >
                  Open the staff desk
                </Link>
              </div>
            </div>
          ) : authEnabled ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div role="alert" className="rounded-control border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                  {error}
                </div>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  placeholder="staff@showbizzcars.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 inline-flex items-center justify-center rounded-control bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">Sign-in is currently disabled.</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

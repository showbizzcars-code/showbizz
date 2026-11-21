import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getInitialAdminSetupStatus,
  registerInitialAdmin,
  type InitialAdminSetupStatus,
} from "@/lib/auth/initial-admin";
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
  const [setupStatus, setSetupStatus] = useState<InitialAdminSetupStatus | null>(null);
  const [setupStatusChecked, setSetupStatusChecked] = useState(false);
  const [setupStatusError, setSetupStatusError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInitialAdminSetupStatus()
      .then(setSetupStatus)
      .catch(() => {
        setSetupStatusError(
          "We couldn't verify initial administrator setup. Sign-in is still available, but first-time setup is paused until the database can be checked.",
        );
      })
      .finally(() => setSetupStatusChecked(true));
  }, []);

  const waiting = isPending || !setupStatusChecked;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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

  const handleInitialAdminRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await registerInitialAdmin({
        name: adminName,
        email,
        password: adminPassword,
        setupToken,
      });

      setSetupStatus((current) =>
        current
          ? { ...current, hasAdmin: true, available: false }
          : current,
      );
      setPassword("");
      setAdminPassword("");
      setSetupToken("");
      setSuccess(
        "Administrator account created. Sign in with your email and password below.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the initial administrator account.",
      );
      // Re-check after a failed attempt in case another request completed setup.
      getInitialAdminSetupStatus()
        .then(setSetupStatus)
        .catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          SHOWBIZZ CARS / ADMIN
        </p>
        <h1 className="mt-3 font-display text-4xl">
          {setupStatus?.available ? "Create administrator account" : "Staff sign-in"}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {setupStatus?.available
            ? "Set up the first administrator account. This option automatically closes once the account is created."
            : "Sign in with your authorized staff credentials to access the management desk."}
        </p>

        <div className="mt-8 rounded-card border border-line bg-surface p-6">
          {waiting ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-11 animate-pulse rounded-control bg-line" />
              <div className="h-11 animate-pulse rounded-control bg-line" />
              <div className="h-11 animate-pulse rounded-control bg-line" />
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                You are currently signed in as{" "}
                {user.primaryEmail || user.displayName || user.id}.
              </p>
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
          ) : !authEnabled ? (
            <p className="text-sm text-muted">
              Sign-in is currently disabled. Configure authentication before accessing the staff desk.
            </p>
          ) : (
            <>
              {setupStatusError ? (
                <div
                  role="alert"
                  className="mb-4 rounded-control border border-danger/20 bg-danger/10 p-3 text-xs text-danger"
                >
                  {setupStatusError}
                </div>
              ) : null}

              {error ? (
                <div
                  role="alert"
                  className="mb-4 rounded-control border border-danger/20 bg-danger/10 p-3 text-xs text-danger"
                >
                  {error}
                </div>
              ) : null}

              {success ? (
                <div
                  role="status"
                  className="mb-4 rounded-control border border-line bg-bg p-3 text-sm"
                >
                  {success}
                </div>
              ) : null}

              {setupStatus?.available ? (
                <form onSubmit={handleInitialAdminRegistration} className="space-y-4">
                  <div>
                    <label htmlFor="admin-name" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                      Administrator name
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-email" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                      Administrator email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-password" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                      Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="At least 12 characters"
                    />
                    <p className="mt-1 text-xs text-muted">Use at least 12 characters.</p>
                  </div>
                  <div>
                    <label htmlFor="admin-setup-token" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                      One-time setup token
                    </label>
                    <input
                      id="admin-setup-token"
                      type="password"
                      autoComplete="off"
                      required
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value)}
                      className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="Enter the configured setup token"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Creating account..." : "Create administrator"}
                  </button>
                  <p className="text-xs leading-5 text-muted">
                    Registration is restricted to the initial setup token and closes automatically after the first administrator is created.
                  </p>
                </form>
              ) : (
                <>
                  {setupStatus?.hasAdmin === false && !setupStatus.tokenConfigured ? (
                    <div
                      role="status"
                      className="mb-4 rounded-control border border-line bg-bg p-3 text-xs leading-5 text-muted"
                    >
                      First-time registration is not enabled. The deployment owner must configure a strong
                      ADMIN_SETUP_TOKEN (at least 32 characters) in the server environment and redeploy.
                      {setupStatus.tokenTooWeak
                        ? " The current token is too short."
                        : ""}
                    </div>
                  ) : null}
                  {setupStatus?.hasAdmin === false && !setupStatus.authEnabled ? (
                    <div
                      role="alert"
                      className="mb-4 rounded-control border border-danger/20 bg-danger/10 p-3 text-xs text-danger"
                    >
                      Authentication is disabled. Set VITE_AUTH_ENABLED=true and configure Better Auth before initial setup.
                    </div>
                  ) : null}
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                        placeholder="staff@showbizzcars.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-control border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

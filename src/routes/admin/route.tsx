import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { documentHead } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/admin")({
  head: () =>
    documentHead({
      title: "Staff desk",
      description: "Private staff desk.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isPending) {
    return (
      <main className="min-h-screen px-5 py-10 text-ink">
        <div className="mx-auto max-w-6xl space-y-3" aria-hidden="true">
          <div className="h-10 w-44 animate-pulse rounded-control bg-line" />
          <div className="h-24 animate-pulse rounded-card bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/" aria-label="Showbizz Cars public website" className="inline-flex shrink-0 items-center">
              <img
                src="/showbizz-cars-logo.svg"
                alt="Showbizz Cars"
                className="block h-auto w-32 object-contain sm:w-36"
              />
            </Link>
            <div className="border-l border-line pl-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Admin area</p>
              <Link to="/admin" className="font-display text-xl sm:text-2xl">
                Staff desk
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/"
              className="inline-flex min-h-10 items-center rounded-control border border-line px-4 text-sm transition hover:bg-surface"
            >
              View website
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

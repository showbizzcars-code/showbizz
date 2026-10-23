import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BRAND_NAME } from "@/lib/showbizz/brand";
import { SOCIAL_LINKS } from "@/lib/showbizz/present";
import { mailtoHref, telHref, type PublicSettings } from "@/lib/showbizz/settings";

const NAV = [
  { to: "/vehicles", label: "Cars" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "Questions" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteShell({
  settings = null,
  children,
}: {
  settings?: PublicSettings | null;
  children: ReactNode;
}) {
  const phoneHref = telHref(settings?.publicPhone);
  const emailHref = mailtoHref(settings?.publicEmail);
  const socials = [
    ...SOCIAL_LINKS,
    settings?.xUrl ? { href: settings.xUrl, label: "X" } : null,
    settings?.youtubeUrl ? { href: settings.youtubeUrl, label: "YouTube" } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-[#101214]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-7">
          <Link to="/" aria-label="Showbizz Cars home" className="inline-flex shrink-0 items-center">
            <img
              src="/showbizz-cars-logo.svg"
              alt="Showbizz Cars"
              className="block h-auto w-40 object-contain sm:w-44 md:w-48"
            />
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap gap-x-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-10 items-center rounded-control px-3 text-sm text-[#c0c5cb] transition hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line bg-[#101214]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-7 md:grid-cols-3">
          <div>
            <Link to="/" aria-label="Showbizz Cars home" className="inline-flex">
              <img
                src="/showbizz-cars-logo.svg"
                alt="Showbizz Cars"
                className="block h-auto w-40 object-contain"
                loading="lazy"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Browse cars, send an enquiry, and hear back from our team to confirm availability and price.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Contact</p>
            {settings?.address ? <p className="mt-2 whitespace-pre-wrap text-muted">{settings.address}</p> : null}
            {phoneHref && settings?.publicPhone ? (
              <p className="mt-2">
                <a className="underline" href={phoneHref}>{settings.publicPhone}</a>
              </p>
            ) : null}
            {emailHref && settings?.publicEmail ? (
              <p className="mt-2">
                <a className="underline" href={emailHref}>{settings.publicEmail}</a>
              </p>
            ) : null}
            {!settings?.address && !phoneHref && !emailHref ? (
              <p className="mt-2 text-muted">Phone, email, and address will be added here.</p>
            ) : null}
          </div>
          <div className="text-sm">
            <p className="font-medium">Follow Showbizz Cars</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {socials.map((item) => (
                <li key={item.href}>
                  <a
                    className="underline underline-offset-4 hover:text-ink"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2">
              <li><Link to="/testimonials" className="underline">Customer reviews</Link></li>
              <li><Link to="/login" className="underline">Staff login</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

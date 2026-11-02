import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SOCIAL_LINKS } from "@/lib/showbizz/present";
import { DEFAULT_WHATSAPP_E164, mailtoHref, telHref, whatsAppHref, type PublicSettings } from "@/lib/showbizz/settings";

const NAV = [
  { to: "/vehicles", label: "Cars" },
  { to: "/blog", label: "Blog" },
  { to: "/host-my-car", label: "Host my car" },
  { to: "/collaborate", label: "Collaborate" },
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
  const whatsAppLink = whatsAppHref(
    settings?.whatsappE164 ?? DEFAULT_WHATSAPP_E164,
    "Hello Showbizz Cars, I would like to make an enquiry.",
  );
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
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
          <Link to="/" aria-label="Showbizz Cars home" className="group inline-flex shrink-0 items-center">
            <span aria-hidden="true" className="relative inline-block h-12 w-[114px] sm:h-14 sm:w-[133px]">
              <img src="/showbizz-logo-left.webp" alt="" className="absolute inset-0 h-full w-full object-contain" />
              <img src="/showbizz-logo-right.webp" alt="" className="absolute inset-0 h-full w-full object-contain" />
            </span>
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
      {whatsAppLink ? (
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Showbizz Cars on WhatsApp"
          title="Chat with Showbizz Cars on WhatsApp"
          className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_35px_rgba(0,0,0,.35)] transition duration-200 hover:scale-105 hover:bg-[#1fba59] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-6 sm:right-6"
        >
          <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7 fill-current">
            <path d="M16.01 3.2A12.63 12.63 0 0 0 5.17 22.3L3.4 28.8l6.66-1.75A12.64 12.64 0 1 0 16.01 3.2Zm0 22.99a10.34 10.34 0 0 1-5.27-1.44l-.38-.23-3.95 1.04 1.06-3.85-.25-.4a10.35 10.35 0 1 1 8.79 4.88Z" />
            <path d="M22.05 18.17c-.33-.17-1.96-.97-2.26-1.08-.3-.11-.52-.17-.74.17-.22.33-.85 1.07-1.04 1.3-.19.22-.39.25-.72.08-.33-.17-1.4-.52-2.66-1.65-.98-.87-1.64-1.95-1.83-2.28-.19-.33-.02-.51.14-.68.15-.15.33-.39.5-.58.17-.19.22-.33.33-.55.11-.22.06-.42-.03-.58-.08-.17-.74-1.79-1.02-2.45-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.58.08-.88.42-.3.33-1.15 1.13-1.15 2.76s1.18 3.2 1.34 3.42c.17.22 2.32 3.54 5.62 4.97.78.34 1.39.54 1.87.69.79.25 1.51.22 2.08.13.63-.09 1.96-.8 2.24-1.57.28-.77.28-1.43.2-1.57-.08-.14-.3-.22-.63-.39Z" />
          </svg>
        </a>
      ) : null}
      <footer className="border-t border-line bg-[#101214]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-7 md:grid-cols-3">
          <div>
            <Link to="/" aria-label="Showbizz Cars home" className="inline-flex">
              <span aria-hidden="true" className="relative inline-block h-12 w-[114px]">
                <img src="/showbizz-logo-left.webp" alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
                <img src="/showbizz-logo-right.webp" alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
              </span>
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
            {whatsAppLink ? (
              <p className="mt-2">
                <a className="underline underline-offset-4 hover:text-ink" href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                  WhatsApp Showbizz Cars ↗
                </a>
              </p>
            ) : null}
            {!settings?.address && !phoneHref && !emailHref && !whatsAppLink ? (
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
                    <SocialIcon label={item.label} />
                    <span className="sr-only">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2">
              <li><Link to="/testimonials" className="underline">Customer reviews</Link></li>
              <li><Link to="/faq" className="underline">Questions & answers</Link></li>
              <li><Link to="/login" className="underline">Staff login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-[#9aa9bb]">
          Powered by{" "}
          <a
            href="https://xconversion.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#c5d0df] transition hover:text-white"
          >
            XConversionLab
          </a>
        </div>
      </footer>
    </div>
  );
}

function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" className="fill-current stroke-none" /></svg>;
  if (label === "Facebook") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.4v8h3.1Z" /></svg>;
  if (label === "LinkedIn") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M5.2 7.2A1.8 1.8 0 1 0 5.2 3.6a1.8 1.8 0 0 0 0 3.6ZM3.7 20.4h3V9h-3v11.4ZM9 9v11.4h3v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2 1.9 2 3.4v6.2h3v-7c0-3.4-.7-5.9-4.5-5.9-1.8 0-3 .9-3.5 1.8h-.1V9H9Z" /></svg>;
  return <span aria-hidden="true" className="text-xs font-semibold">{label}</span>;
}

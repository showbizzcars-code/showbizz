import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { VehicleCard } from "@/components/site/vehicle-card";
import { BRAND_NAME, DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getHomeSnapshot } from "@/lib/showbizz/content";
import { sameAs, SOCIAL_LINKS } from "@/lib/showbizz/present";
import { documentHead, metaDescription, rentalBusinessLd } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/")({
  loader: () => getHomeSnapshot(),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: BRAND_NAME }] };
    return documentHead({
      title: BRAND_NAME,
      description: metaDescription("", DEFAULT_DESCRIPTION),
      path: "/",
      jsonLd: rentalBusinessLd(loaderData.origin, {
        publicPhone: loaderData.settings.publicPhone,
        publicEmail: loaderData.settings.publicEmail,
        address: loaderData.settings.address,
        sameAs: sameAs(loaderData.settings),
      }),
    });
  },
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="border-b border-line bg-[#101214]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-7 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c0c5cb]">{BRAND_NAME}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
            Find a car for your next journey.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Browse our cars, check the details, and send an enquiry. Our team will confirm availability
            and price with you. An enquiry does not book a car or take payment on this website.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/vehicles"
              className="inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              Browse cars
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-11 items-center rounded-control border border-line bg-surface px-5 text-sm font-medium"
            >
              Send an enquiry
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted">Follow us:</span>
            {SOCIAL_LINKS.map((profile) => (
              <a
                key={profile.label}
                className="underline underline-offset-4"
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-7">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl">Cars</h2>
          <Link to="/vehicles" className="text-sm underline">View all cars</Link>
        </div>
        {data.vehicles.length === 0 ? (
          <p className="mt-6 max-w-2xl text-muted">
            No cars are listed yet. The team will add car photos, details, availability, and daily prices here.
          </p>
        ) : (
          <div className="mt-6 grid gap-4">
            {data.vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-line bg-[#15181b]">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 md:grid-cols-3">
          {[
            ["01", "Browse cars", "Check the car details and choose what suits your journey."],
            ["02", "Send an enquiry", "Share your name, phone number, and travel dates."],
            ["03", "Confirm with our team", "Our team will reply and confirm availability and price."],
          ].map(([step, title, body]) => (
            <div key={step}>
              <p className="text-sm tabular-nums text-muted">{step}</p>
              <h2 className="mt-2 font-display text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">Customer reviews</h2>
          {data.testimonials.length === 0 ? (
            <p className="mt-4 text-muted">Customer reviews will appear here when added by the team.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.testimonials.map((item) => (
                <li key={item.quote} className="rounded-card border border-line bg-surface p-4">
                  <blockquote>
                    <p>{item.quote}</p>
                    <footer className="mt-3 text-sm text-muted">
                      {item.authorName}
                      {item.attribution ? ` · ${item.attribution}` : ""}
                    </footer>
                  </blockquote>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-display text-3xl">Questions</h2>
          {data.faqs.length === 0 ? (
            <p className="mt-4 text-muted">Answers to common questions will appear here when added.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.faqs.map((faq) => (
                <li key={faq.question}>
                  <h3 className="font-display text-xl">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link to="/faq" className="text-sm underline">View all questions</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}

import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/reveal";
import { SiteShell } from "@/components/site/shell";
import { VehicleCard } from "@/components/site/vehicle-card";
import { BRAND_NAME, DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getHomeSnapshot } from "@/lib/showbizz/content";
import { sameAs } from "@/lib/showbizz/present";
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

const clientPromoPoints = [
  "Zero depreciation 'Buy back offer'",
  "Monopoly business",
  "Iconic filmy car from KGF 2 & Jailer 2",
  "Massive fan following",
  "One year contract",
  "Excellent rental opportunities with filming firms, content creators, individual, videography, wedding and many more.",
  "Shared/Fixed rental share option.",
  "Cash based procurement only",
];

const PROMO_SRC = "/vehicle-sales-client-promo.mp4";

function HomepagePromoVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      el.preload = "metadata";
      el.src = PROMO_SRC;
      el.load();
      void el.play().catch(() => {});
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="block h-auto w-full bg-black object-contain"
      width={640}
      height={360}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Showbizz Cars vehicle partnership"
    />
  );
}

function Home() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="home-hero">
        <Reveal className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 md:min-h-[640px] md:grid-cols-[0.72fr_1.28fr] md:gap-8 md:py-14">
          <div className="max-w-xl md:py-10">
            <p className="eyebrow">Showbizz Cars / Bengaluru</p>
            <h1 className="mt-6 max-w-xl text-5xl leading-[0.94] sm:text-6xl md:text-7xl">Subscribe to <em>Luxury Cars.</em></h1>
            <h2 className="mt-6 max-w-xl text-2xl leading-tight sm:text-3xl">Invest in Your Business, Not in Car Ownership.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">Experience the convenience and prestige of driving a luxury car without making an outright vehicle purchase.</p>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted">Showbizz Cars offers monthly luxury-car rental and subscription-style arrangements for entrepreneurs, startup founders, corporate executives and automotive enthusiasts in Bengaluru.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/vehicles" className="button-quiet">Explore cars</Link></div>
          </div>
          <figure className="overflow-hidden rounded-card border border-white/10 bg-[#e8e6e1] shadow-[0_25px_80px_rgba(0,0,0,.32)]">
            <img src="/showbizz-luxury-hero.webp" alt="Black luxury sedan with luxury car rental and monthly subscription plans" className="block h-auto w-full" fetchPriority="high" />
          </figure>
        </Reveal>
        <div className="home-hero__rail"><span>The collection</span><span>Scroll to explore ↓</span></div>
      </section>

      <section className="border-b border-line bg-bg">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-14">
          <div className="overflow-hidden rounded-card border border-line bg-black">
            <HomepagePromoVideo />
          </div>
          <ul className="mt-5 grid gap-2.5 text-base font-semibold leading-7 text-[#f4f2ed] sm:text-lg">
            {clientPromoPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f4f2ed]" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
        <div className="section-heading"><div><p className="eyebrow">The collection</p><h2 className="mt-4 text-5xl sm:text-6xl">Choose your <em>next move.</em></h2></div><Link to="/vehicles" className="text-sm font-semibold uppercase tracking-[0.16em] text-muted hover:text-ink">View all cars <span aria-hidden>↗</span></Link></div>
        {data.vehicles.length === 0 ? <p className="mt-12 max-w-2xl text-muted">No cars are listed yet. The team will add the latest collection here.</p> : <div className="mt-14 grid gap-5 md:grid-cols-2">{data.vehicles.map((vehicle, index) => <Reveal key={vehicle.slug} delay={index * 80}><VehicleCard vehicle={vehicle} settings={data.settings} /></Reveal>)}</div>}
      </Reveal>

      <Reveal className="editorial-band">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow text-muted">A smarter way to drive</p>
            <h2 className="mt-4 text-5xl leading-[0.95] sm:text-6xl">Why Consider a <em>Monthly Subscription?</em></h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-card border border-line bg-surface p-6 sm:p-7">
              <h3 className="text-2xl text-[#f4f2ed]">Predictable Monthly Rental</h3>
              <p className="mt-3 leading-7 text-muted">Plan your vehicle expenses around an agreed monthly rental.</p>
            </article>
            <article className="rounded-card border border-line bg-surface p-6 sm:p-7">
              <h3 className="text-2xl text-[#f4f2ed]">Avoid the Purchase Commitment</h3>
              <p className="mt-3 leading-7 text-muted">Access a car without purchasing it outright or taking a vehicle loan yourself.</p>
            </article>
            <article className="rounded-card border border-line bg-surface p-6 sm:p-7">
              <h3 className="text-2xl text-[#f4f2ed]">Reduced Ownership Responsibilities</h3>
              <p className="mt-3 leading-7 text-muted">Maintenance and insurance may be included according to your selected vehicle and contract.</p>
            </article>
            <article className="rounded-card border border-line bg-surface p-6 sm:p-7">
              <h3 className="text-2xl text-[#f4f2ed]">Drive the Car That Suits Your Current Needs</h3>
              <p className="mt-3 leading-7 text-muted">Choose a suitable vehicle for your lifestyle, professional image or business requirements.</p>
            </article>
            <article className="rounded-card border border-line bg-surface p-6 sm:p-7 sm:col-span-2 lg:col-span-1">
              <h3 className="text-2xl text-[#f4f2ed]">Personalised Rental Plans</h3>
              <p className="mt-3 leading-7 text-muted">Discuss contract duration, mileage limits and available vehicle options with our team.</p>
            </article>
          </div>
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Simple process</p>
            <h2 className="mt-4 text-5xl leading-[0.95] sm:text-6xl">How It <em>Works</em></h2>
            <p className="mt-6 max-w-md leading-7 text-muted">Our team will guide you through the vehicle options, rental requirements and quotation before anything is confirmed.</p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            <li className="flex gap-5 py-5"><span className="eyebrow pt-1">01</span><p className="leading-7">Choose your preferred car.</p></li>
            <li className="flex gap-5 py-5"><span className="eyebrow pt-1">02</span><p className="leading-7">Share your rental duration and monthly mileage requirements.</p></li>
            <li className="flex gap-5 py-5"><span className="eyebrow pt-1">03</span><p className="leading-7">Complete the required identity, driving and eligibility verification.</p></li>
            <li className="flex gap-5 py-5"><span className="eyebrow pt-1">04</span><p className="leading-7">Review the quotation, deposit and agreement.</p></li>
            <li className="flex gap-5 py-5"><span className="eyebrow pt-1">05</span><p className="leading-7">Complete payment formalities and arrange delivery.</p></li>
          </ol>
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 md:pb-28">
        <div className="grid gap-8 rounded-card border border-line bg-surface p-7 sm:p-10 md:grid-cols-[0.75fr_1.25fr] md:items-center">
          <div>
            <p className="eyebrow">Clear terms</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">What Is <em>Included?</em></h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted">The exact inclusions depend on the vehicle and agreement. Your quotation will clearly identify the rental amount, security deposit, mileage allowance, maintenance, insurance, excess-kilometre charges and other applicable expenses.</p>
        </div>
      </Reveal>

      <Reveal className="editorial-band">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <p className="eyebrow text-muted">Your next drive</p>
          <div className="mt-5">
            <div>
              <h2 className="max-w-3xl text-5xl leading-[0.95] sm:text-7xl">Ready to <em>Subscribe?</em></h2>
              <p className="mt-6 max-w-2xl text-lg leading-7 text-muted">Tell us which car you want, how long you need it and how much you plan to drive.</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1fr] md:py-32"><div><p className="eyebrow">In their words</p><h2 className="mt-5 text-5xl sm:text-6xl">Good journeys<br /><em>stay with you.</em></h2></div><div className="space-y-5">{data.testimonials.length === 0 ? <p className="text-muted">Customer reviews will appear here when added by the team.</p> : data.testimonials.map((item) => <blockquote key={item.quote} className="quote-card"><p>“{item.quote}”</p><footer>{item.authorName}{item.attribution ? ` · ${item.attribution}` : ""}</footer></blockquote>)}<Link to="/testimonials" className="inline-block pt-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted hover:text-ink">Read all reviews <span aria-hidden>↗</span></Link></div></Reveal>
    </SiteShell>
  );
}

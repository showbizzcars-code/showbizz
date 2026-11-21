import { createFileRoute } from "@tanstack/react-router";
import { PartnershipEnquiryForm } from "@/components/site/partnership-enquiry-forms";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getContactPage } from "@/lib/showbizz/content";
import { documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/collaborate")({
  loader: () => getContactPage(),
  head: () =>
    documentHead({
      title: "Collaborate With Showbizz Cars",
      description: metaDescription(
        "Explore car business partnerships, vehicle acquisition and revenue-sharing opportunities, or content, creator, film and brand collaborations with Showbizz Cars.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/collaborate",
    }),
  component: CollaboratePage,
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

function CollaboratePage() {
  const data = Route.useLoaderData();

  return (
    <SiteShell settings={data.settings}>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(200,205,209,.14),transparent_38%),linear-gradient(130deg,#141719,#08090a_68%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <p className="eyebrow">Showbizz Cars / Partnerships</p>
          <div className="mt-6 grid gap-10 md:grid-cols-[1.2fr_.8fr] md:items-end">
            <div>
              <h1 className="max-w-5xl font-display text-5xl leading-[.94] sm:text-6xl md:text-7xl">
                Let's Build Something <em>Extraordinary.</em>
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-muted">
                Your Assets. Your Creativity. Our Automotive Network.
              </p>
            </div>
            <div className="max-w-xl border-l border-line pl-5 sm:pl-7">
              <p className="leading-7 text-muted">
                Partner with Showbizz Cars to explore luxury vehicle rental opportunities, content collaborations and innovative automotive business ventures.
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">
                Choose the path that best describes your idea. Each form records the partnership type with your enquiry so the team can distinguish vehicle business proposals from creative opportunities.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="overflow-hidden rounded-card border border-line bg-black">
              <video className="aspect-video w-full object-cover" src="/vehicle-sales-client-promo.mp4" autoPlay muted loop playsInline preload="metadata" aria-label="Showbizz Cars promotional video 1">
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="overflow-hidden rounded-card border border-line bg-black">
              <video className="aspect-video w-full object-cover" src="/collaboration-promo-02.mp4" autoPlay muted loop playsInline preload="metadata" aria-label="Showbizz Cars promotional video 2">
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="overflow-hidden rounded-card border border-line bg-black">
              <video className="aspect-video w-full object-cover" src="/collaboration-promo-03.mp4" autoPlay muted loop playsInline preload="metadata" aria-label="Showbizz Cars promotional video 3">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <ul className="mt-5 grid gap-2.5 text-base font-semibold leading-7 text-[#ff9a32] sm:text-lg">
            {clientPromoPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff8a00]" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <a href="#car-business-partnership" className="group rounded-card border border-line bg-white/[.035] p-6 transition hover:bg-white/[.07] sm:p-8">
              <p className="eyebrow">01 / Asset & fleet</p>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">Car Business Partnership</h2>
              <p className="mt-4 max-w-xl leading-7 text-muted">
                Considering purchasing a recommended vehicle for rental deployment? Explore a possible revenue-sharing partnership, fixed rental arrangement or an initial business discussion.
              </p>
              <span className="mt-7 inline-flex items-center text-sm font-bold text-[#ff8a00] underline decoration-[#ff8a00]/60 underline-offset-4 transition-colors group-hover:text-[#ffb45c]">Discuss a vehicle partnership <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span></span>
            </a>
            <a href="#content-partnership" className="group rounded-card border border-line bg-white/[.035] p-6 transition hover:bg-white/[.07] sm:p-8">
              <p className="eyebrow">02 / Content & creativity</p>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">Content Collaboration</h2>
              <p className="mt-4 max-w-xl leading-7 text-muted">
                For automotive creators, influencers, filmmakers, production houses, agencies and brands interested in campaigns, shoots or automotive experiences.
              </p>
              <span className="mt-7 inline-flex items-center text-sm font-bold text-[#ff8a00] underline decoration-[#ff8a00]/60 underline-offset-4 transition-colors group-hover:text-[#ffb45c]">Pitch a creative collaboration <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span></span>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-start">
          <div>
            <p className="eyebrow">01 / Car business partnership</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Turn a vehicle idea into a considered business proposal.</h2>
          </div>
          <div className="space-y-5 leading-7 text-muted">
            <p>
              This path is for people considering acquiring a recommended car specifically for possible deployment through the Showbizz Cars rental network. Tell us your indicative budget, preferred model and the type of arrangement you want to discuss.
            </p>
            <p>
              Any proposed revenue share or fixed rental arrangement depends on the final commercial model, vehicle suitability, demand, operating expenses and a signed agreement. No return, rental volume or income is guaranteed by making an enquiry.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <article className="rounded-card border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Option A</p>
            <h3 className="mt-3 font-display text-2xl">Revenue Sharing</h3>
            <p className="mt-3 text-sm leading-6 text-muted">Discuss how rental revenue, allowable expenses, deductions and partner payouts could be calculated and reported.</p>
          </article>
          <article className="rounded-card border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Option B</p>
            <h3 className="mt-3 font-display text-2xl">Fixed Rental</h3>
            <p className="mt-3 text-sm leading-6 text-muted">Discuss whether a fixed rental arrangement is viable for a specific vehicle under agreed contract terms.</p>
          </article>
          <article className="rounded-card border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Option C</p>
            <h3 className="mt-3 font-display text-2xl">Business Guidance</h3>
            <p className="mt-3 text-sm leading-6 text-muted">Start with a conversation about vehicle choice, use cases, demand assumptions and operating responsibilities.</p>
          </article>
        </div>
        <div className="mt-8 rounded-card border border-line p-5 sm:p-7">
          <h3 className="font-display text-2xl">What should be agreed before committing?</h3>
          <p className="mt-3 max-w-4xl leading-7 text-muted">
            Vehicle ownership and financing, commercial-use insurance, registration restrictions, maintenance, downtime, damage, taxes, other operating costs, revenue calculations, reporting, payout timing, contract termination and vehicle return should all be reviewed and documented. Do not purchase or finance a vehicle solely on the assumption of guaranteed rental income.
          </p>
        </div>
      </section>

      <section id="car-business-partnership" className="scroll-mt-28 border-y border-line bg-[linear-gradient(135deg,rgba(255,255,255,.025),transparent)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[.7fr_1.3fr] md:py-24">
          <div>
            <p className="eyebrow">Enquiry 01</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Partner on the vehicle side.</h2>
            <p className="mt-5 leading-7 text-muted">
              Share your indicative vehicle budget and preferred commercial structure. The team can review the enquiry and discuss next steps.
            </p>
          </div>
          <PartnershipEnquiryForm kind="car-business" settings={data.settings} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-start">
          <div>
            <p className="eyebrow">02 / Content & creative partnership</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Make room for a great automotive story.</h2>
          </div>
          <div className="space-y-5 leading-7 text-muted">
            <p>
              We welcome proposals from automotive creators, influencers, filmmakers, production houses, agencies and brands who have an idea for distinctive content or a campaign connected to cars and premium mobility.
            </p>
            <p>
              Share your concept, channels or portfolio, intended audience and the kind of collaboration you have in mind. Vehicle access, campaign deliverables, usage rights, timing, expenses and commercial terms are subject to separate review and written agreement.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Creators & influencers", "Automotive storytelling, reviews and social-first content proposals."],
            ["Film & production", "Vehicle requirements for film, advertisements, music videos and shoots."],
            ["Brands & agencies", "Co-branded campaigns, product storytelling and promotional projects."],
            ["Events & experiences", "Ideas for automotive events, showcases and considered brand experiences."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-card border border-line bg-surface p-5">
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="content-partnership" className="scroll-mt-28 border-y border-line bg-[linear-gradient(135deg,rgba(255,255,255,.025),transparent)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[.7fr_1.3fr] md:py-24">
          <div>
            <p className="eyebrow">Enquiry 02</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Share your creative proposal.</h2>
            <p className="mt-5 leading-7 text-muted">
              Send the idea and the right context. Your form submission is saved as a separate, clearly labelled content partnership enquiry.
            </p>
          </div>
          <PartnershipEnquiryForm kind="content" settings={data.settings} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <p className="max-w-4xl text-xs leading-6 text-muted">
          All proposals are subject to suitability review, availability where relevant, due diligence and written terms. The website does not make an investment offer or promise revenue, returns, project acceptance or vehicle availability.
        </p>
      </section>
    </SiteShell>
  );
}

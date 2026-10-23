import { createFileRoute } from "@tanstack/react-router";
import { HostCarEnquiryForm } from "@/components/site/host-car-enquiry-form";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getContactPage } from "@/lib/showbizz/content";
import { enquiryWhatsAppHref } from "@/lib/showbizz/present";
import { documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/host-my-car")({
  loader: () => getContactPage(),
  head: () =>
    documentHead({
      title: "Host my car",
      description: metaDescription(
        "Explore a structured vehicle partnership with Showbizz Cars and submit your vehicle details for review.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/host-my-car",
    }),
  component: HostMyCarPage,
});

const partnershipBenefits = [
  {
    title: "Fixed Monthly Rental Opportunities",
    description: "Discuss a fixed rental amount for an eligible vehicle under an agreed contract.",
  },
  {
    title: "Potential Access to Business Demand",
    description: "Vehicles may be considered for corporate requirements, long-term rentals, media projects and other approved use cases.",
  },
  {
    title: "Defined Contractual Terms",
    description: "Agree on rental duration, payment schedules, mileage, maintenance, insurance and responsibilities before onboarding.",
  },
  {
    title: "Professional Coordination",
    description: "Discuss vehicle requirements, documentation, operational arrangements and servicing responsibilities with our team.",
  },
];

const partnershipSteps = [
  "Submit your vehicle details.",
  "Share ownership documents and vehicle photographs.",
  "Allow the team to assess the vehicle and suitability.",
  "Review the proposed rental, duration, deposit or other financial terms, and vehicle usage conditions.",
  "Sign the agreement before the vehicle is deployed.",
];

const vehicleRequirements = [
  "Brand and model",
  "Year of manufacture",
  "Fuel type: petrol, diesel, EV or hybrid",
  "Transmission: automatic or manual",
  "Current odometer reading",
  "State of registration",
  "Vehicle photographs",
];

function HostMyCarPage() {
  const data = Route.useLoaderData();
  const whatsAppHref = enquiryWhatsAppHref(data.settings);

  return (
    <SiteShell settings={data.settings}>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(190,196,201,.12),transparent_40%),linear-gradient(130deg,rgba(255,255,255,.025),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <p className="eyebrow">Partner with Showbizz Cars</p>
          <div className="mt-5 grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-end">
            <div>
              <h1 className="max-w-4xl font-display text-5xl leading-[.95] sm:text-6xl md:text-7xl">
                Turn Your Luxury Car Into an <em>Income Opportunity.</em>
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-muted">
                Your Car. A Rental Opportunity. A Structured Partnership.
              </p>
            </div>
            <div className="max-w-xl border-l border-line pl-5 sm:pl-7">
              <p className="leading-7">
                Do you own a premium or luxury vehicle that could be suitable for corporate, media or long-term rental requirements?
              </p>
              <p className="mt-4 leading-7 text-muted">
                Showbizz Cars invites eligible vehicle owners to explore partnership opportunities through agreed rental arrangements.
              </p>
              <p className="mt-4 leading-7 text-muted">
                Our objective is to connect suitable vehicles with relevant rental demand while establishing clear commercial terms and responsibilities.
              </p>
              <a href="#list-your-car" className="button-primary mt-7 inline-flex">
                List Your Car <span className="ml-2" aria-hidden="true">↘</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">01 / The opportunity</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Why Explore a Partnership With Showbizz Cars?</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {partnershipBenefits.map((benefit, index) => (
            <article key={benefit.title} className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted">0{index + 1} / Partnership</p>
              <h3 className="mt-4 font-display text-2xl sm:text-3xl">{benefit.title}</h3>
              <p className="mt-3 leading-7 text-muted">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-band">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:py-24">
          <div>
            <p className="eyebrow text-muted">02 / From enquiry to agreement</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">How the Partnership Works</h2>
            <p className="mt-5 max-w-md leading-7 text-muted">
              Every vehicle is reviewed for suitability. Commercial terms and permitted use are discussed before onboarding.
            </p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {partnershipSteps.map((step, index) => (
              <li key={step} className="flex gap-5 py-5">
                <span className="eyebrow pt-1">0{index + 1}</span>
                <p className="leading-7">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="eyebrow">03 / Prepare your details</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">What We Need From You</h2>
            <p className="mt-5 leading-7 text-muted">
              To begin the review, share your vehicle details and add photos so our team can assess its suitability.
            </p>
            <a href="#list-your-car" className="mt-7 inline-flex min-h-11 items-center rounded-control border border-line px-5 text-sm font-semibold hover:bg-surface">
              Submit your vehicle details <span className="ml-2" aria-hidden="true">↘</span>
            </a>
          </div>
          <ul className="space-y-4 rounded-card border border-line bg-surface p-6 sm:p-8">
            {vehicleRequirements.map((item) => (
              <li key={item} className="flex gap-3 leading-6">
                <span className="text-muted" aria-hidden="true">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="editorial-band">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow text-muted">04 / Start a conversation</p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl">Explore Your Vehicle's Potential.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-muted">
                Submit your details to discuss whether your car is suitable for the Showbizz Cars network.
              </p>
            </div>
            <a href="#list-your-car" className="button-primary inline-flex w-fit">
              List Your Car <span className="ml-2" aria-hidden="true">↘</span>
            </a>
          </div>
          <p className="mt-8 max-w-4xl border-t border-line pt-5 text-xs leading-6 text-muted">
            Rental income is governed by the signed agreement and is not guaranteed merely by submitting a vehicle. Insurance coverage, permitted commercial use, maintenance, operational costs and vehicle-return conditions must be agreed and verified before onboarding.
          </p>
        </div>
      </section>

      <section id="list-your-car" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-16 sm:px-8 md:py-24">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow">05 / List your car</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Submit your vehicle for review.</h2>
          <p className="mt-4 leading-7 text-muted">
            Complete the form below. Your details are saved as an enquiry for the team, and you can then continue to WhatsApp to send the same information directly.
          </p>
        </div>
        <div className="max-w-4xl">
          <HostCarEnquiryForm whatsAppHref={whatsAppHref} />
        </div>
      </section>
    </SiteShell>
  );
}

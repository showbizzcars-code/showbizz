import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getContactPage } from "@/lib/showbizz/content";
import { documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/designing-customization")({
  loader: () => getContactPage(),
  head: () => documentHead({
    title: "Designing & customization",
    description: metaDescription("Discuss custom car styling, design concepts, and vehicle customization with Showbizz Cars.", DEFAULT_DESCRIPTION),
    path: "/designing-customization",
  }),
  component: DesigningCustomizationPage,
});

function DesigningCustomizationPage() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <p className="eyebrow">Design it differently</p>
        <h1 className="mt-5 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">A vision worth driving. <em>Made personal.</em></h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">Have a specific look or transformation in mind? Tell us about your ideas for exterior styling, interiors, or a custom build. We can discuss the concept, feasibility, and suitable design approach with you.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <article className="rounded-card border border-line bg-surface p-6"><p className="eyebrow">01 / Concept</p><h2 className="mt-4 text-2xl">Start with an idea</h2><p className="mt-3 text-sm leading-6 text-muted">Share references, your goals, and the character you want your car to have.</p></article>
          <article className="rounded-card border border-line bg-surface p-6"><p className="eyebrow">02 / Design</p><h2 className="mt-4 text-2xl">Explore possibilities</h2><p className="mt-3 text-sm leading-6 text-muted">Discuss visual concepts and available design previews before committing to work.</p></article>
          <article className="rounded-card border border-line bg-surface p-6"><p className="eyebrow">03 / Next steps</p><h2 className="mt-4 text-2xl">Review the details</h2><p className="mt-3 text-sm leading-6 text-muted">Scope, timings, and pricing are discussed directly after reviewing your brief.</p></article>
        </div>
        <Link to="/contact" className="button-primary mt-10">Discuss a custom design <span aria-hidden>↗</span></Link>
      </section>
    </SiteShell>
  );
}

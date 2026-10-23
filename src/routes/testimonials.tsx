import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { listPublishedTestimonials } from "@/lib/showbizz/content";
import { documentHead, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/testimonials")({
  loader: () => listPublishedTestimonials(),
  head: () =>
    documentHead({
      title: "Testimonials",
      description: metaDescription(
        "Testimonials published by Showbizz Cars. None are shown until the team publishes them.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/testimonials",
    }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-display text-4xl">Testimonials</h1>
        {data.testimonials.length === 0 ? (
          <p className="mt-4 text-muted">No testimonials are published.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {data.testimonials.map((item) => (
              <li key={`${item.authorName}-${item.quote}`} className="rounded-card border border-line bg-surface p-4">
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
      </section>
    </SiteShell>
  );
}

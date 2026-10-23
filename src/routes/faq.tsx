import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { listPublishedFaqs } from "@/lib/showbizz/content";
import { documentHead, faqJsonLd, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/faq")({
  loader: () => listPublishedFaqs(),
  head: ({ loaderData }) =>
    documentHead({
      title: "Questions",
      description: metaDescription(
        "Questions Showbizz Cars has chosen to publish. Unpublished answers stay off this page.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/faq",
      jsonLd: loaderData && loaderData.faqs.length > 0 ? faqJsonLd(loaderData.faqs) : undefined,
    }),
  component: FaqPage,
});

function FaqPage() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-display text-4xl">Questions</h1>
        <p className="mt-4 text-muted">
          Only answers the team has published are listed. Booking rules are not invented here.
        </p>
        {data.faqs.length === 0 ? (
          <p className="mt-8 text-muted">No questions are published yet.</p>
        ) : (
          <dl className="mt-8 space-y-8">
            {data.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-display text-2xl">{faq.question}</dt>
                <dd className="mt-2 whitespace-pre-wrap text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </SiteShell>
  );
}

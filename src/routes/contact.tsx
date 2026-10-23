import { createFileRoute } from "@tanstack/react-router";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { SiteShell } from "@/components/site/shell";
import { BRAND_NAME, DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getContactPage } from "@/lib/showbizz/content";
import { enquiryWhatsAppHref, sameAs } from "@/lib/showbizz/present";
import { mailtoHref, telHref } from "@/lib/showbizz/settings";
import { documentHead, metaDescription, rentalBusinessLd } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/contact")({
  loader: () => getContactPage(),
  head: ({ loaderData }) =>
    documentHead({
      title: "Contact",
      description: metaDescription(
        "Send a booking enquiry to Showbizz Cars. The form does not confirm a reservation.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/contact",
      jsonLd: loaderData
        ? rentalBusinessLd(loaderData.origin, {
            publicPhone: loaderData.settings.publicPhone,
            publicEmail: loaderData.settings.publicEmail,
            address: loaderData.settings.address,
            sameAs: sameAs(loaderData.settings),
          })
        : undefined,
    }),
  component: ContactPage,
});

function ContactPage() {
  const data = Route.useLoaderData();
  const phone = telHref(data.settings.publicPhone);
  const email = mailtoHref(data.settings.publicEmail);
  const whatsApp = enquiryWhatsAppHref(data.settings);
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl">Contact</h1>
          <p className="mt-4 text-muted">
            Use the form to save an enquiry for {BRAND_NAME}. A person replies. The website will not
            confirm the car or take a payment.
          </p>
          <div className="mt-8 text-sm">
            {data.settings.address ? (
              <p className="whitespace-pre-wrap">{data.settings.address}</p>
            ) : (
              <p className="text-muted">Address is not published yet.</p>
            )}
            {phone && data.settings.publicPhone ? (
              <p className="mt-3">
                <a className="underline" href={phone}>
                  {data.settings.publicPhone}
                </a>
              </p>
            ) : (
              <p className="mt-3 text-muted">Phone is not published yet.</p>
            )}
            {email && data.settings.publicEmail ? (
              <p className="mt-3">
                <a className="underline" href={email}>
                  {data.settings.publicEmail}
                </a>
              </p>
            ) : (
              <p className="mt-3 text-muted">Email is not published yet.</p>
            )}
            {whatsApp ? (
              <p className="mt-3">
                <a className="underline" href={whatsApp} rel="noreferrer">
                  WhatsApp
                </a>
              </p>
            ) : (
              <p className="mt-3 text-muted">WhatsApp is not published yet.</p>
            )}
          </div>
        </div>
        <EnquiryForm whatsAppHref={whatsApp} />
      </section>
    </SiteShell>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { SiteShell } from "@/components/site/shell";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { getPublishedVehicle } from "@/lib/showbizz/content";
import { enquiryWhatsAppHref, vehicleWhatsAppHref } from "@/lib/showbizz/present";
import { documentHead, metaDescription, vehicleJsonLd } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/vehicles/$slug")({
  loader: async ({ params }) => {
    const data = await getPublishedVehicle({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Car" }] };
    const { vehicle, origin } = loaderData;
    return documentHead({
      title: vehicle.title,
      description: metaDescription(vehicle.summary || vehicle.description, DEFAULT_DESCRIPTION),
      path: `/vehicles/${vehicle.slug}`,
      jsonLd: vehicleJsonLd(vehicle, origin ? `${origin}/vehicles/${vehicle.slug}` : null),
    });
  },
  notFoundComponent: VehicleMissing,
  component: VehiclePage,
});

function availabilityLabel(value: "available" | "unavailable" | "on_request"): string {
  if (value === "available") return "Available";
  if (value === "on_request") return "On request";
  return "Not available";
}

function VehiclePage() {
  const data = Route.useLoaderData();
  const { vehicle } = data;
  const whatsAppHref = vehicleWhatsAppHref(data.settings, vehicle.title);
  const specs = [
    ["Category", vehicle.category],
    ["Seats", vehicle.seats ? String(vehicle.seats) : null],
    ["Year", vehicle.modelYear ? String(vehicle.modelYear) : null],
    [
      "Transmission",
      vehicle.transmission === "automatic" ? "Automatic" : vehicle.transmission === "manual" ? "Manual" : null,
    ],
    ["Fuel", vehicle.fuel],
    ["Availability", vehicle.catalogOnly ? "Details to be confirmed" : availabilityLabel(vehicle.availability)],
    ["Daily rate", vehicle.dailyRateLabel],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <SiteShell settings={data.settings}>
      <article className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-sm">
          <Link to="/vehicles" className="underline">Our cars</Link>
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">{vehicle.title}</h1>
        <div className="mt-5">
          {whatsAppHref ? (
            <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg hover:opacity-90">
              Enquire about this car on WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
            </a>
          ) : (
            <p className="text-sm text-muted">WhatsApp enquiry is not configured yet. <Link to="/contact" className="underline">Contact the team</Link>.</p>
          )}
        </div>
        {vehicle.summary ? <p className="mt-4 max-w-2xl text-lg text-muted">{vehicle.summary}</p> : null}
        <p className="mt-4 text-sm text-muted">
          {vehicle.catalogOnly
            ? "This model was requested for the catalogue. Current availability has not been confirmed."
            : "Availability is entered by the team. It can change before anyone replies."}
        </p>
        {vehicle.availabilityNote ? <p className="mt-2 text-sm">{vehicle.availabilityNote}</p> : null}

        {vehicle.images.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Photos will be added here by the team.</p>
        ) : (
          <ul className="mt-8 grid gap-4">
            {vehicle.images.map((image) => (
              <li key={`${image.sortOrder}-${image.alt}`} className="rounded-card border border-line bg-surface p-4">
                {image.url ? (
                  <img src={image.url} alt={image.alt} className="w-full rounded-control" />
                ) : (
                  <p className="text-sm text-muted">
                    A photo is on file ({image.alt}), but public image hosting is not configured.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {specs.length > 0 ? (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {specs.map(([label, value]) => (
              <div key={label} className="border-t border-line pt-3">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {vehicle.description ? (
          <div className="mt-8 max-w-2xl whitespace-pre-wrap">{vehicle.description}</div>
        ) : null}

        {vehicle.catalogOnly ? (
          <p className="mt-10 max-w-2xl text-sm text-muted">
            Vehicle-specific booking enquiries will be enabled when the team completes this listing. You can ask about this model using WhatsApp above.
          </p>
        ) : (
          <div className="mt-10 max-w-2xl">
            <EnquiryForm
              vehicleSlug={vehicle.slug}
              whatsAppHref={enquiryWhatsAppHref(data.settings, vehicle.title)}
            />
          </div>
        )}
      </article>
    </SiteShell>
  );
}

function VehicleMissing() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-display text-4xl">This car is not listed</h1>
        <p className="mt-4 text-muted">It may be a draft, archived, or the link may be incorrect.</p>
        <p className="mt-6">
          <Link to="/vehicles" className="underline">Back to our cars</Link>
        </p>
      </section>
    </SiteShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { VehicleCard } from "@/components/site/vehicle-card";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { listCarsPage } from "@/lib/showbizz/content";
import { documentHead, itemListJsonLd, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/vehicles/")({
  loader: () => listCarsPage(),
  head: ({ loaderData }) =>
    documentHead({
      title: "Cars",
      description: metaDescription(
        "Cars listed by Showbizz Cars, with availability entered by the team.",
        DEFAULT_DESCRIPTION,
      ),
      path: "/vehicles",
      jsonLd:
        loaderData && loaderData.vehicles.length > 0
          ? itemListJsonLd(
              "Showbizz Cars",
              loaderData.vehicles.map((vehicle) => ({
                title: vehicle.title,
                path: `/vehicles/${vehicle.slug}`,
              })),
              loaderData.origin,
            )
          : undefined,
    }),
  component: CarsPage,
});

function CarsPage() {
  const data = Route.useLoaderData();
  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted">The collection / {data.vehicles.length} models</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Our cars</h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Explore the client-requested models. Photos, specifications, prices and live availability appear only when confirmed by the Showbizz Cars team.
            </p>
          </div>
          <p className="max-w-sm text-sm text-muted">Need a subscription quote? Enquire with our team and confirm the details directly.</p>
        </div>
        {data.vehicles.length === 0 ? (
          <p className="mt-8 text-muted">No vehicle models are currently listed.</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} settings={data.settings} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

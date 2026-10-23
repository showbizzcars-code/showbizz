import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/shell";
import { VehicleCard } from "@/components/site/vehicle-card";
import { DEFAULT_DESCRIPTION } from "@/lib/showbizz/brand";
import { listPublishedVehicles } from "@/lib/showbizz/content";
import { documentHead, itemListJsonLd, metaDescription } from "@/lib/showbizz/seo";

export const Route = createFileRoute("/vehicles/")({
  loader: () => listPublishedVehicles(),
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
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="font-display text-4xl">Our cars</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Check the car details and listed prices. Our team updates availability and will confirm it when you enquire.
        </p>
        {data.vehicles.length === 0 ? (
          <p className="mt-8 text-muted">No cars are listed yet. Please check again soon.</p>
        ) : (
          <div className="mt-8 grid gap-4">
            {data.vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

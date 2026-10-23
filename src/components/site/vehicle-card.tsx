import { Link } from "@tanstack/react-router";
import type { PublicVehicleCard } from "@/lib/showbizz/content";

function availabilityLabel(value: PublicVehicleCard["availability"]): string {
  if (value === "available") return "Available";
  if (value === "on_request") return "On request";
  return "Not available";
}

export function VehicleCard({ vehicle }: { vehicle: PublicVehicleCard }) {
  const facts = [
    vehicle.category,
    vehicle.seats ? `${vehicle.seats} seats` : null,
    vehicle.transmission === "automatic" ? "Automatic" : vehicle.transmission === "manual" ? "Manual" : null,
    vehicle.modelYear ? String(vehicle.modelYear) : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">
          <Link to="/vehicles/$slug" params={{ slug: vehicle.slug }} className="underline-offset-4 hover:underline">
            {vehicle.title}
          </Link>
        </h2>
        <p className="text-sm text-muted">{availabilityLabel(vehicle.availability)}</p>
      </div>
      {vehicle.summary ? <p className="mt-3 text-sm text-muted">{vehicle.summary}</p> : null}
      {facts.length > 0 ? <p className="mt-3 text-sm">{facts.join(" · ")}</p> : null}
      <p className="mt-4 text-sm tabular-nums">
        {vehicle.dailyRateLabel ? `${vehicle.dailyRateLabel} published daily rate` : "Daily rate not published"}
      </p>
    </article>
  );
}

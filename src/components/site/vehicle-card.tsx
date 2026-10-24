import { Link } from "@tanstack/react-router";
import type { PublicVehicleCard } from "@/lib/showbizz/content";
import { vehicleWhatsAppHref } from "@/lib/showbizz/present";
import type { PublicSettings } from "@/lib/showbizz/settings";

function availabilityLabel(value: PublicVehicleCard["availability"]): string {
  if (value === "available") return "Available";
  if (value === "on_request") return "On request";
  return "Not available";
}

export function VehicleCard({
  vehicle,
  settings,
}: {
  vehicle: PublicVehicleCard;
  settings?: PublicSettings;
}) {
  const facts = [
    vehicle.category,
    vehicle.seats ? `${vehicle.seats} seats` : null,
    vehicle.transmission === "automatic" ? "Automatic" : vehicle.transmission === "manual" ? "Manual" : null,
    vehicle.modelYear ? String(vehicle.modelYear) : null,
    vehicle.fuel,
  ].filter((fact): fact is string => Boolean(fact));
  const whatsAppHref = settings ? vehicleWhatsAppHref(settings, vehicle.title) : null;

  return (
    <article className="card-lift overflow-hidden rounded-card border border-line bg-surface">
      <Link to="/vehicles/$slug" params={{ slug: vehicle.slug }} className="group block">
        <div className="vehicle-card__media">
          {vehicle.imageUrl ? (
            <img src={vehicle.imageUrl} alt={vehicle.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-end bg-[radial-gradient(circle_at_70%_20%,#a9abad,transparent_28%),linear-gradient(135deg,#202326,#747879)] p-5">
              <span className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">Showbizz Cars</span>
            </div>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl group-hover:text-[#c9ccca]">{vehicle.title}</h2>
            <p className="text-xs uppercase tracking-[.13em] text-muted">{availabilityLabel(vehicle.availability)}</p>
          </div>
          {vehicle.summary ? <p className="mt-3 max-w-xl text-sm text-muted">{vehicle.summary}</p> : null}
          {facts.length > 0 ? <p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-muted">{facts.join(" · ")}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm tabular-nums">{vehicle.dailyRateLabel ? `${vehicle.dailyRateLabel} / day` : "Price on enquiry"}</p>
            <span className="text-xl text-muted" aria-hidden="true">↗</span>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
        <Link to="/vehicles/$slug" params={{ slug: vehicle.slug }} className="inline-flex min-h-11 items-center rounded-control border border-line px-4 text-sm font-medium hover:bg-line/30">
          View details
        </Link>
        {whatsAppHref ? (
          <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90">
            Enquire on WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="text-xs text-muted">WhatsApp enquiry is not configured yet.</p>
        )}
      </div>
    </article>
  );
}

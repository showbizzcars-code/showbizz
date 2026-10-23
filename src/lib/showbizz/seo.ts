import { BRAND_NAME } from "./brand.ts";

export function metaDescription(text: string, fallback: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const source = clean || fallback;
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trimEnd()}…`;
}

export function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&" + "apos;")
}

function assertOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Sitemap origin must be http or https.");
  }
  if (url.username || url.password) throw new Error("Sitemap origin must not include credentials.");
  return url.origin;
}

export function buildSitemapXml(
  origin: string,
  entries: { loc: string; lastmod?: string | null }[],
): string {
  const base = assertOrigin(origin);
  const body = entries
    .map((entry) => {
      if (!entry.loc.startsWith("/")) throw new Error("Sitemap paths must start with /.");
      const loc = `${base}${entry.loc}`;
      const lastmod =
        entry.lastmod && /^\d{4}-\d{2}-\d{2}/.test(entry.lastmod)
          ? `<lastmod>${xmlEscape(entry.lastmod.slice(0, 10))}</lastmod>`
          : "";
      return `<url><loc>${xmlEscape(loc)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildRobotsTxt(origin: string): string {
  const base = assertOrigin(origin);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /login",
    "Disallow: /api/",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
}

type HeadMeta = { title: string } | { name: string; content: string };

export function documentHead(opts: {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}) {
  if (!opts.path.startsWith("/")) throw new Error("Canonical path must start with /.");
  const title = opts.title === BRAND_NAME ? BRAND_NAME : `${opts.title} · ${BRAND_NAME}`;
  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: opts.description },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  return {
    meta,
    links: [{ rel: "canonical", href: opts.path }],
    scripts: opts.jsonLd
      ? [{ type: "application/ld+json", children: JSON.stringify(opts.jsonLd) }]
      : undefined,
  };
}

export function rentalBusinessLd(origin: string | null, settings: {
  publicPhone: string | null;
  publicEmail: string | null;
  address: string | null;
  sameAs: string[];
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: BRAND_NAME,
  };
  if (origin) data.url = `${origin}/`;
  if (settings.publicPhone) data.telephone = settings.publicPhone;
  if (settings.publicEmail) data.email = settings.publicEmail;
  if (settings.address) {
    data.address = { "@type": "PostalAddress", streetAddress: settings.address };
  }
  if (settings.sameAs.length > 0) data.sameAs = settings.sameAs;
  return data;
}

export function availabilityLd(availability: "available" | "unavailable" | "on_request"): string {
  if (availability === "available") return "https://schema.org/InStock";
  if (availability === "unavailable") return "https://schema.org/OutOfStock";
  return "https://schema.org/LimitedAvailability";
}

export function vehicleJsonLd(
  vehicle: {
    title: string;
    summary: string;
    description: string;
    seats: number | null;
    modelYear: number | null;
    transmission: string | null;
    fuel: string | null;
    availability: "available" | "unavailable" | "on_request";
    price: { currency: string; amount: string } | null;
    images: { url: string | null }[];
  },
  pageUrl: string | null,
) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.title,
    description: vehicle.summary || vehicle.description || vehicle.title,
  };
  if (pageUrl) data.url = pageUrl;
  if (vehicle.seats) data.vehicleSeatingCapacity = vehicle.seats;
  if (vehicle.modelYear) data.vehicleModelDate = String(vehicle.modelYear);
  if (vehicle.transmission) data.vehicleTransmission = vehicle.transmission;
  if (vehicle.fuel) data.fuelType = vehicle.fuel;
  const images = vehicle.images.map((image) => image.url).filter((url): url is string => Boolean(url));
  if (images.length > 0) data.image = images;
  if (vehicle.price) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: vehicle.price.currency,
      price: vehicle.price.amount,
      availability: availabilityLd(vehicle.availability),
    };
  }
  return data;
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  excerpt: string;
  publishedOn: string | null;
}, pageUrl: string | null) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    publisher: { "@type": "Organization", name: BRAND_NAME },
  };
  if (pageUrl) data.url = pageUrl;
  if (post.publishedOn) data.datePublished = post.publishedOn;
  return data;
}

export function itemListJsonLd(name: string, items: { title: string; path: string }[], origin: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: origin ? `${origin}${item.path}` : item.path,
    })),
  };
}

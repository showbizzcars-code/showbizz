import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { ENQUIRY_HOURLY_LIMIT, ENQUIRY_IP_HOURLY_LIMIT } from "./brand.ts";
import { formatDailyRate } from "./money.ts";
import {
  EMPTY_SETTINGS,
  publicSettingsFromRows,
  type PublicSettings,
} from "./settings.ts";
import {
  PUBLIC_FAQ_SQL,
  PUBLIC_POST_BY_SLUG_SQL,
  PUBLIC_POST_LIST_SQL,
  PUBLIC_SETTINGS_SQL,
  PUBLIC_SITEMAP_POSTS_SQL,
  PUBLIC_SITEMAP_VEHICLES_SQL,
  PUBLIC_TESTIMONIAL_SQL,
  PUBLIC_VEHICLE_BY_SLUG_SQL,
  PUBLIC_VEHICLE_IMAGES_SQL,
  PUBLIC_VEHICLE_LIST_SQL,
} from "./sql.ts";
import { isStaffRole, type StaffRole } from "./access.ts";
import { parseEnquiry, parseSlug } from "./validate.ts";

export type Availability = "available" | "unavailable" | "on_request";

export type PublicVehicleCard = {
  slug: string;
  title: string;
  summary: string;
  category: string | null;
  seats: number | null;
  modelYear: number | null;
  transmission: "automatic" | "manual" | null;
  fuel: string | null;
  availability: Availability;
  availabilityNote: string | null;
  dailyRateLabel: string | null;
  price: { currency: string; amount: string } | null;
};

export type PublicVehicleImage = {
  alt: string;
  url: string | null;
  sortOrder: number;
};

export type PublicVehicleDetail = PublicVehicleCard & {
  description: string;
  images: PublicVehicleImage[];
};

export type PublicFaq = { question: string; answer: string };
export type PublicTestimonial = {
  authorName: string;
  quote: string;
  attribution: string | null;
};
export type PublicPostCard = {
  slug: string;
  title: string;
  excerpt: string;
  publishedOn: string | null;
};
export type PublicPostDetail = PublicPostCard & {
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type EnquiryResult = { ok: true; id: string } | { ok: false; error: string };

export type AdminOverview = {
  userId: string;
  role: StaffRole | null;
  database: "preview" | "hosted";
  counts: {
    vehicles: number;
    publishedVehicles: number;
    newEnquiries: number;
    posts: number;
    faqs: number;
    testimonials: number;
  } | null;
};

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function textOrNull(value: unknown): string | null {
  const next = text(value).trim();
  return next ? next : null;
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function day(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function availabilityOf(value: unknown): Availability {
  if (value === "available" || value === "unavailable" || value === "on_request") return value;
  return "unavailable";
}

function transmissionOf(value: unknown): "automatic" | "manual" | null {
  if (value === "automatic" || value === "manual") return value;
  return null;
}

function rateParts(minor: unknown, currency: unknown): {
  dailyRateLabel: string | null;
  price: { currency: string; amount: string } | null;
} {
  const amount = intOrNull(minor);
  const code = textOrNull(currency);
  if (amount == null || !code) return { dailyRateLabel: null, price: null };
  const dailyRateLabel = formatDailyRate(amount, code);
  if (!dailyRateLabel) return { dailyRateLabel: null, price: null };
  return { dailyRateLabel, price: { currency: code, amount: (amount / 100).toFixed(2) } };
}

function cardFromRow(row: Record<string, unknown>): PublicVehicleCard {
  const note = text(row.availability_note).trim();
  return {
    slug: text(row.slug),
    title: text(row.title),
    summary: text(row.summary),
    category: textOrNull(row.category),
    seats: intOrNull(row.seats),
    modelYear: intOrNull(row.model_year),
    transmission: transmissionOf(row.transmission),
    fuel: textOrNull(row.fuel),
    availability: availabilityOf(row.availability),
    availabilityNote: note || null,
    ...rateParts(row.daily_rate_minor, row.currency_code),
  };
}

async function sqlClient() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function readSettings(): Promise<PublicSettings> {
  const sql = await sqlClient();
  const rows = await sql.query<{ key: string; value: string }>(PUBLIC_SETTINGS_SQL);
  return publicSettingsFromRows(rows);
}

async function requestOrigin(): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (!request) return null;
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export const getHomeSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await sqlClient();
  const vehicles = await sql.query<Record<string, unknown>>(PUBLIC_VEHICLE_LIST_SQL);
  const testimonials = await sql.query<Record<string, unknown>>(PUBLIC_TESTIMONIAL_SQL);
  const faqs = await sql.query<Record<string, unknown>>(PUBLIC_FAQ_SQL);
  const settings = await readSettings();
  return {
    origin: await requestOrigin(),
    settings,
    vehicles: vehicles.slice(0, 6).map(cardFromRow),
    vehicleCount: vehicles.length,
    testimonials: testimonials.slice(0, 3).map(testimonialFromRow),
    faqs: faqs.slice(0, 4).map(faqFromRow),
  };
});

export const listPublishedVehicles = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await sqlClient();
  const rows = await sql.query<Record<string, unknown>>(PUBLIC_VEHICLE_LIST_SQL);
  const settings = await readSettings();
  return { origin: await requestOrigin(), settings, vehicles: rows.map(cardFromRow) };
});

export const getPublishedVehicle = createServerFn({ method: "GET" })
  .validator((slug: unknown) => {
    const parsed = parseSlug(slug);
    if (!parsed) throw new Error("That vehicle link is not valid.");
    return parsed;
  })
  .handler(async ({ data: slug }) => {
    const sql = await sqlClient();
    const rows = await sql.query<Record<string, unknown>>(PUBLIC_VEHICLE_BY_SLUG_SQL, [slug]);
    const row = rows[0];
    if (!row) return null;
    const { publicImageUrl } = await import("./server-env.server.ts");
    const images = await sql.query<Record<string, unknown>>(PUBLIC_VEHICLE_IMAGES_SQL, [row.id]);
    const detail: PublicVehicleDetail = {
      ...cardFromRow(row),
      description: text(row.description),
      images: images.map((image) => ({
        alt: text(image.alt),
        url: publicImageUrl(text(image.storage_key)),
        sortOrder: intOrNull(image.sort_order) ?? 0,
      })),
    };
    return {
      origin: await requestOrigin(),
      settings: await readSettings(),
      vehicle: detail,
    };
  });

function faqFromRow(row: Record<string, unknown>): PublicFaq {
  return { question: text(row.question), answer: text(row.answer) };
}

function testimonialFromRow(row: Record<string, unknown>): PublicTestimonial {
  return {
    authorName: text(row.author_name),
    quote: text(row.quote),
    attribution: textOrNull(row.attribution),
  };
}

export const listPublishedFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await sqlClient();
  const rows = await sql.query<Record<string, unknown>>(PUBLIC_FAQ_SQL);
  return { origin: await requestOrigin(), settings: await readSettings(), faqs: rows.map(faqFromRow) };
});

export const listPublishedTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await sqlClient();
  const rows = await sql.query<Record<string, unknown>>(PUBLIC_TESTIMONIAL_SQL);
  return {
    origin: await requestOrigin(),
    settings: await readSettings(),
    testimonials: rows.map(testimonialFromRow),
  };
});

function postCard(row: Record<string, unknown>): PublicPostCard {
  return {
    slug: text(row.slug),
    title: text(row.title),
    excerpt: text(row.excerpt),
    publishedOn: day(row.published_at),
  };
}

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await sqlClient();
  const rows = await sql.query<Record<string, unknown>>(PUBLIC_POST_LIST_SQL);
  return { origin: await requestOrigin(), settings: await readSettings(), posts: rows.map(postCard) };
});

export const getPublishedPost = createServerFn({ method: "GET" })
  .validator((slug: unknown) => {
    const parsed = parseSlug(slug);
    if (!parsed) throw new Error("That post link is not valid.");
    return parsed;
  })
  .handler(async ({ data: slug }) => {
    const sql = await sqlClient();
    const rows = await sql.query<Record<string, unknown>>(PUBLIC_POST_BY_SLUG_SQL, [slug]);
    const row = rows[0];
    if (!row) return null;
    const detail: PublicPostDetail = {
      ...postCard(row),
      body: text(row.body_markdown),
      metaTitle: textOrNull(row.meta_title),
      metaDescription: textOrNull(row.meta_description),
    };
    return { origin: await requestOrigin(), settings: await readSettings(), post: detail };
  });

export const getContactPage = createServerFn({ method: "GET" }).handler(async () => {
  return { origin: await requestOrigin(), settings: await readSettings() };
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<EnquiryResult> => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    const parsed = parseEnquiry(data);
    if (!parsed.ok) return parsed;
    const input = parsed.value;
    const sql = await sqlClient();
    const phoneCount = await sql<{ n: number }>`
      select count(*) as n from enquiry
      where phone = ${input.phone} and created_at > now() - interval '1 hour'
    `;
    if (Number(phoneCount[0]?.n ?? 0) >= ENQUIRY_HOURLY_LIMIT) {
      return { ok: false, error: "Please wait before sending another enquiry." };
    }

    let ipHash: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const request = getRequest();
      const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = forwarded || request?.headers.get("x-real-ip")?.trim() || "";
      if (ip) {
        const { createHash } = await import("node:crypto");
        ipHash = createHash("sha256").update(ip).digest("hex");
      }
    } catch {
      ipHash = null;
    }
    if (ipHash) {
      const ipCount = await sql<{ n: number }>`
        select count(*) as n from enquiry
        where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'
      `;
      if (Number(ipCount[0]?.n ?? 0) >= ENQUIRY_IP_HOURLY_LIMIT) {
        return { ok: false, error: "Please wait before sending another enquiry." };
      }
    }

    let vehicleId: string | null = null;
    if (input.vehicleSlug) {
      const found = await sql<{ id: string }>`
        select id from vehicle where status = 'published' and slug = ${input.vehicleSlug} limit 1
      `;
      if (!found[0]) return { ok: false, error: "That vehicle is not published." };
      vehicleId = found[0].id;
    }

    const id = crypto.randomUUID();
    await sql`
      insert into enquiry (
        id, vehicle_id, contact_name, phone, email, message, start_on, end_on, status, ip_hash
      ) values (
        ${id},
        ${vehicleId},
        ${input.contactName},
        ${input.phone},
        ${input.email || null},
        ${input.message},
        ${input.startOn || null},
        ${input.endOn || null},
        'new',
        ${ipHash}
      )
    `;
    const { logInfo } = await import("./log.server.ts");
    logInfo("enquiry.created", { id, vehicleId, hasEmail: Boolean(input.email) });
    return { ok: true, id };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const sql = await sqlClient();
    const { dbSource } = await import("@/lib/db");
    const staff = await sql<{ role: string }>`
      select role from staff_member where user_id = ${context.userId} limit 1
    `;
    const rawRole = staff[0]?.role;
    const role = isStaffRole(rawRole) ? rawRole : null;
    if (!role) {
      return {
        userId: context.userId,
        role: null,
        database: dbSource === "neon" ? "hosted" : "preview",
        counts: null,
      };
    }
    const counts = await sql<{
      vehicles: number;
      published_vehicles: number;
      new_enquiries: number;
      posts: number;
      faqs: number;
      testimonials: number;
    }>`
      select
        (select count(*) from vehicle) as vehicles,
        (select count(*) from vehicle where status = 'published') as published_vehicles,
        (select count(*) from enquiry where status = 'new') as new_enquiries,
        (select count(*) from blog_post) as posts,
        (select count(*) from faq) as faqs,
        (select count(*) from testimonial) as testimonials
    `;
    const row = counts[0];
    return {
      userId: context.userId,
      role,
      database: dbSource === "neon" ? "hosted" : "preview",
      counts: {
        vehicles: Number(row?.vehicles ?? 0),
        publishedVehicles: Number(row?.published_vehicles ?? 0),
        newEnquiries: Number(row?.new_enquiries ?? 0),
        posts: Number(row?.posts ?? 0),
        faqs: Number(row?.faqs ?? 0),
        testimonials: Number(row?.testimonials ?? 0),
      },
    };
  });

export async function sitemapEntries(): Promise<{ loc: string; lastmod: string | null }[]> {
  const sql = await sqlClient();
  const vehicles = await sql.query<{ slug: string; updated_at: unknown }>(PUBLIC_SITEMAP_VEHICLES_SQL);
  const posts = await sql.query<{ slug: string; updated_at: unknown }>(PUBLIC_SITEMAP_POSTS_SQL);
  const staticPaths = ["/", "/vehicles", "/blog", "/faq", "/testimonials", "/contact"];
  return [
    ...staticPaths.map((loc) => ({ loc, lastmod: null })),
    ...vehicles.map((row) => ({ loc: `/vehicles/${row.slug}`, lastmod: day(row.updated_at) })),
    ...posts.map((row) => ({ loc: `/blog/${row.slug}`, lastmod: day(row.updated_at) })),
  ];
}

export { EMPTY_SETTINGS };

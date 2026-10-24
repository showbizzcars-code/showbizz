import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "../auth/middleware.ts";
import { isStaffRole, can, type StaffRole, type StaffAction } from "./access.ts";
import { uploadImageToStorage, deleteImageFromStorage, recordPendingStorageCleanup } from "./storage.server.ts";
import { parseSlug } from "./validate.ts";
import { PUBLIC_SETTING_KEYS } from "./brand.ts";

async function sqlClient() {
  const { getSql } = await import("../db.ts");
  return getSql();
}

async function requireStaffRole(userId: string): Promise<StaffRole> {
  const sql = await sqlClient();
  const staff = await sql<{ role: string }>`
    select role from staff_member where user_id = ${userId} limit 1
  `;
  const rawRole = staff[0]?.role;
  const role = isStaffRole(rawRole) ? rawRole : null;
  if (!role) {
    throw new Error("Forbidden: Account does not have staff privileges.");
  }
  return role;
}

async function requirePermission(userId: string, action: StaffAction): Promise<StaffRole> {
  const role = await requireStaffRole(userId);
  if (!can(role, action)) {
    throw new Error(`Forbidden: Role '${role}' lacks permission for '${action}'.`);
  }
  return role;
}

// --- VEHICLES ---

export const adminListVehicles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();
    const rows = await sql<Record<string, any>>`
      select v.*,
             (select storage_key from vehicle_image where vehicle_id = v.id order by sort_order asc, created_at asc limit 1) as cover_image_key
      from vehicle v
      order by v.updated_at desc
    `;
    const { publicImageUrl } = await import("./server-env.server.ts");
    return rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      summary: String(r.summary ?? ""),
      category: r.category ? String(r.category) : null,
      seats: r.seats ? Number(r.seats) : null,
      model_year: r.model_year ? Number(r.model_year) : null,
      transmission: r.transmission ? String(r.transmission) : null,
      fuel: r.fuel ? String(r.fuel) : null,
      daily_rate_minor: r.daily_rate_minor ? Number(r.daily_rate_minor) : null,
      currency_code: r.currency_code ? String(r.currency_code) : null,
      availability: String(r.availability ?? "unavailable"),
      availability_note: String(r.availability_note ?? ""),
      status: String(r.status ?? "draft"),
      cover_image_url: r.cover_image_key ? publicImageUrl(String(r.cover_image_key)) : null,
    }));
  });

export const adminGetVehicle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();
    const vehicleRows = await sql<Record<string, unknown>>`
      select * from vehicle where id = ${id} limit 1
    `;
    const vehicle = vehicleRows[0];
    if (!vehicle) return null;

    const images = await sql<Record<string, unknown>>`
      select * from vehicle_image where vehicle_id = ${id} order by sort_order asc, created_at asc
    `;
    const { publicImageUrl } = await import("./server-env.server.ts");

    return {
      vehicle: {
        id: String(vehicle.id),
        slug: String(vehicle.slug),
        title: String(vehicle.title),
        summary: String(vehicle.summary ?? ""),
        description: String(vehicle.description ?? ""),
        category: vehicle.category ? String(vehicle.category) : null,
        seats: vehicle.seats ? Number(vehicle.seats) : null,
        model_year: vehicle.model_year ? Number(vehicle.model_year) : null,
        transmission: vehicle.transmission ? String(vehicle.transmission) : null,
        fuel: vehicle.fuel ? String(vehicle.fuel) : null,
        daily_rate_minor: vehicle.daily_rate_minor ? Number(vehicle.daily_rate_minor) : null,
        currency_code: vehicle.currency_code ? String(vehicle.currency_code) : null,
        availability: String(vehicle.availability ?? "unavailable"),
        availability_note: String(vehicle.availability_note ?? ""),
        status: String(vehicle.status ?? "draft"),
      },
      images: images.map((img) => ({
        id: String(img.id),
        vehicle_id: String(img.vehicle_id),
        storage_key: String(img.storage_key),
        alt: String(img.alt ?? ""),
        sort_order: Number(img.sort_order ?? 0),
        url: publicImageUrl(String(img.storage_key)),
      })),
    };
  });

export const adminSaveVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: any) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();

    const id = data.id || crypto.randomUUID();
    const slug = parseSlug(data.slug);
    if (!slug) throw new Error("Invalid vehicle slug.");

    const title = String(data.title || "").trim();
    if (!title || title.length > 120) throw new Error("Title must be 1 to 120 characters.");

    const summary = String(data.summary || "").trim();
    const description = String(data.description || "").trim();
    const category = data.category ? String(data.category).trim() : null;
    const seats = data.seats ? Number(data.seats) : null;
    const modelYear = data.modelYear ? Number(data.modelYear) : null;
    const transmission = data.transmission === "automatic" || data.transmission === "manual" ? data.transmission : null;
    const fuel = data.fuel ? String(data.fuel).trim() : null;
    const dailyRateMinor = data.dailyRateMinor !== null && data.dailyRateMinor !== undefined && data.dailyRateMinor !== "" ? Number(data.dailyRateMinor) : null;
    const currencyCode = data.currencyCode ? String(data.currencyCode).trim().toUpperCase() : null;
    const availability = ["available", "unavailable", "on_request"].includes(data.availability) ? data.availability : "unavailable";
    const availabilityNote = String(data.availabilityNote || "").trim();
    const status = ["draft", "published", "archived"].includes(data.status) ? data.status : "draft";

    const publishedAt = status === "published" ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null;

    if (data.id) {
      await sql`
        update vehicle set
          slug = ${slug},
          title = ${title},
          summary = ${summary},
          description = ${description},
          category = ${category},
          seats = ${seats},
          model_year = ${modelYear},
          transmission = ${transmission},
          fuel = ${fuel},
          daily_rate_minor = ${dailyRateMinor},
          currency_code = ${currencyCode},
          availability = ${availability},
          availability_note = ${availabilityNote},
          status = ${status},
          published_at = ${publishedAt},
          updated_by = ${context.userId},
          updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        insert into vehicle (
          id, slug, title, summary, description, category, seats, model_year,
          transmission, fuel, daily_rate_minor, currency_code, availability,
          availability_note, status, created_by, updated_by, published_at
        ) values (
          ${id}, ${slug}, ${title}, ${summary}, ${description}, ${category}, ${seats}, ${modelYear},
          ${transmission}, ${fuel}, ${dailyRateMinor}, ${currencyCode}, ${availability},
          ${availabilityNote}, ${status}, ${context.userId}, ${context.userId}, ${publishedAt}
        )
      `;
    }

    return { ok: true, id };
  });

export const adminDeleteVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();

    let keysToDelete: string[] = [];

    await sql.transaction(async (tx) => {
      const vehicleRow = await tx<{ id: string }>`
        select id from vehicle where id = ${id} for update
      `;
      if (!vehicleRow[0]) return;

      const imageRows = await tx<{ id: string; storage_key: string }>`
        select id, storage_key from vehicle_image where vehicle_id = ${id}
      `;

      keysToDelete = imageRows.map((img) => img.storage_key);

      await tx`delete from vehicle where id = ${id}`;
    });

    for (const key of keysToDelete) {
      try {
        await deleteImageFromStorage(key);
      } catch (storageErr: any) {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        await recordPendingStorageCleanup(key, `Vehicle delete post-commit storage error: ${msg}`);
      }
    }

    return { ok: true };
  });

// --- VEHICLE IMAGES ---

export const adminUploadVehicleImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: any) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();

    const vehicleId = String(data.vehicleId);
    const fileName = String(data.fileName || "image.jpg");
    const contentType = String(data.contentType);
    const base64Data = String(data.base64Data);
    const alt = String(data.alt || "Vehicle Image").trim();

    const buffer = Buffer.from(base64Data, "base64");
    const byteSize = buffer.byteLength;

    const stored = await uploadImageToStorage({
      fileName,
      contentType,
      byteSize,
      buffer,
    });

    const imageId = crypto.randomUUID();
    try {
      await sql.transaction(async (tx) => {
        const vehicleExists = await tx<{ id: string }>`
          select id from vehicle where id = ${vehicleId} for update
        `;
        if (!vehicleExists[0]) {
          throw new Error("Vehicle not found.");
        }

        await tx`
          insert into vehicle_image (
            id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size
          ) values (
            ${imageId}, ${vehicleId}, ${stored.storageKey}, ${alt}, 0, ${contentType}, ${byteSize}
          )
        `;
      });
    } catch (dbErr: any) {
      try {
        await deleteImageFromStorage(stored.storageKey);
      } catch (storageErr: any) {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        await recordPendingStorageCleanup(stored.storageKey, `DB insert failed: ${msg}`);
      }
      throw dbErr;
    }

    return { ok: true, imageId, ...stored };
  });

export const adminDeleteVehicleImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();
    // Load deletion logic only within the server function handler; this module
    // is also imported by client route code for the server-function stubs.
    const { deleteVehicleImageWithCleanup } = await import("./image-admin.server.ts");
    await deleteVehicleImageWithCleanup(sql, id);
    return { ok: true };
  });

export async function reorderVehicleImagesInDb(
  sql: any,
  vehicleId: string,
  imageIds: string[]
): Promise<void> {
  const uniqueIds = Array.from(new Set(imageIds));
  if (uniqueIds.length !== imageIds.length) {
    throw new Error("Duplicate image IDs provided.");
  }

  await sql.transaction(async (tx: any) => {
    // Row lock on vehicle to serialize concurrent reorders
    const vehicleRow = await tx<{ id: string }>`
      select id from vehicle where id = ${vehicleId} for update
    `;
    if (!vehicleRow[0]) {
      throw new Error("Vehicle not found.");
    }

    const existingImages = await tx<{ id: string }>`
      select id from vehicle_image where vehicle_id = ${vehicleId}
    `;

    if (existingImages.length !== imageIds.length) {
      throw new Error("The submitted image IDs list must contain exactly all images belonging to the vehicle.");
    }

    const existingSet = new Set(existingImages.map((img: any) => img.id));
    const allBelong = imageIds.every((id) => existingSet.has(id));
    if (!allBelong) {
      throw new Error("One or more image IDs do not belong to the specified vehicle.");
    }

    for (let index = 0; index < imageIds.length; index++) {
      const imageId = imageIds[index];
      await tx`
        update vehicle_image set sort_order = ${index} where id = ${imageId} and vehicle_id = ${vehicleId}
      `;
    }
  });
}

export const adminReorderVehicleImages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { vehicleId: string; imageIds: string[] }) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "vehicle.write");
    const sql = await sqlClient();

    await reorderVehicleImagesInDb(sql, data.vehicleId, data.imageIds);

    return { ok: true };
  });

// --- ENQUIRIES ---

export const adminListEnquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePermission(context.userId, "enquiry.read");
    const sql = await sqlClient();
    const rows = await sql<Record<string, any>>`
      select e.*, v.title as vehicle_title
      from enquiry e
      left join vehicle v on e.vehicle_id = v.id
      order by e.created_at desc
    `;
    return rows.map((r) => ({
      id: String(r.id),
      vehicle_id: r.vehicle_id ? String(r.vehicle_id) : null,
      contact_name: String(r.contact_name),
      phone: String(r.phone),
      email: r.email ? String(r.email) : null,
      message: String(r.message),
      start_on: r.start_on ? String(r.start_on) : null,
      end_on: r.end_on ? String(r.end_on) : null,
      status: String(r.status),
      vehicle_title: r.vehicle_title ? String(r.vehicle_title) : null,
      created_at: String(r.created_at),
    }));
  });

export const adminUpdateEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: string }) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "enquiry.update");
    const sql = await sqlClient();
    if (!["new", "in_progress", "closed"].includes(data.status)) {
      throw new Error("Invalid enquiry status.");
    }
    await sql`
      update enquiry
      set status = ${data.status}, handled_by = ${context.userId}, updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true };
  });

// --- BLOG POSTS ---

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    const rows = await sql<Record<string, any>>`
      select * from blog_post order by updated_at desc
    `;
    return rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      excerpt: String(r.excerpt ?? ""),
      body_markdown: String(r.body_markdown ?? ""),
      status: String(r.status),
      meta_title: r.meta_title ? String(r.meta_title) : null,
      meta_description: r.meta_description ? String(r.meta_description) : null,
    }));
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: any) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();

    const id = data.id || crypto.randomUUID();
    const slug = parseSlug(data.slug);
    if (!slug) throw new Error("Invalid post slug.");

    const title = String(data.title || "").trim();
    if (!title || title.length > 140) throw new Error("Title must be 1 to 140 characters.");

    const excerpt = String(data.excerpt || "").trim();
    const bodyMarkdown = String(data.bodyMarkdown || "").trim();
    const metaTitle = data.metaTitle ? String(data.metaTitle).trim() : null;
    const metaDescription = data.metaDescription ? String(data.metaDescription).trim() : null;
    const status = ["draft", "published", "archived"].includes(data.status) ? data.status : "draft";
    const publishedAt = status === "published" ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null;

    if (data.id) {
      await sql`
        update blog_post set
          slug = ${slug},
          title = ${title},
          excerpt = ${excerpt},
          body_markdown = ${bodyMarkdown},
          meta_title = ${metaTitle},
          meta_description = ${metaDescription},
          status = ${status},
          published_at = ${publishedAt},
          updated_by = ${context.userId},
          updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        insert into blog_post (
          id, slug, title, excerpt, body_markdown, meta_title, meta_description, status,
          published_at, created_by, updated_by
        ) values (
          ${id}, ${slug}, ${title}, ${excerpt}, ${bodyMarkdown}, ${metaTitle}, ${metaDescription}, ${status},
          ${publishedAt}, ${context.userId}, ${context.userId}
        )
      `;
    }

    return { ok: true, id };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    await sql`delete from blog_post where id = ${id}`;
    return { ok: true };
  });

// --- FAQS ---

export const adminListFaqs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    const rows = await sql<Record<string, any>>`
      select * from faq order by sort_order asc, created_at desc
    `;
    return rows.map((r) => ({
      id: String(r.id),
      question: String(r.question),
      answer: String(r.answer),
      sort_order: Number(r.sort_order ?? 0),
      status: String(r.status),
    }));
  });

export const adminSaveFaq = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: any) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();

    const id = data.id || crypto.randomUUID();
    const question = String(data.question || "").trim();
    const answer = String(data.answer || "").trim();
    const sortOrder = Number(data.sortOrder || 0);
    const status = data.status === "published" ? "published" : "draft";

    if (question.length < 5 || question.length > 200) throw new Error("Question must be 5 to 200 characters.");
    if (answer.length < 5 || answer.length > 4000) throw new Error("Answer must be 5 to 4000 characters.");

    if (data.id) {
      await sql`
        update faq set
          question = ${question},
          answer = ${answer},
          sort_order = ${sortOrder},
          status = ${status},
          updated_by = ${context.userId},
          updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        insert into faq (
          id, question, answer, sort_order, status, created_by, updated_by
        ) values (
          ${id}, ${question}, ${answer}, ${sortOrder}, ${status}, ${context.userId}, ${context.userId}
        )
      `;
    }

    return { ok: true, id };
  });

export const adminDeleteFaq = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    await sql`delete from faq where id = ${id}`;
    return { ok: true };
  });

// --- TESTIMONIALS ---

export const adminListTestimonials = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    const rows = await sql<Record<string, any>>`
      select * from testimonial order by sort_order asc, created_at desc
    `;
    return rows.map((r) => ({
      id: String(r.id),
      author_name: String(r.author_name),
      quote: String(r.quote),
      attribution: r.attribution ? String(r.attribution) : null,
      sort_order: Number(r.sort_order ?? 0),
      status: String(r.status),
    }));
  });

export const adminSaveTestimonial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: any) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();

    const id = data.id || crypto.randomUUID();
    const authorName = String(data.authorName || "").trim();
    const quote = String(data.quote || "").trim();
    const attribution = data.attribution ? String(data.attribution).trim() : null;
    const sortOrder = Number(data.sortOrder || 0);
    const status = data.status === "published" ? "published" : "draft";

    if (authorName.length < 2 || authorName.length > 80) throw new Error("Author name must be 2 to 80 characters.");
    if (quote.length < 10 || quote.length > 600) throw new Error("Quote must be 10 to 600 characters.");

    if (data.id) {
      await sql`
        update testimonial set
          author_name = ${authorName},
          quote = ${quote},
          attribution = ${attribution},
          sort_order = ${sortOrder},
          status = ${status},
          updated_by = ${context.userId},
          updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        insert into testimonial (
          id, author_name, quote, attribution, sort_order, status, created_by, updated_by
        ) values (
          ${id}, ${authorName}, ${quote}, ${attribution}, ${sortOrder}, ${status}, ${context.userId}, ${context.userId}
        )
      `;
    }

    return { ok: true, id };
  });

export const adminDeleteTestimonial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => String(id))
  .handler(async ({ context, data: id }) => {
    await requirePermission(context.userId, "content.write");
    const sql = await sqlClient();
    await sql`delete from testimonial where id = ${id}`;
    return { ok: true };
  });

// --- SETTINGS ---

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaffRole(context.userId);
    const sql = await sqlClient();
    const rows = await sql<{ key: string; value: string }>`
      select key, value from site_setting
    `;
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return settings;
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((settings: Record<string, string>) => settings)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "settings.write");

    const sql = await sqlClient();
    for (const key of PUBLIC_SETTING_KEYS) {
      const val = data[key] !== undefined ? String(data[key]).trim() : "";
      await sql`
        insert into site_setting (key, value, updated_by, updated_at)
        values (${key}, ${val}, ${context.userId}, now())
        on conflict (key) do update set
          value = ${val},
          updated_by = ${context.userId},
          updated_at = now()
      `;
    }
    return { ok: true };
  });

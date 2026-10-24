import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { blobStoreIdFromReadWriteToken, validateImageInput } from "@/lib/showbizz/storage.server";

function isLegacyHostPhotoKey(value: string): boolean {
  return /^(?:blob\/)?(?:host-enquiries|vehicles)\/[0-9]+-[a-f0-9]{16}\.(?:jpg|png|webp)$/i.test(value);
}

export const Route = createFileRoute("/api/host-car-audit")({
  server: { handlers: { GET: async ({ request }) => {
    const url = new URL(request.url);
    const expected = process.env.HOST_CAR_REPAIR_TOKEN ?? "";
    const supplied = url.searchParams.get("token") ?? "";
    const matches = expected.length > 0 && Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (process.env.VERCEL_ENV !== "preview" || !matches) return new Response("Not found", { status: 404 });
    if (!["migrate", "diagnose", "repair"].includes(url.searchParams.get("mode") ?? "")) return Response.json({ ok: false, error: "Set mode=migrate, diagnose, or repair." }, { status: 400 });

    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
    const storeId = blobStoreIdFromReadWriteToken(token);
    if (!storeId) return Response.json({ ok: false, error: "Blob storage token is not configured." }, { status: 500 });
    const expectedHost = (storeId + ".public.blob.vercel-storage.com").toLowerCase();
    const sql = await getSql();
    const rows = await sql.query<{ id: string; message: string; created_at: string; vehicle_id: string | null }>(
      "select id, message, created_at, vehicle_id from enquiry where message like $1 order by created_at asc",
      ["Vehicle partnership enquiry from the Host my car page.%"],
    );
    if (url.searchParams.get("mode") === "repair") {
      let repairedVehicles = 0;
      let linkedPhotos = 0;
      let skippedPhotos = 0;
      for (const row of rows) {
        if (!row.vehicle_id) continue;
        const currentImages = await sql.query<{ id: string }>("select id from vehicle_image where vehicle_id = $1", [row.vehicle_id]);
        if (currentImages.length > 0) continue;
        const lines = row.message.split("\n");
        const title = lines.find((line) => line.startsWith("Brand & Model:"))?.slice("Brand & Model:".length).trim() || "Vehicle";
        const photoLines = lines.filter((line) => line.startsWith("Photo ") && line.includes("https://"));
        const photos: Array<{ storageKey: string; contentType: string; byteSize: number; alt: string }> = [];
        for (let index = 0; index < photoLines.length; index += 1) {
          const line = photoLines[index];
          const colon = line.indexOf(":");
          if (colon < 0) { skippedPhotos += 1; continue; }
          const photoUrl = line.slice(colon + 1).trim();
          let parsedUrl: URL;
          try { parsedUrl = new URL(photoUrl); } catch { skippedPhotos += 1; continue; }
          if (parsedUrl.protocol !== "https:" || parsedUrl.hostname.toLowerCase() !== expectedHost) { skippedPhotos += 1; continue; }
          const storageKey = parsedUrl.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part)).join("/");
          if (!isLegacyHostPhotoKey(storageKey)) { skippedPhotos += 1; continue; }
          try {
            const response = await fetch(photoUrl, { cache: "no-store" });
            if (!response.ok) { skippedPhotos += 1; continue; }
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
            const validation = validateImageInput(contentType, buffer.byteLength, buffer);
            if (!validation.ok) { skippedPhotos += 1; continue; }
            photos.push({ storageKey, contentType, byteSize: buffer.byteLength, alt: (title + " photo " + (index + 1)).slice(0, 180) });
          } catch { skippedPhotos += 1; }
        }
        if (!photos.length) continue;
        let inserted = false;
        await sql.transaction(async (tx) => {
          const vehicle = await tx<{ id: string }>`select id from vehicle where id = ${row.vehicle_id} for update`;
          if (!vehicle[0]) return;
          const already = await tx<{ id: string }>`select id from vehicle_image where vehicle_id = ${row.vehicle_id}`;
          if (already.length > 0) return;
          for (let index = 0; index < photos.length; index += 1) {
            const photo = photos[index];
            await tx`insert into vehicle_image (id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size) values (${crypto.randomUUID()}, ${row.vehicle_id}, ${photo.storageKey}, ${photo.alt}, ${index}, ${photo.contentType}, ${photo.byteSize})`;
          }
          inserted = true;
        });
        if (inserted) { repairedVehicles += 1; linkedPhotos += photos.length; }
      }
      return Response.json({ ok: true, repairedVehicles, linkedPhotos, skippedPhotos });
    }
    if (url.searchParams.get("mode") === "diagnose") {
      const report = [];
      for (const row of rows) {
        const lines = row.message.split("\n");
        const photoLines = lines.filter((line) => line.startsWith("Photo ") && line.includes("https://"));
        const photos = [];
        for (const line of photoLines) {
          const colon = line.indexOf(":");
          if (colon < 0) { photos.push({ parse: "missing-colon" }); continue; }
          const photoUrl = line.slice(colon + 1).trim();
          let parsedUrl;
          try { parsedUrl = new URL(photoUrl); } catch { photos.push({ parse: "invalid-url" }); continue; }
          const storageKey = parsedUrl.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part)).join("/");
          const hostMatch = parsedUrl.protocol === "https:" && parsedUrl.hostname.toLowerCase() === expectedHost;
          const keyMatch = isLegacyHostPhotoKey(storageKey);
          if (!hostMatch || !keyMatch) { photos.push({ hostMatch, keyMatch, pathPrefix: storageKey.split("/").slice(0, 2).join("/") }); continue; }
          try {
            const response = await fetch(photoUrl, { cache: "no-store" });
            const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
            const buffer = response.ok ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0);
            const validation = response.ok ? validateImageInput(contentType, buffer.byteLength, buffer) : { ok: false as const, error: "HTTP " + response.status };
            photos.push({ hostMatch, keyMatch, httpStatus: response.status, contentType, byteSize: buffer.byteLength, imageValid: validation.ok, validationError: validation.ok ? null : validation.error });
          } catch (error) {
            photos.push({ hostMatch, keyMatch, fetchError: error instanceof Error ? error.message : "fetch failed" });
          }
        }
        report.push({ enquiryId: row.id, linkedToVehicle: Boolean(row.vehicle_id), photoCount: photoLines.length, photos });
      }
      return Response.json({ ok: true, expectedHost, report });
    }
    let migrated = 0;
    let linkedPhotos = 0;
    let skippedPhotos = 0;
    let skippedSubmissions = 0;

    for (const row of rows) {
      if (row.vehicle_id) continue;
      const lines = row.message.split("\n");
      const field = (label: string) => lines.find((line) => line.startsWith(label + ":"))?.slice(label.length + 1).trim() ?? "";
      const title = field("Brand & Model");
      if (!title || title.length > 120) { skippedSubmissions += 1; continue; }
      const yearNumber = Number(field("Year of Manufacture"));
      const modelYear = Number.isInteger(yearNumber) && yearNumber >= 1980 && yearNumber <= 2100 ? yearNumber : null;
      const fuelText = field("Fuel Type");
      const fuel = fuelText && fuelText.length <= 40 ? fuelText : null;
      const transmissionText = field("Transmission").toLowerCase();
      const transmission = transmissionText === "automatic" ? "automatic" : transmissionText === "manual" ? "manual" : null;
      const odometer = field("Current Odometer Reading");
      const registration = field("State of Registration");
      const additional = field("Additional information");
      const description = [
        "Legacy owner-submitted vehicle. Awaiting staff review.",
        modelYear ? "Year of manufacture: " + modelYear : "",
        fuel ? "Fuel type: " + fuel : "",
        transmission ? "Transmission: " + (transmission === "automatic" ? "Automatic" : "Manual") : "",
        odometer ? "Current odometer: " + odometer : "",
        registration ? "State of registration: " + registration : "",
        additional ? "Additional information: " + additional : "",
      ].filter(Boolean).join("\n");

      const photos: Array<{ storageKey: string; contentType: string; byteSize: number; alt: string }> = [];
      const photoLines = lines.filter((line) => line.startsWith("Photo ") && line.includes("https://"));
      for (let index = 0; index < photoLines.length; index += 1) {
        const line = photoLines[index];
        const colon = line.indexOf(":");
        if (colon < 0) { skippedPhotos += 1; continue; }
        const photoUrl = line.slice(colon + 1).trim();
        let parsedUrl: URL;
        try { parsedUrl = new URL(photoUrl); } catch { skippedPhotos += 1; continue; }
        if (parsedUrl.protocol !== "https:" || parsedUrl.hostname.toLowerCase() !== expectedHost) { skippedPhotos += 1; continue; }
        const storageKey = parsedUrl.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part)).join("/");
        if (!isLegacyHostPhotoKey(storageKey)) { skippedPhotos += 1; continue; }
        try {
          const response = await fetch(photoUrl, { cache: "no-store" });
          if (!response.ok) { skippedPhotos += 1; continue; }
          const buffer = Buffer.from(await response.arrayBuffer());
          const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
          const validation = validateImageInput(contentType, buffer.byteLength, buffer);
          if (!validation.ok) { skippedPhotos += 1; continue; }
          photos.push({ storageKey, contentType, byteSize: buffer.byteLength, alt: (title + " photo " + (index + 1)).slice(0, 180) });
        } catch { skippedPhotos += 1; }
      }

      const vehicleId = crypto.randomUUID();
      const slugBase = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "hosted-car";
      const vehicleSlug = slugBase + "-" + vehicleId.replace(/-/g, "").slice(0, 10);
      try {
        await sql.transaction(async (tx) => {
          const current = await tx<{ id: string }>`select id from enquiry where id = ${row.id} and vehicle_id is null for update`;
          if (!current[0]) return;
          await tx`
            insert into vehicle (id, slug, title, summary, description, model_year, transmission, fuel, availability, status, created_by, updated_by, published_at)
            values (
              ${vehicleId}, ${vehicleSlug}, ${title},
              'Legacy owner-submitted vehicle awaiting staff review.', ${description}, ${modelYear}, ${transmission}, ${fuel},
              'on_request', 'draft', 'public-host-my-car-migration', null, null
            )
          `;
          for (let index = 0; index < photos.length; index += 1) {
            const photo = photos[index];
            await tx`
              insert into vehicle_image (id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size)
              values (${crypto.randomUUID()}, ${vehicleId}, ${photo.storageKey}, ${photo.alt}, ${index}, ${photo.contentType}, ${photo.byteSize})
            `;
          }
          await tx`update enquiry set vehicle_id = ${vehicleId}, updated_at = now() where id = ${row.id} and vehicle_id is null`;
        });
        migrated += 1;
        linkedPhotos += photos.length;
      } catch {
        skippedSubmissions += 1;
      }
    }
    return Response.json({ ok: true, legacySubmissions: rows.length, migratedDraftVehicles: migrated, linkedPhotos, skippedPhotos, skippedSubmissions });
  } } },
});

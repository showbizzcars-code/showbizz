import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/host-car-audit")({
  server: { handlers: { GET: async ({ request }) => {
    const url = new URL(request.url);
    const expected = process.env.HOST_CAR_REPAIR_TOKEN ?? "";
    const supplied = url.searchParams.get("token") ?? "";
    const matches = expected.length > 0 && Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (process.env.VERCEL_ENV !== "preview" || !matches) return new Response("Not found", { status: 404 });
    const sql = await getSql();
    const rows = await sql.query<{ id: string; message: string; created_at: string; vehicle_id: string | null }>(
      "select id, message, created_at, vehicle_id from enquiry where message like $1 order by created_at asc",
      ["Vehicle partnership enquiry from the Host my car page.%"],
    );
    const pending = rows.filter((row) => !row.vehicle_id);
    const data = pending.map((row) => {
      const lines = row.message.split("\n");
      const field = (label: string) => lines.find((line) => line.startsWith(label + ":"))?.slice(label.length + 1).trim() ?? "";
      const title = field("Brand & Model");
      const yearText = field("Year of Manufacture");
      const year = Number(yearText);
      const photoCount = lines.filter((line) => line.startsWith("Photo ") && line.includes("https://")).length;
      return { id: row.id, createdAt: row.created_at, title, year: Number.isInteger(year) ? year : null, photoCount };
    });
    return Response.json({ totalHostCarSubmissions: rows.length, withoutVehicleRecord: pending.length, pending: data });
  } } },
});

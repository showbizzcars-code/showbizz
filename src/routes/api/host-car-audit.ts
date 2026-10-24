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
      const title = row.message.match(/^Brand & Model:\\s*(.*)$/m)?.[1]?.trim() ?? "";
      const year = Number(row.message.match(/^Year of Manufacture:\\s*(\\d{4})$/m)?.[1] ?? 0);
      const photoCount = [...row.message.matchAll(/^Photo \\d+:\\s+https:\\/\\/[^\\s]+/gm)].length;
      return { id: row.id, createdAt: row.created_at, title, year: year || null, photoCount };
    });
    return Response.json({ totalHostCarSubmissions: rows.length, withoutVehicleRecord: pending.length, pending: data });
  } } },
});

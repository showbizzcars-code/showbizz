import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/storage-smoke")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const expected = process.env.BLOB_STORAGE_SMOKE_TEST_SECRET ?? "";
        const supplied = url.searchParams.get("token") ?? "";
        const matches = expected.length > 0 &&
          Buffer.byteLength(expected) === Buffer.byteLength(supplied) &&
          timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
        if (process.env.VERCEL_ENV !== "preview" || !matches) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const { verifyVercelBlobStorage } = await import("@/lib/showbizz/storage.server");
          const checks = await verifyVercelBlobStorage();
          return Response.json({ ok: true, checks });
        } catch {
          return Response.json({ ok: false, error: "Blob storage smoke test failed." }, { status: 500 });
        }
      },
    },
  },
});

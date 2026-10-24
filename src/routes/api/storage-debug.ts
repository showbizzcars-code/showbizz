import { timingSafeEqual, randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { blobStoreIdFromReadWriteToken } from "@/lib/showbizz/storage.server";

export const Route = createFileRoute("/api/storage-debug")({
  server: { handlers: { GET: async ({ request }) => {
    const url = new URL(request.url);
    const expected = process.env.BLOB_STORAGE_SMOKE_TEST_SECRET ?? "";
    const supplied = url.searchParams.get("token") ?? "";
    const matches = expected.length > 0 && Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (process.env.VERCEL_ENV !== "preview" || !matches) return new Response("Not found", { status: 404 });
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
    const storeId = token ? blobStoreIdFromReadWriteToken(token) : null;
    if (!token || !storeId) return Response.json({ ok: false, error: "Blob token is missing or invalid." }, { status: 500 });
    const params = new URLSearchParams({ prefix: "blob/healthcheck/", limit: "100" });
    const response = await fetch("https://vercel.com/api/blob?" + params.toString(), {
      headers: {
        authorization: "Bearer " + token,
        "x-vercel-blob-store-id": storeId,
        "x-api-version": "13",
        "x-api-blob-request-id": storeId + ":" + Date.now() + ":" + randomBytes(8).toString("hex"),
        "x-api-blob-request-attempt": "0",
      },
    });
    let body: unknown = null;
    try { body = await response.json(); } catch { body = null; }
    if (!response.ok) return Response.json({ ok: false, status: response.status, body }, { status: 500 });
    const data = body as { blobs?: Array<{ pathname?: string; url?: string; size?: number }>; hasMore?: boolean } | null;
    return Response.json({ ok: true, count: data?.blobs?.length ?? 0, hasMore: Boolean(data?.hasMore), blobs: (data?.blobs ?? []).map((b) => ({ pathname: b.pathname, url: b.url, size: b.size })) });
  } } },
});

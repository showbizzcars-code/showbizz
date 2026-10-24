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
    const headers = {
      authorization: "Bearer " + token,
      "x-vercel-blob-store-id": storeId,
      "x-api-version": "13",
      "x-api-blob-request-id": storeId + ":" + Date.now() + ":" + randomBytes(8).toString("hex"),
      "x-api-blob-request-attempt": "0",
    };
    const response = await fetch("https://vercel.com/api/blob?" + params.toString(), { headers });
    let body: unknown = null;
    try { body = await response.json(); } catch { body = null; }
    if (!response.ok) return Response.json({ ok: false, status: response.status }, { status: 500 });
    const data = body as { blobs?: Array<{ pathname?: string; url?: string; size?: number }>; hasMore?: boolean } | null;
    const blobs = (data?.blobs ?? []).filter((b) => typeof b.url === "string" && typeof b.pathname === "string");
    if (url.searchParams.get("cleanup") !== "1") {
      return Response.json({ ok: true, count: blobs.length, hasMore: Boolean(data?.hasMore), blobs: blobs.map((b) => ({ pathname: b.pathname, size: b.size })) });
    }
    const deleted = [];
    for (const blob of blobs) {
      const del = await fetch("https://vercel.com/api/blob/delete", {
        method: "POST",
        headers: { ...headers, "x-api-blob-request-id": storeId + ":" + Date.now() + ":" + randomBytes(8).toString("hex"), "content-type": "application/json" },
        body: JSON.stringify({ urls: [blob.url] }),
      });
      let delBody: unknown = null;
      try { delBody = await del.json(); } catch { delBody = null; }
      const delData = delBody as { error?: { code?: unknown; message?: unknown } } | null;
      deleted.push({ pathname: blob.pathname, status: del.status, ok: del.ok, errorCode: typeof delData?.error?.code === "string" ? delData.error.code : null, errorMessage: typeof delData?.error?.message === "string" ? delData.error.message.slice(0, 120) : null });
    }
    return Response.json({ ok: deleted.every((d) => d.ok), before: blobs.length, deleted });
  } } },
});

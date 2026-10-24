import { createHash, createHmac, randomBytes } from "node:crypto";
import { publicImageUrl } from "./server-env.server.ts";

export type ImageUploadInput = {
  fileName: string;
  contentType: string;
  byteSize: number;
  buffer: Buffer;
  /** Separates temporary public vehicle-owner uploads from staff-managed vehicle gallery images. */
  folder?: "vehicles" | "host-enquiries";
};

export type StoredImageResult = {
  storageKey: string;
  publicUrl: string | null;
  contentType: string;
  byteSize: number;
};

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTE_SIZE = 3 * 1024 * 1024; // Base64 payloads must fit Vercel function request limits

export function validateImageInput(
  contentType: string,
  byteSize: number,
  buffer?: Buffer
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are allowed." };
  }
  if (byteSize <= 0 || byteSize > MAX_BYTE_SIZE) {
    return { ok: false, error: "Image file size must be between 1 byte and 3 MB." };
  }

  if (buffer) {
    if (buffer.length < 12) {
      return { ok: false, error: "Image buffer is too short to verify format." };
    }

    if (contentType === "image/jpeg") {
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        return { ok: false, error: "File contents do not match JPEG image format." };
      }
    } else if (contentType === "image/png") {
      const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const match = pngHeader.every((b, i) => buffer[i] === b);
      if (!match) {
        return { ok: false, error: "File contents do not match PNG image format." };
      }
    } else if (contentType === "image/webp") {
      const riff = buffer.subarray(0, 4).toString("ascii");
      const webp = buffer.subarray(8, 12).toString("ascii");
      if (riff !== "RIFF" || webp !== "WEBP") {
        return { ok: false, error: "File contents do not match WebP image format." };
      }
    }
  }

  return { ok: true };
}

export function generateStorageKey(
  fileName: string,
  contentType: string,
  folder: "vehicles" | "host-enquiries" = "vehicles",
): string {
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp";
  const hash = createHash("sha256").update(fileName + randomBytes(16).toString("hex") + Date.now()).digest("hex").slice(0, 16);
  return `${folder}/${Date.now()}-${hash}.${ext}`;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmac("AWS4" + key, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  const kSigning = hmac(kService, "aws4_request");
  return kSigning;
}

export function signS3Request(opts: {
  method: string;
  url: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  headers: Record<string, string>;
  payloadHash: string;
}): Record<string, string> {
  const parsedUrl = new URL(opts.url);
  const region = opts.region || process.env.S3_REGION?.trim() || "us-east-1";
  const service = "s3";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const reqHeaders: Record<string, string> = {
    host: parsedUrl.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": opts.payloadHash,
    ...opts.headers,
  };

  const sortedHeaderKeys = Object.keys(reqHeaders)
    .map((k) => k.toLowerCase())
    .sort();

  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${reqHeaders[k].trim()}\n`)
    .join("");

  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    opts.method,
    parsedUrl.pathname,
    parsedUrl.search ? parsedUrl.search.slice(1) : "",
    canonicalHeaders,
    signedHeaders,
    opts.payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(opts.secretAccessKey, dateStamp, region, service);
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...reqHeaders,
    Authorization: authorizationHeader,
  };
}

/** Parse the store ID from Vercel's generated read/write token without exposing the token. */
export function blobStoreIdFromReadWriteToken(token: string): string | null {
  const parts = token.split("_");
  if (parts[0] !== "vercel" || parts[1] !== "blob" || parts[2] !== "rw" || !parts[3]) return null;
  const storeId = parts[3].startsWith("store_") ? parts[3].slice("store_".length) : parts[3];
  return /^[a-zA-Z0-9-]+$/.test(storeId) ? storeId : null;
}

function blobApiHeaders(token: string, storeId: string): Record<string, string> {
  return {
    authorization: "Bearer " + token,
    "x-vercel-blob-store-id": storeId,
    "x-api-version": "13",
    "x-api-blob-request-id": storeId + ":" + Date.now() + ":" + randomBytes(8).toString("hex"),
    "x-api-blob-request-attempt": "0",
  };
}

async function uploadToVercelBlob(pathname: string, input: ImageUploadInput): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = token ? blobStoreIdFromReadWriteToken(token) : null;
  if (!token || !storeId) throw new Error("Vercel Blob storage is not configured or its token is invalid.");

  const uploadUrl = new URL("https://vercel.com/api/blob/");
  uploadUrl.searchParams.set("pathname", pathname);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      ...blobApiHeaders(token, storeId),
      "x-vercel-blob-access": "public",
      "x-add-random-suffix": "0",
      "x-content-type": input.contentType,
    },
    body: new Uint8Array(input.buffer),
  });
  let raw: unknown = null;
  try { raw = await response.json(); } catch { raw = null; }
  const data = raw as { url?: unknown; pathname?: unknown; error?: { code?: unknown } } | null;
  if (!response.ok) {
    const code = typeof data?.error?.code === "string" ? " (" + data.error.code + ")" : "";
    throw new Error("Vercel Blob upload failed with status " + response.status + code + ".");
  }
  if (typeof data?.url !== "string" || typeof data.pathname !== "string") {
    throw new Error("Vercel Blob upload returned an invalid response.");
  }
  const publicUrl = new URL(data.url);
  if (publicUrl.protocol !== "https:" || publicUrl.hostname.toLowerCase() !== (storeId + ".public.blob.vercel-storage.com").toLowerCase()) {
    throw new Error("Vercel Blob returned a URL outside the configured public image store.");
  }
  return { url: publicUrl.toString(), pathname: data.pathname };
}

async function deleteFromVercelBlob(storageKey: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = token ? blobStoreIdFromReadWriteToken(token) : null;
  if (!token || !storeId) throw new Error("Vercel Blob storage is not configured for this image.");
  const url = publicImageUrl(storageKey) ?? ("https://" + storeId + ".public.blob.vercel-storage.com/" + storageKey.split("/").map(encodeURIComponent).join("/"));
  const response = await fetch("https://vercel.com/api/blob/delete", {
    method: "POST",
    headers: { ...blobApiHeaders(token, storeId), "content-type": "application/json" },
    body: JSON.stringify({ urls: [url] }),
  });
  if (!response.ok) {
    let code = "";
    try {
      const data = await response.json() as { error?: { code?: unknown } };
      if (typeof data.error?.code === "string") code = " (" + data.error.code + ")";
    } catch { /* Do not expose response bodies or credentials. */ }
    throw new Error("Vercel Blob delete failed with status " + response.status + code + ".");
  }
}
export async function uploadImageToStorage(input: ImageUploadInput): Promise<StoredImageResult> {
  const validation = validateImageInput(input.contentType, input.byteSize, input.buffer);
  if (!validation.ok) throw new Error(validation.error);

  const storageKey = generateStorageKey(input.fileName, input.contentType, input.folder);
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const isS3Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const isPartialS3 = Boolean((endpoint || bucket || accessKeyId || secretAccessKey) && !isS3Configured);

  if (isPartialS3) {
    throw new Error("Partial S3 configuration detected. All four settings (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) must be provided.");
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const shouldUseBlob = Boolean(blobToken) && process.env.NODE_ENV !== "test" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

  if (shouldUseBlob) {
    const blobStorageKey = "blob/" + storageKey;
    const expectedPublicUrl = publicImageUrl(blobStorageKey);
    if (process.env.NODE_ENV === "production" && !expectedPublicUrl) {
      throw new Error("IMAGE_PUBLIC_BASE_URL must point to the public Vercel Blob store before image uploads are enabled.");
    }
    const blob = await uploadToVercelBlob(blobStorageKey, input);
    if (expectedPublicUrl && new URL(expectedPublicUrl).origin !== new URL(blob.url).origin) {
      try { await deleteFromVercelBlob(blobStorageKey); } catch { /* Let the original configuration error be visible. */ }
      throw new Error("IMAGE_PUBLIC_BASE_URL does not match the configured Vercel Blob store.");
    }
    return {
      storageKey: blobStorageKey,
      publicUrl: blob.url,
      contentType: input.contentType,
      byteSize: input.byteSize,
    };
  }

  if (isS3Configured) {
    const cleanEndpoint = endpoint!.replace(/\/+$/, "");
    const uploadUrl = cleanEndpoint + "/" + bucket + "/" + storageKey;
    const payloadHash = sha256(input.buffer);
    const signedHeaders = signS3Request({
      method: "PUT",
      url: uploadUrl,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      headers: { "content-type": input.contentType, "content-length": String(input.byteSize) },
      payloadHash,
    });
    const response = await fetch(uploadUrl, { method: "PUT", headers: signedHeaders, body: new Uint8Array(input.buffer) });
    if (!response.ok) throw new Error("S3 upload failed with status " + response.status);
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Real image storage is not configured for production. Connect Vercel Blob or configure all required S3 storage variables.");
    }
    const isMockAllowed = process.env.ALLOW_MOCK_STORAGE === "true" || process.env.NODE_ENV === "test";
    if (!isMockAllowed) {
      throw new Error("Image storage is not configured. Connect Vercel Blob, configure S3 variables, or enable the explicit local-only test mock.");
    }
    console.log("[Storage] Local/Mock storage handled key: " + storageKey);
  }

  return { storageKey, publicUrl: publicImageUrl(storageKey), contentType: input.contentType, byteSize: input.byteSize };
}

async function sqlClient() {
  const { getSql } = await import("../db.ts");
  return getSql();
}

export async function recordPendingStorageCleanup(storageKey: string, reason = ""): Promise<void> {
  const sql = await sqlClient();
  const id = crypto.randomUUID();
  await sql`
    insert into pending_storage_cleanup (id, storage_key, reason, attempts, created_at, updated_at)
    values (${id}, ${storageKey}, ${reason}, 1, now(), now())
    on conflict (storage_key) do update set
      attempts = pending_storage_cleanup.attempts + 1,
      reason = ${reason},
      updated_at = now()
  `;
}

export async function retryPendingStorageCleanups(opts?: {
  targetKeys?: string[];
  limit?: number;
  deleteFn?: (key: string) => Promise<void>;
}): Promise<{ processed: number; succeeded: number; failed: number }> {
  const sql = await sqlClient();
  const limit = opts?.limit ?? 50;
  const deleteFn = opts?.deleteFn ?? deleteImageFromStorage;

  let pending: { id: string; storage_key: string; attempts: number }[];

  if (opts?.targetKeys && opts.targetKeys.length > 0) {
    pending = await sql<{ id: string; storage_key: string; attempts: number }>`
      select id, storage_key, attempts from pending_storage_cleanup
      where storage_key = any(${opts.targetKeys})
      order by created_at asc limit ${limit}
    `;
  } else {
    pending = await sql<{ id: string; storage_key: string; attempts: number }>`
      select id, storage_key, attempts from pending_storage_cleanup
      order by created_at asc limit ${limit}
    `;
  }

  let succeeded = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      await deleteFn(row.storage_key);
      await sql`delete from pending_storage_cleanup where id = ${row.id}`;
      succeeded += 1;
    } catch (err: any) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      await sql`
        update pending_storage_cleanup
        set attempts = attempts + 1, reason = ${msg}, updated_at = now()
        where id = ${row.id}
      `;
    }
  }

  return { processed: pending.length, succeeded, failed };
}

export async function deleteImageFromStorage(storageKey: string): Promise<void> {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(storageKey) || storageKey.includes("..")) {
    throw new Error("Invalid storage key format.");
  }

  if (storageKey.startsWith("blob/")) {
    await deleteFromVercelBlob(storageKey);
    return;
  }

  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const isS3Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const isPartialS3 = Boolean((endpoint || bucket || accessKeyId || secretAccessKey) && !isS3Configured);

  if (isPartialS3) {
    throw new Error("Partial S3 configuration detected. All four settings (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) must be provided.");
  }

  if (isS3Configured) {
    const cleanEndpoint = endpoint!.replace(/\/+$/, "");
    const deleteUrl = cleanEndpoint + "/" + bucket + "/" + storageKey;
    const payloadHash = sha256("");
    const signedHeaders = signS3Request({
      method: "DELETE",
      url: deleteUrl,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      headers: {},
      payloadHash,
    });
    const response = await fetch(deleteUrl, { method: "DELETE", headers: signedHeaders });
    if (!response.ok && response.status !== 404) throw new Error("S3 delete failed with status " + response.status);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Real image storage is not configured for production deletion. Connect Vercel Blob or configure all required S3 storage variables.");
  }
  const isMockAllowed = process.env.ALLOW_MOCK_STORAGE === "true" || process.env.NODE_ENV === "test";
  if (!isMockAllowed) {
    throw new Error("Image storage is not configured. Connect Vercel Blob, configure S3 variables, or enable the explicit local-only test mock.");
  }
  console.log("[Storage] Local/Mock storage deleted key: " + storageKey);
}

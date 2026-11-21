import { createHash, createHmac, randomBytes } from "node:crypto";
import { publicImageUrl } from "./server-env.server.ts";

export type ImageUploadInput = {
  fileName: string;
  contentType: string;
  byteSize: number;
  buffer: Buffer;
};

export type StoredImageResult = {
  storageKey: string;
  publicUrl: string | null;
  contentType: string;
  byteSize: number;
};

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTE_SIZE = 5 * 1024 * 1024; // 5 MB limit

export function validateImageInput(
  contentType: string,
  byteSize: number,
  buffer?: Buffer
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are allowed." };
  }
  if (byteSize <= 0 || byteSize > MAX_BYTE_SIZE) {
    return { ok: false, error: "Image file size must be between 1 byte and 5 MB." };
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

export function generateStorageKey(fileName: string, contentType: string): string {
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp";
  const hash = createHash("sha256").update(fileName + randomBytes(16).toString("hex") + Date.now()).digest("hex").slice(0, 16);
  return `vehicles/${Date.now()}-${hash}.${ext}`;
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

export async function uploadImageToStorage(input: ImageUploadInput): Promise<StoredImageResult> {
  const validation = validateImageInput(input.contentType, input.byteSize, input.buffer);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const storageKey = generateStorageKey(input.fileName, input.contentType);

  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  const isS3Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const isPartialS3 = Boolean(
    (endpoint || bucket || accessKeyId || secretAccessKey) && !isS3Configured
  );

  if (isPartialS3) {
    throw new Error(
      "Partial S3 configuration detected. All four settings (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) must be provided."
    );
  }

  if (isS3Configured) {
    const cleanEndpoint = endpoint!.replace(/\/+$/, "");
    const uploadUrl = `${cleanEndpoint}/${bucket}/${storageKey}`;
    const payloadHash = sha256(input.buffer);

    const signedHeaders = signS3Request({
      method: "PUT",
      url: uploadUrl,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      headers: {
        "content-type": input.contentType,
        "content-length": String(input.byteSize),
      },
      payloadHash,
    });

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: signedHeaders,
      body: new Uint8Array(input.buffer),
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "S3 object storage is not configured for production image persistence. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in environment variables."
      );
    }
    const isMockAllowed = process.env.ALLOW_MOCK_STORAGE === "true" || process.env.NODE_ENV === "test";
    if (!isMockAllowed) {
      throw new Error(
        "S3 object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in environment variables or set ALLOW_MOCK_STORAGE=true for local development."
      );
    }
    console.log(`[Storage] Local/Mock storage handled key: ${storageKey}`);
  }

  return {
    storageKey,
    publicUrl: publicImageUrl(storageKey),
    contentType: input.contentType,
    byteSize: input.byteSize,
  };
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

  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  const isS3Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const isPartialS3 = Boolean(
    (endpoint || bucket || accessKeyId || secretAccessKey) && !isS3Configured
  );

  if (isPartialS3) {
    throw new Error(
      "Partial S3 configuration detected. All four settings (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) must be provided."
    );
  }

  if (isS3Configured) {
    const cleanEndpoint = endpoint!.replace(/\/+$/, "");
    const deleteUrl = `${cleanEndpoint}/${bucket}/${storageKey}`;
    const payloadHash = sha256("");

    const signedHeaders = signS3Request({
      method: "DELETE",
      url: deleteUrl,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      headers: {},
      payloadHash,
    });

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: signedHeaders,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 delete failed with status ${response.status}`);
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "S3 object storage is not configured for production image persistence. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in environment variables."
      );
    }
    const isMockAllowed = process.env.ALLOW_MOCK_STORAGE === "true" || process.env.NODE_ENV === "test";
    if (!isMockAllowed) {
      throw new Error(
        "S3 object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in environment variables or set ALLOW_MOCK_STORAGE=true for local development."
      );
    }
    console.log(`[Storage] Local/Mock storage deleted key: ${storageKey}`);
  }
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { validateImageInput, generateStorageKey, signS3Request, uploadImageToStorage } from "./storage.server.ts";

test("validateImageInput accepts valid JPEG, PNG, WebP up to 5MB with correct magic bytes", () => {
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.deepEqual(validateImageInput("image/jpeg", validJpeg.length, validJpeg), { ok: true });

  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  assert.deepEqual(validateImageInput("image/png", validPng.length, validPng), { ok: true });

  const validWebp = Buffer.from("RIFF1234WEBPVP8 ", "ascii");
  assert.deepEqual(validateImageInput("image/webp", validWebp.length, validWebp), { ok: true });
});

test("validateImageInput rejects mismatched magic bytes", () => {
  const fakeJpegWithPngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = validateImageInput("image/jpeg", fakeJpegWithPngBytes.length, fakeJpegWithPngBytes);
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.match(res.error, /JPEG image format/);
  }
});

test("validateImageInput rejects unsupported content types and sizes over 5MB", () => {
  const invalidType = validateImageInput("image/gif", 1024);
  assert.equal(invalidType.ok, false);

  const oversized = validateImageInput("image/jpeg", 6 * 1024 * 1024);
  assert.equal(oversized.ok, false);

  const empty = validateImageInput("image/jpeg", 0);
  assert.equal(empty.ok, false);
});

test("generateStorageKey outputs expected format without directory traversal", () => {
  const key = generateStorageKey("../test.png", "image/png");
  assert.ok(key.startsWith("vehicles/"));
  assert.ok(key.endsWith(".png"));
  assert.ok(!key.includes(".."));
});

test("signS3Request generates AWS SigV4 Authorization header with default us-east-1 or configured region", () => {
  const defaultHeader = signS3Request({
    method: "PUT",
    url: "https://my-bucket.s3.amazonaws.com/vehicles/test.jpg",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    headers: { "content-type": "image/jpeg" },
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  });

  assert.ok(defaultHeader.Authorization.includes("test-access-key/"));
  assert.ok(defaultHeader.Authorization.includes("/us-east-1/s3/aws4_request"));

  const customHeader = signS3Request({
    method: "PUT",
    url: "https://my-bucket.r2.cloudflarestorage.com/vehicles/test.jpg",
    region: "auto",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    headers: { "content-type": "image/jpeg" },
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  });

  assert.ok(customHeader.Authorization.includes("/auto/s3/aws4_request"));
});

test("uploadImageToStorage throws when unconfigured without ALLOW_MOCK_STORAGE", async () => {
  const origEnv = process.env.NODE_ENV;
  const origMock = process.env.ALLOW_MOCK_STORAGE;
  process.env.NODE_ENV = "development";
  delete process.env.ALLOW_MOCK_STORAGE;

  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  try {
    await assert.rejects(
      async () => {
        await uploadImageToStorage({
          fileName: "test.jpg",
          contentType: "image/jpeg",
          byteSize: validJpeg.length,
          buffer: validJpeg,
        });
      },
      /S3 object storage is not configured/
    );
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origMock !== undefined) process.env.ALLOW_MOCK_STORAGE = origMock;
  }
});

test("uploadImageToStorage rejects partial S3 configuration even in mock mode", async () => {
  const origEndpoint = process.env.S3_ENDPOINT;
  const origBucket = process.env.S3_BUCKET;
  const origMock = process.env.ALLOW_MOCK_STORAGE;

  process.env.S3_ENDPOINT = "https://example.r2.cloudflarestorage.com";
  delete process.env.S3_BUCKET;
  process.env.ALLOW_MOCK_STORAGE = "true";

  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  try {
    await assert.rejects(
      async () => {
        await uploadImageToStorage({
          fileName: "test.jpg",
          contentType: "image/jpeg",
          byteSize: validJpeg.length,
          buffer: validJpeg,
        });
      },
      /Partial S3 configuration detected/
    );
  } finally {
    if (origEndpoint !== undefined) process.env.S3_ENDPOINT = origEndpoint; else delete process.env.S3_ENDPOINT;
    if (origBucket !== undefined) process.env.S3_BUCKET = origBucket; else delete process.env.S3_BUCKET;
    if (origMock !== undefined) process.env.ALLOW_MOCK_STORAGE = origMock; else delete process.env.ALLOW_MOCK_STORAGE;
  }
});

test("uploadImageToStorage rejects mock mode in production", async () => {
  const origEnv = process.env.NODE_ENV;
  const origMock = process.env.ALLOW_MOCK_STORAGE;

  process.env.NODE_ENV = "production";
  process.env.ALLOW_MOCK_STORAGE = "true";

  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  try {
    await assert.rejects(
      async () => {
        await uploadImageToStorage({
          fileName: "test.jpg",
          contentType: "image/jpeg",
          byteSize: validJpeg.length,
          buffer: validJpeg,
        });
      },
      /S3 object storage is not configured for production/
    );
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origMock !== undefined) process.env.ALLOW_MOCK_STORAGE = origMock; else delete process.env.ALLOW_MOCK_STORAGE;
  }
});

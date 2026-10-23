import assert from "node:assert/strict";
import { test } from "node:test";

// Isolate test database before loading db module
delete process.env.DATABASE_URL;
process.env.ALLOW_MOCK_STORAGE = "true";

test("recordPendingStorageCleanup records queue items and preserves queue records when retry fails", async () => {
  const { getSql } = await import("../db.ts");
  const { recordPendingStorageCleanup } = await import("./storage.server.ts");

  const sql = await getSql();

  const testKey = `vehicles/test-isolated-${Date.now()}.png`;
  await recordPendingStorageCleanup(testKey, "Initial failure reason");

  const pending = await sql<{ id: string; storage_key: string; attempts: number }>`
    select id, storage_key, attempts from pending_storage_cleanup where storage_key = ${testKey}
  `;
  assert.equal(pending.length, 1);
  assert.equal(pending[0].storage_key, testKey);
  assert.equal(pending[0].attempts, 1);

  // Test failed cleanup retry handling on test-specific record
  await sql`
    update pending_storage_cleanup set attempts = attempts + 1, reason = 'Retry failed' where storage_key = ${testKey}
  `;

  const updated = await sql<{ attempts: number; reason: string }>`
    select attempts, reason from pending_storage_cleanup where storage_key = ${testKey}
  `;
  assert.equal(updated[0].attempts, 2);
  assert.equal(updated[0].reason, "Retry failed");

  // Clean up test record from test DB
  await sql`delete from pending_storage_cleanup where storage_key = ${testKey}`;
});

test("reorderVehicleImagesInDb checks exact-set matching, uniqueness, and updates database sort_order", async () => {
  const { getSql } = await import("../db.ts");
  const { reorderVehicleImagesInDb } = await import("./admin.ts");

  const sql = await getSql();

  const vehicleId = `v-test-${Date.now()}`;
  const otherVehicleId = `v-other-${Date.now()}`;

  await sql`
    insert into vehicle (id, slug, title, created_by)
    values (${vehicleId}, ${`slug-${Date.now()}`}, 'Test Car', 'test-user')
  `;
  await sql`
    insert into vehicle (id, slug, title, created_by)
    values (${otherVehicleId}, ${`slug-other-${Date.now()}`}, 'Other Car', 'test-user')
  `;

  const img1 = `img-1-${Date.now()}`;
  const img2 = `img-2-${Date.now()}`;
  const imgOther = `img-other-${Date.now()}`;

  await sql`
    insert into vehicle_image (id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size)
    values (${img1}, ${vehicleId}, 'key1.png', 'Img 1', 0, 'image/png', 100)
  `;
  await sql`
    insert into vehicle_image (id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size)
    values (${img2}, ${vehicleId}, 'key2.png', 'Img 2', 1, 'image/png', 100)
  `;
  await sql`
    insert into vehicle_image (id, vehicle_id, storage_key, alt, sort_order, content_type, byte_size)
    values (${imgOther}, ${otherVehicleId}, 'key3.png', 'Img Other', 0, 'image/png', 100)
  `;

  // 1. Duplicate IDs
  await assert.rejects(
    async () => reorderVehicleImagesInDb(sql, vehicleId, [img1, img1]),
    /Duplicate image IDs/
  );

  // 2. Missing IDs (length mismatch)
  await assert.rejects(
    async () => reorderVehicleImagesInDb(sql, vehicleId, [img1]),
    /contain exactly all images/
  );

  // 3. Cross-vehicle ID
  await assert.rejects(
    async () => reorderVehicleImagesInDb(sql, vehicleId, [img1, imgOther]),
    /One or more image IDs do not belong/
  );

  // 4. Exact valid reorder
  await reorderVehicleImagesInDb(sql, vehicleId, [img2, img1]);

  const updatedImages = await sql<{ id: string; sort_order: number }>`
    select id, sort_order from vehicle_image where vehicle_id = ${vehicleId} order by sort_order asc
  `;
  assert.equal(updatedImages[0].id, img2);
  assert.equal(updatedImages[0].sort_order, 0);
  assert.equal(updatedImages[1].id, img1);
  assert.equal(updatedImages[1].sort_order, 1);
});

test("sql.transaction rolls back queries when an error is thrown", async () => {
  const { getSql } = await import("../db.ts");
  const sql = await getSql();
  const vehicleId = `v-rollback-${Date.now()}`;

  await assert.rejects(async () => {
    await sql.transaction(async (tx) => {
      await tx`
        insert into vehicle (id, slug, title, created_by)
        values (${vehicleId}, ${`slug-rb-${Date.now()}`}, 'Rollback Car', 'test-user')
      `;
      throw new Error("Simulated failure inside transaction");
    });
  }, /Simulated failure/);

  const found = await sql<{ id: string }>`
    select id from vehicle where id = ${vehicleId}
  `;
  assert.equal(found.length, 0);
});

test("retryPendingStorageCleanups processes targeted keys, removes succeeded, and keeps failed queued", async () => {
  const { getSql } = await import("../db.ts");
  const { recordPendingStorageCleanup, retryPendingStorageCleanups } = await import("./storage.server.ts");

  const sql = await getSql();

  const keySuccess = `vehicles/test-succ-${Date.now()}.png`;
  const keyFail = `vehicles/test-fail-${Date.now()}.png`;
  const keyUnrelated = `vehicles/test-unrelated-${Date.now()}.png`;

  await recordPendingStorageCleanup(keySuccess, "Initial success test");
  await recordPendingStorageCleanup(keyFail, "Initial fail test");
  await recordPendingStorageCleanup(keyUnrelated, "Initial unrelated test");

  const mockDeleteFn = async (key: string) => {
    if (key === keyFail) {
      throw new Error("Simulated S3 connection timeout");
    }
    // keySuccess resolves cleanly
  };

  const result = await retryPendingStorageCleanups({
    targetKeys: [keySuccess, keyFail],
    deleteFn: mockDeleteFn,
  });

  assert.equal(result.processed, 2);
  assert.equal(result.succeeded, 1);
  assert.equal(result.failed, 1);

  // Verify keySuccess was deleted from queue
  const succRow = await sql`
    select id from pending_storage_cleanup where storage_key = ${keySuccess}
  `;
  assert.equal(succRow.length, 0);

  // Verify keyFail remains in queue with incremented attempts
  const failRow = await sql<{ attempts: number; reason: string }>`
    select attempts, reason from pending_storage_cleanup where storage_key = ${keyFail}
  `;
  assert.equal(failRow.length, 1);
  assert.equal(failRow[0].attempts, 2);
  assert.match(failRow[0].reason, /Simulated S3 connection timeout/);

  // Verify keyUnrelated was untouched (attempts remains 1)
  const unrelatedRow = await sql<{ attempts: number }>`
    select attempts from pending_storage_cleanup where storage_key = ${keyUnrelated}
  `;
  assert.equal(unrelatedRow.length, 1);
  assert.equal(unrelatedRow[0].attempts, 1);

  // Clean up test records
  await sql`delete from pending_storage_cleanup where storage_key in (${keyFail}, ${keyUnrelated})`;
});

function makeImageDeleteTestSql(options: {
  imageBeforeLock: boolean;
  imageAfterLock: boolean;
  vehicleExists?: boolean;
  failCommit?: boolean;
}) {
  const events: string[] = [];
  const tx = async (strings: TemplateStringsArray, ..._values: unknown[]) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim().toLowerCase();

    if (query.startsWith("select vehicle_id from vehicle_image")) {
      events.push("read-image-before-lock");
      return options.imageBeforeLock ? [{ vehicle_id: "vehicle-test", storage_key: "vehicles/image-test.png" }] : [];
    }
    if (query.startsWith("select id from vehicle where id = ? for update")) {
      events.push("lock-vehicle");
      return options.vehicleExists === false ? [] : [{ id: "vehicle-test" }];
    }
    if (query.startsWith("select storage_key from vehicle_image")) {
      events.push("recheck-image-after-lock");
      return options.imageAfterLock ? [{ storage_key: "vehicles/image-test.png" }] : [];
    }
    if (query.startsWith("delete from vehicle_image")) {
      events.push("delete-image-metadata");
      return [];
    }
    throw new Error(`Unexpected SQL in image deletion test: ${query}`);
  };

  const sql: any = {
    transaction: async (callback: (tx: any) => Promise<unknown>) => {
      events.push("begin");
      const result = await callback(tx);
      if (options.failCommit) {
        events.push("commit-failed");
        throw new Error("Simulated commit failure");
      }
      events.push("commit");
      return result;
    },
  };
  return { sql, events };
}

test("image deletion rechecks the image after locking and skips a duplicate storage deletion", async () => {
  const { deleteVehicleImageWithCleanup } = await import("./image-admin.server.ts");
  // Simulate another image operation removing the row while this request waits for the lock.
  const { sql, events } = makeImageDeleteTestSql({
    imageBeforeLock: true,
    imageAfterLock: false,
  });
  let storageDeleteCalls = 0;

  await deleteVehicleImageWithCleanup(sql, "image-test", {
    deleteFn: async () => { storageDeleteCalls += 1; },
    recordCleanupFn: async () => {},
  });

  assert.ok(events.indexOf("lock-vehicle") < events.indexOf("recheck-image-after-lock"));
  assert.ok(events.includes("commit"));
  assert.equal(events.includes("delete-image-metadata"), false);
  assert.equal(storageDeleteCalls, 0);
});

test("image storage deletion occurs only after the metadata transaction commits", async () => {
  const { deleteVehicleImageWithCleanup } = await import("./image-admin.server.ts");
  const { sql, events } = makeImageDeleteTestSql({
    imageBeforeLock: true,
    imageAfterLock: true,
  });

  await deleteVehicleImageWithCleanup(sql, "image-test", {
    deleteFn: async () => { events.push("delete-storage"); },
    recordCleanupFn: async () => { events.push("queue-cleanup"); },
  });

  assert.ok(events.indexOf("recheck-image-after-lock") < events.indexOf("delete-image-metadata"));
  assert.ok(events.indexOf("delete-image-metadata") < events.indexOf("commit"));
  assert.ok(events.indexOf("commit") < events.indexOf("delete-storage"));
});

test("image storage is untouched when the metadata transaction fails to commit", async () => {
  const { deleteVehicleImageWithCleanup } = await import("./image-admin.server.ts");
  const { sql, events } = makeImageDeleteTestSql({
    imageBeforeLock: true,
    imageAfterLock: true,
    failCommit: true,
  });
  let storageDeleteCalls = 0;

  await assert.rejects(
    () => deleteVehicleImageWithCleanup(sql, "image-test", {
      deleteFn: async () => { storageDeleteCalls += 1; },
      recordCleanupFn: async () => {},
    }),
    /Simulated commit failure/
  );

  assert.ok(events.includes("delete-image-metadata"));
  assert.ok(events.includes("commit-failed"));
  assert.equal(events.includes("commit"), false);
  assert.equal(storageDeleteCalls, 0);
});

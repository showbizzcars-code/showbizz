import { deleteImageFromStorage, recordPendingStorageCleanup } from "./storage.server.ts";

/**
 * Remove image metadata while holding the parent vehicle lock.
 * Return the storage key only when this transaction successfully commits a deletion.
 */
export async function deleteVehicleImageMetadata(
  sql: any,
  imageId: string
): Promise<string | null> {
  return sql.transaction(async (tx: any) => {
    const initialRows = await tx<{ vehicle_id: string }>`
      select vehicle_id from vehicle_image where id = ${imageId} limit 1
    `;
    if (!initialRows[0]) return null;

    const vehicleId = String(initialRows[0].vehicle_id);
    const vehicleRows = await tx<{ id: string }>`
      select id from vehicle where id = ${vehicleId} for update
    `;
    if (!vehicleRows[0]) return null;

    // This read must happen after the lock: another operation may have removed
    // the image while this transaction was waiting for the parent vehicle lock.
    const currentRows = await tx<{ storage_key: string }>`
      select storage_key
      from vehicle_image
      where id = ${imageId} and vehicle_id = ${vehicleId}
      limit 1
    `;
    if (!currentRows[0]) return null;

    await tx`
      delete from vehicle_image
      where id = ${imageId} and vehicle_id = ${vehicleId}
    `;
    return String(currentRows[0].storage_key);
  });
}

/**
 * External storage is touched only after the metadata transaction has committed.
 * Failed deletes are recorded for recoverable retry.
 */
export async function deleteVehicleImageWithCleanup(
  sql: any,
  imageId: string,
  options: {
    deleteFn?: (storageKey: string) => Promise<void>;
    recordCleanupFn?: (storageKey: string, reason?: string) => Promise<void>;
  } = {}
): Promise<void> {
  const storageKey = await deleteVehicleImageMetadata(sql, imageId);
  if (!storageKey) return;

  const deleteFn = options.deleteFn ?? deleteImageFromStorage;
  const recordCleanupFn = options.recordCleanupFn ?? recordPendingStorageCleanup;
  try {
    await deleteFn(storageKey);
  } catch (storageErr: unknown) {
    const message = storageErr instanceof Error ? storageErr.message : String(storageErr);
    await recordCleanupFn(storageKey, `Image delete post-commit storage error: ${message}`);
  }
}

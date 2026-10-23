import { retryPendingStorageCleanups } from "../src/lib/showbizz/storage.server.ts";

async function runCleanup() {
  console.log("Running pending storage cleanups...");
  const result = await retryPendingStorageCleanups();
  console.log(
    `Cleanup summary: processed ${result.processed}, succeeded ${result.succeeded}, failed ${result.failed}.`
  );

  if (result.failed > 0) {
    console.error(`Storage cleanup completed with ${result.failed} failures.`);
    process.exit(1);
  }
}

runCleanup().catch((err) => {
  console.error("Storage cleanup script failed:", err);
  process.exit(1);
});

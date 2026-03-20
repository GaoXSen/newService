import { closePool, ensureDatabase } from "../support/db.js";
import { loadEnv } from "../support/env.js";

async function main() {
  loadEnv();
  await ensureDatabase();
  console.log("Database schema initialized.");
}

main()
  .finally(async () => {
    await closePool();
  })
  .catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });

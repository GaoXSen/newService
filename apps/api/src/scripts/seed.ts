import { closePool, ensureDatabase, ensureDefaultData } from "../support/db.js";
import { loadEnv } from "../support/env.js";

async function main() {
  loadEnv();
  await ensureDatabase();
  await ensureDefaultData();

  console.log(`Admin account: ${process.env.SEED_ADMIN_ACCOUNT ?? "owner"}`);
  console.log(`Admin password: ${process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!"}`);
  console.log(`Invite code: ${process.env.SEED_INVITE_CODE ?? "FAMILY-ACCESS"}`);
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

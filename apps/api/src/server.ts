import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { APP_NAME } from "@private-assistant/shared";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { closePool, ensureDatabase, ensureDefaultData } from "./support/db.js";
import { loadEnv } from "./support/env.js";

export async function buildApp() {
  loadEnv();
  await ensureDatabase();
  await ensureDefaultData();

  const app = Fastify({
    logger: true,
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? "replace-me-access",
  });

  app.get("/", async () => ({
    name: APP_NAME,
    service: "api",
    status: "ok",
  }));

  app.addHook("onClose", async () => {
    await closePool();
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);

  return app;
}

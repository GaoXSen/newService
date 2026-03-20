import "@fastify/jwt";
import type { AccessTokenPayload, RefreshTokenPayload } from "../support/tokens.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: AccessTokenPayload;
  }
}

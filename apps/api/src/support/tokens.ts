import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { SafeUser, UserRole, UserStatus } from "./db.js";

type TokenBundleArgs = {
  app: FastifyInstance;
  user: Pick<SafeUser, "id" | "account" | "nickname" | "role" | "status">;
  sessionId: string;
  refreshTokenId: string;
};

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

export function createRefreshTokenId() {
  return randomUUID();
}

export async function issueTokens({
  app,
  user,
  sessionId,
  refreshTokenId,
}: TokenBundleArgs) {
  const accessToken = await app.jwt.sign(
    {
      sub: user.id,
      account: user.account,
      role: user.role,
      status: user.status,
      sessionId,
      type: "access",
    },
    {
      expiresIn: ACCESS_EXPIRES_IN,
    }
  );

  const refreshToken = await app.jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sessionId,
      refreshTokenId,
      type: "refresh",
    },
    {
      expiresIn: REFRESH_EXPIRES_IN,
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_EXPIRES_IN,
  };
}

export type AccessTokenPayload = {
  sub: string;
  account: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  role: UserRole;
  sessionId: string;
  refreshTokenId: string;
  type: "refresh";
};

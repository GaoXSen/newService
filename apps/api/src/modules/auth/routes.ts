import { addDays, isAfter } from "date-fns";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createSession,
  createUser,
  findInviteByCode,
  findSessionById,
  findUserByAccount,
  findUserById,
  markInviteUsed,
  revokeSession,
  rotateSession,
  toSafeUser,
  type SafeUser,
} from "../../support/db.js";
import { hashPassword, verifyPassword } from "../../support/password.js";
import {
  createRefreshTokenId,
  issueTokens,
  type RefreshTokenPayload,
} from "../../support/tokens.js";

const loginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(8),
});

const registerSchema = z.object({
  account: z.string().min(3),
  inviteCode: z.string().min(4),
  nickname: z.string().min(1),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const sessionTtlDays = 30;

function getClientMeta(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"] ?? null,
    ipAddress: request.ip,
  };
}

function toUserDto(user: {
  id: string;
  account: string;
  nickname: string;
  role: string;
  status: string;
  created_at: Date;
}) {
  return {
    id: user.id,
    account: user.account,
    nickname: user.nickname,
    role: user.role,
    status: user.status,
    createdAt: user.created_at.toISOString(),
  };
}

async function createUserSession(
  app: FastifyInstance,
  request: FastifyRequest,
  user: SafeUser
) {
  const refreshTokenId = createRefreshTokenId();
  const session = await createSession({
    userId: user.id,
    refreshTokenId,
    expiresAt: addDays(new Date(), sessionTtlDays),
    ...getClientMeta(request),
  });

  const tokens = await issueTokens({
    app,
    user,
    sessionId: session.id,
    refreshTokenId,
  });

  return {
    tokens,
    session,
  };
}

async function requireAccess(request: FastifyRequest) {
  await request.jwtVerify();
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const payload = registerSchema.parse(request.body);

    const invite = await findInviteByCode(payload.inviteCode);

    if (!invite || invite.disabled_at || invite.used_at) {
      return reply.conflict("邀请码不可用。");
    }

    if (invite.expires_at && isAfter(new Date(), invite.expires_at)) {
      return reply.conflict("邀请码已过期。");
    }

    const existingUser = await findUserByAccount(payload.account);

    if (existingUser) {
      return reply.conflict("账号已存在。");
    }

    const passwordHash = await hashPassword(payload.password);

    const user = await createUser({
      account: payload.account,
      nickname: payload.nickname,
      passwordHash,
    });

    await markInviteUsed(invite.id);

    const safeUser = toSafeUser(user);
    const { tokens } = await createUserSession(app, request, safeUser);

    return reply.code(201).send({
      user: toUserDto(safeUser),
      ...tokens,
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    const user = await findUserByAccount(payload.account);

    if (!user) {
      return reply.unauthorized("账号或密码错误。");
    }

    if (user.status !== "ACTIVE") {
      return reply.forbidden("当前账号已被停用。");
    }

    const matched = await verifyPassword(payload.password, user.password_hash);
    if (!matched) {
      return reply.unauthorized("账号或密码错误。");
    }

    const safeUser = toSafeUser(user);
    const { tokens } = await createUserSession(app, request, safeUser);

    return reply.send({
      user: toUserDto(safeUser),
      ...tokens,
    });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const payload = refreshSchema.parse(request.body);

    let decoded: RefreshTokenPayload;
    try {
      decoded = await app.jwt.verify<RefreshTokenPayload>(payload.refreshToken);
    } catch {
      return reply.unauthorized("刷新令牌无效。");
    }

    if (decoded.type !== "refresh") {
      return reply.unauthorized("刷新令牌类型错误。");
    }

    const session = await findSessionById(decoded.sessionId);

    if (
      !session ||
      session.revoked_at ||
      session.refresh_token_id !== decoded.refreshTokenId ||
      session.user_status !== "ACTIVE" ||
      isAfter(new Date(), session.expires_at)
    ) {
      return reply.unauthorized("会话已失效。");
    }

    const nextRefreshTokenId = createRefreshTokenId();
    await rotateSession(session.id, nextRefreshTokenId, addDays(new Date(), sessionTtlDays));

    const user = {
      id: session.user_id,
      account: session.user_account,
      nickname: session.user_nickname,
      role: session.user_role,
      status: session.user_status,
      created_at: session.user_created_at,
    };

    const tokens = await issueTokens({
      app,
      user: {
        id: user.id,
        account: user.account,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
      },
      sessionId: session.id,
      refreshTokenId: nextRefreshTokenId,
    });

    return reply.send({
      user: toUserDto(user),
      ...tokens,
    });
  });

  app.get(
    "/auth/me",
    {
      preHandler: requireAccess,
    },
    async (request, reply) => {
      const user = await findUserById(request.user.sub);

      if (!user) {
        return reply.notFound("用户不存在。");
      }

      return reply.send({
        user: toUserDto(toSafeUser(user)),
      });
    }
  );

  app.post(
    "/auth/logout",
    {
      preHandler: requireAccess,
    },
    async (request, reply) => {
      await revokeSession(request.user.sessionId);

      return reply.code(204).send();
    }
  );
}

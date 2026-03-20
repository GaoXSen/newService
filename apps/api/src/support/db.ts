import { randomUUID } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import { hashPassword } from "./password.js";

export type UserRole = "ADMIN" | "FAMILY";
export type UserStatus = "ACTIVE" | "DISABLED";

export type DbUser = {
  id: string;
  account: string;
  nickname: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
};

export type SafeUser = Omit<DbUser, "password_hash" | "updated_at">;

export type DbSession = {
  id: string;
  user_id: string;
  refresh_token_id: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
};

export type DbInvite = {
  id: string;
  code: string;
  note: string | null;
  expires_at: Date | null;
  used_at: Date | null;
  disabled_at: Date | null;
  created_at: Date;
};

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params);
}

export async function closePool() {
  if (pool) {
    const currentPool = pool;
    pool = null;
    await currentPool.end();
  }
}

export async function ensureDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'FAMILY',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      note TEXT,
      expires_at TIMESTAMPTZ,
      used_at TIMESTAMPTZ,
      disabled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_id TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function ensureDefaultData() {
  const adminAccount = process.env.SEED_ADMIN_ACCOUNT ?? "owner";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminNickname = process.env.SEED_ADMIN_NICKNAME ?? "管理员";
  const inviteCode = process.env.SEED_INVITE_CODE ?? "FAMILY-ACCESS";

  const existingAdmin = await findUserByAccount(adminAccount);
  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await query(
      `
        INSERT INTO users (id, account, nickname, password_hash, role, status)
        VALUES ($1, $2, $3, $4, 'ADMIN', 'ACTIVE')
      `,
      [randomUUID(), adminAccount, adminNickname, passwordHash]
    );
  }

  const existingInvite = await findInviteByCode(inviteCode);
  if (!existingInvite) {
    await query(
      `
        INSERT INTO invites (id, code, note)
        VALUES ($1, $2, $3)
      `,
      [randomUUID(), inviteCode, "Default family invite"]
    );
  }
}

export async function findUserByAccount(account: string) {
  const result = await query<DbUser>(
    `
      SELECT *
      FROM users
      WHERE account = $1
      LIMIT 1
    `,
    [account]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await query<DbUser>(
    `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createUser(input: {
  account: string;
  nickname: string;
  passwordHash: string;
  role?: UserRole;
}) {
  const result = await query<DbUser>(
    `
      INSERT INTO users (id, account, nickname, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      RETURNING *
    `,
    [
      randomUUID(),
      input.account,
      input.nickname,
      input.passwordHash,
      input.role ?? "FAMILY",
    ]
  );

  return result.rows[0];
}

export async function findInviteByCode(code: string) {
  const result = await query<DbInvite>(
    `
      SELECT *
      FROM invites
      WHERE code = $1
      LIMIT 1
    `,
    [code]
  );

  return result.rows[0] ?? null;
}

export async function markInviteUsed(id: string) {
  await query(
    `
      UPDATE invites
      SET used_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

export async function createSession(input: {
  userId: string;
  refreshTokenId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}) {
  const result = await query<DbSession>(
    `
      INSERT INTO sessions (id, user_id, refresh_token_id, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      randomUUID(),
      input.userId,
      input.refreshTokenId,
      input.userAgent,
      input.ipAddress,
      input.expiresAt,
    ]
  );

  return result.rows[0];
}

export async function findSessionById(id: string) {
  const result = await query<(DbSession & { user_account: string; user_nickname: string; user_role: UserRole; user_status: UserStatus; user_created_at: Date })>(
    `
      SELECT
        s.*,
        u.account AS user_account,
        u.nickname AS user_nickname,
        u.role AS user_role,
        u.status AS user_status,
        u.created_at AS user_created_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function rotateSession(id: string, refreshTokenId: string, expiresAt: Date) {
  const result = await query<DbSession>(
    `
      UPDATE sessions
      SET refresh_token_id = $2,
          expires_at = $3,
          revoked_at = NULL
      WHERE id = $1
      RETURNING *
    `,
    [id, refreshTokenId, expiresAt]
  );

  return result.rows[0] ?? null;
}

export async function revokeSession(id: string) {
  await query(
    `
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

export function toSafeUser(user: DbUser): SafeUser {
  const { password_hash: _passwordHash, updated_at: _updatedAt, ...safeUser } = user;
  return safeUser;
}

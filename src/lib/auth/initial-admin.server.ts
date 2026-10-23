import { randomUUID, timingSafeEqual } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { getSql } from "../db";
import type {
  InitialAdminRegistration,
  InitialAdminSetupStatus,
} from "./initial-admin";

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function secureTokenMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return (
    providedBytes.length > 0 &&
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}

export async function readInitialAdminSetupStatus(): Promise<InitialAdminSetupStatus> {
  const rawToken = env("ADMIN_SETUP_TOKEN");
  const tokenTooWeak = Boolean(rawToken && rawToken.length < 32);
  const tokenConfigured = Boolean(rawToken && rawToken.length >= 32);
  const authEnabled = env("VITE_AUTH_ENABLED") !== "false";

  const sql = await getSql();
  const rows = await sql.query<{ has_admin: boolean }>(
    "select exists (select 1 from staff_member where role = 'admin') as has_admin",
  );
  if (!rows[0]) {
    throw new Error("Could not verify initial administrator setup status.");
  }

  const hasAdmin = rows[0].has_admin === true;
  return {
    hasAdmin,
    tokenConfigured,
    tokenTooWeak,
    authEnabled,
    available: !hasAdmin && tokenConfigured && authEnabled,
  };
}

export async function createInitialAdmin(
  input: InitialAdminRegistration,
): Promise<{ ok: true }> {
  const setupToken = env("ADMIN_SETUP_TOKEN");
  if (!setupToken || setupToken.length < 32) {
    throw new Error(
      "Initial administrator setup is disabled. Configure a strong ADMIN_SETUP_TOKEN first.",
    );
  }
  if (env("VITE_AUTH_ENABLED") === "false") {
    throw new Error(
      "Authentication is disabled. Set VITE_AUTH_ENABLED=true before creating the first administrator.",
    );
  }

  const suppliedToken =
    input && typeof input.setupToken === "string" ? input.setupToken : "";
  if (!secureTokenMatch(suppliedToken, setupToken)) {
    throw new Error("The initial setup token is incorrect.");
  }

  const name = input && typeof input.name === "string" ? input.name.trim() : "";
  const email =
    input && typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password =
    input && typeof input.password === "string" ? input.password : "";

  if (name.length < 2 || name.length > 100) {
    throw new Error("Name must be between 2 and 100 characters.");
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("Use a password between 12 and 128 characters.");
  }

  const passwordHash = await hashPassword(password);
  const sql = await getSql();

  return sql.transaction(async (tx) => {
    // Serialize simultaneous first-run requests. The second request must see
    // the first admin after the transaction lock is released.
    await tx.query("select pg_advisory_xact_lock($1, $2)", [184731, 269115]);

    const admins = await tx.query<{ user_id: string }>(
      "select user_id from staff_member where role = 'admin' limit 1",
    );
    if (admins.length > 0) {
      throw new Error(
        "Initial administrator registration is already complete. Please sign in.",
      );
    }

    const existingUsers = await tx.query<{ id: string }>(
      'select id from "user" where lower(email) = lower($1) limit 1',
      [email],
    );
    if (existingUsers.length > 0) {
      throw new Error(
        "An account with this email already exists. Use a different email or have an existing administrator authorize the account.",
      );
    }

    const userId = randomUUID();
    const accountId = randomUUID();

    await tx.query(
      'insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, false, now(), now())',
      [userId, name, email],
    );
    await tx.query(
      'insert into "account" (id, "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") values ($1, $2, \'credential\', $3, $4, now(), now())',
      [accountId, email, userId, passwordHash],
    );
    await tx.query(
      "insert into staff_member (user_id, role, granted_by, created_at) values ($1, 'admin', null, now())",
      [userId],
    );

    return { ok: true };
  });
}

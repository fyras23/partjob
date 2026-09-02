/**
 * lib/db.ts
 *
 * Two exports:
 *  - `prisma`  — PrismaClient (v7, driver-adapter based) for ORM queries
 *  - `pool`    — raw pg.Pool for parameterised SQL when needed
 *  - `query()` — convenience wrapper around the raw pool
 *
 * Both reuse a single instance across Next.js hot-reloads in development.
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// ── Version tag — bump this whenever you regenerate Prisma ────────────────────
// This forces a new client instance when the schema changes, clearing the
// stale globalThis cache in Next.js dev mode.
const SCHEMA_VERSION = "v9"; // messaging models added

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var _prismaSchemaVersion: string | undefined;
}

// ── Raw pg Pool ────────────────────────────────────────────────────────────────
export const pool: Pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    max: 10,
  });

// ── Prisma Client (v7 — driver adapter required) ──────────────────────────────
// Force a fresh client if the schema version changed (e.g. after prisma generate)
const needsNewClient =
  !globalThis._prisma ||
  globalThis._prismaSchemaVersion !== SCHEMA_VERSION;

export const prisma: PrismaClient =
  needsNewClient
    ? new PrismaClient({ adapter: new PrismaPg(pool) })
    : globalThis._prisma!;

// Cache in development to survive hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
  globalThis._prisma = prisma;
  globalThis._prismaSchemaVersion = SCHEMA_VERSION;
}

// ── Raw SQL helper ─────────────────────────────────────────────────────────────
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export default prisma;

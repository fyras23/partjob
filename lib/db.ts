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

// ── Raw pg Pool ────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const pool: Pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    max: 10,
  });

// ── Prisma Client (v7 — driver adapter required) ───────────────────────────────

export const prisma: PrismaClient =
  globalThis._prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

// Cache instances in development to survive hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
  globalThis._prisma = prisma;
}

// ── Raw SQL helper ─────────────────────────────────────────────────────────────

/**
 * Run a parameterised SQL query and return the rows.
 *
 * @example
 * const jobs = await query("SELECT * FROM jobs WHERE active = $1", [true]);
 */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export default prisma;

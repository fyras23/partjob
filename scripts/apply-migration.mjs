import { readFileSync } from "fs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://firas:DNSzz5G4Qa6sBE4O8bNKQg@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full",
  ssl: true,
});

const raw = readFileSync(
  "prisma/migrations/20260901132557_full_schema/migration.sql",
  "utf8"
);

// Remove comment lines, then split on semicolons
const withoutComments = raw.replace(/--[^\n]*/g, "");
const statements = withoutComments
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Found ${statements.length} statements to execute.\n`);

const client = await pool.connect();
try {
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      await client.query(stmt);
      console.log("✅", preview);
    } catch (e) {
      if (
        e.message.toLowerCase().includes("already exists") ||
        e.message.toLowerCase().includes("duplicate")
      ) {
        console.log("⏭  already exists:", preview);
      } else {
        console.error("❌ FAILED:", preview);
        console.error("   Error:", e.message);
        throw e;
      }
    }
  }
  console.log("\n🎉 All statements executed.");
} finally {
  client.release();
  await pool.end();
}

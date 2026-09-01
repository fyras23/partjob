import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://firas:DNSzz5G4Qa6sBE4O8bNKQg@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full",
  ssl: true,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("✅ Connected to CockroachDB");

    // 1. Create a temporary test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _kiro_test (
        id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msg  TEXT NOT NULL,
        ts   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table _kiro_test ready");

    // 2. Insert a row
    const insert = await client.query(
      `INSERT INTO _kiro_test (msg) VALUES ($1) RETURNING id, msg, ts`,
      ["hello from partjob"]
    );
    const row = insert.rows[0];
    console.log("✅ Inserted row:", row);

    // 3. Read it back
    const select = await client.query(
      `SELECT * FROM _kiro_test WHERE id = $1`,
      [row.id]
    );
    console.log("✅ Read back:", select.rows[0]);

    // 4. Clean up
    await client.query(`DROP TABLE _kiro_test`);
    console.log("✅ Cleaned up — test table dropped");

    console.log("\n🎉 All good! DB is storing and retrieving correctly.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

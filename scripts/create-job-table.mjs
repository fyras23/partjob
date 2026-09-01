import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://firas:DNSzz5G4Qa6sBE4O8bNKQg@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full",
  ssl: true,
});

const sql = `
  CREATE TABLE IF NOT EXISTS "job" (
    "id"          STRING        NOT NULL,
    "jobName"     STRING        NOT NULL,
    "description" STRING        NOT NULL,
    "postedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl"    STRING,
    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
  )
`;

try {
  await pool.query(sql);
  console.log('✅ Table "job" created (or already exists)');

  // Verify by describing the table
  const res = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'job'
    ORDER BY ordinal_position
  `);
  console.log("\nColumns:");
  res.rows.forEach((r) => console.log(`  ${r.column_name}  (${r.data_type})`));
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}

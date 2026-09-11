const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://firas:DNSzz5G4Qa6sBE4O8bNKQg@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full';
const pool = new Pool({ connectionString, ssl: true });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "StudentRating" (
        "id" STRING NOT NULL,
        "recruiterId" STRING NOT NULL,
        "studentId" STRING NOT NULL,
        "applicationId" STRING NOT NULL,
        "score" INT NOT NULL,
        "comment" STRING,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StudentRating_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "StudentRating_applicationId_key" UNIQUE ("applicationId")
      );
    `);

    await client.query(`ALTER TABLE "StudentRating" SET (schema_locked = false);`);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "StudentRating_studentId_idx"
      ON "StudentRating" ("studentId");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "StudentRating_recruiterId_idx"
      ON "StudentRating" ("recruiterId");
    `);

    await client.query(`
      ALTER TABLE "StudentRating"
      ADD CONSTRAINT "StudentRating_recruiterId_fkey"
      FOREIGN KEY ("recruiterId") REFERENCES "RecruiterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await client.query(`
      ALTER TABLE "StudentRating"
      ADD CONSTRAINT "StudentRating_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await client.query(`
      ALTER TABLE "StudentRating"
      ADD CONSTRAINT "StudentRating_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await client.query(`ALTER TABLE "StudentRating" SET (schema_locked = true);`);

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%Rating%' ORDER BY table_name");
    console.log('Rating tables:', res.rows.map((r) => r.table_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

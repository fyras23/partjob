import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://firas:DNSzz5G4Qa6sBE4O8bNKQg@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full",
  ssl: true,
});

const fks = [
  `ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Post" ADD CONSTRAINT "Post_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "RecruiterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Post" ADD CONSTRAINT "Post_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Application" ADD CONSTRAINT "Application_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Application" ADD CONSTRAINT "Application_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
];

const client = await pool.connect();
try {
  for (const stmt of fks) {
    try {
      await client.query(stmt);
      console.log("✅", stmt.slice(0, 70));
    } catch (e) {
      if (e.message.includes("already exists") || e.message.includes("duplicate")) {
        console.log("⏭  already exists:", stmt.slice(0, 70));
      } else {
        console.error("❌", e.message);
      }
    }
  }
  console.log("\n✅ FK constraints done.");
} finally {
  client.release();
  await pool.end();
}

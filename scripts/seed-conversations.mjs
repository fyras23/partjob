import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

// Fetch all approved applications that don't already have a conversation,
// joined with the student's userId and the recruiter's userId via the post.
const result = await client.query(`
  SELECT
    a.id           AS "applicationId",
    a."postId",
    a."studentId",
    sp."userId"    AS "studentUserId",
    rp."userId"    AS "recruiterUserId"
  FROM "Application" a
  JOIN "StudentProfile"   sp ON sp.id = a."studentId"
  JOIN "Post"             p  ON p.id  = a."postId"
  JOIN "RecruiterProfile" rp ON rp.id = p."recruiterId"
  LEFT JOIN "Conversation" c ON c."applicationId" = a.id
  WHERE a.status = 'APPROVED'
    AND c.id IS NULL
`);

console.log(`Found ${result.rows.length} approved application(s) without a conversation.`);

for (const row of result.rows) {
  console.log(`Creating conversation for application ${row.applicationId} ...`);
  await client.query(
    `INSERT INTO "Conversation" (id, "applicationId", "recruiterUserId", "studentUserId", "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
    [row.applicationId, row.recruiterUserId, row.studentUserId]
  );
  console.log(`  ✓  recruiter=${row.recruiterUserId}  student=${row.studentUserId}`);
}

// Verify
const convs = await client.query(`SELECT * FROM "Conversation"`);
console.log("\nConversations now in DB:", convs.rows.length);
console.log(convs.rows);

client.release();
await pool.end();

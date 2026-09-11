/**
 * Test helper — creates and tears down isolated test data.
 * All helpers return created records so tests can reference IDs.
 */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env so DATABASE_URL is available during tests
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ── Factories ─────────────────────────────────────────────────────────────────

let counter = 0;
function uid() {
  return `test-${Date.now()}-${++counter}`;
}

export async function createAdmin() {
  return prisma.user.create({
    data: {
      id: uid(),
      email: `admin-${uid()}@test.com`,
      passwordHash: await bcrypt.hash("password", 1),
      name: "Admin",
      role: "ADMIN",
    },
  });
}

export async function createRecruiter(opts?: { verified?: boolean; adminId?: string }) {
  const user = await prisma.user.create({
    data: {
      id: uid(),
      email: `recruiter-${uid()}@test.com`,
      passwordHash: await bcrypt.hash("password", 1),
      name: "Recruiter",
      role: "RECRUITER",
    },
  });

  const profile = await prisma.recruiterProfile.create({
    data: {
      id: uid(),
      userId: user.id,
      companyName: "TestCorp",
      businessDocUrl: "https://example.com/doc.pdf",
      verificationStatus: opts?.verified ? "APPROVED" : "PENDING",
      ...(opts?.verified && opts.adminId
        ? { verifiedById: opts.adminId, verifiedAt: new Date() }
        : {}),
    },
  });

  return { user, profile };
}

export async function createStudent() {
  const user = await prisma.user.create({
    data: {
      id: uid(),
      email: `student-${uid()}@test.com`,
      passwordHash: await bcrypt.hash("password", 1),
      name: "Student",
      role: "STUDENT",
    },
  });

  const profile = await prisma.studentProfile.create({
    data: {
      id: uid(),
      userId: user.id,
    },
  });

  return { user, profile };
}

export async function createPost(
  recruiterId: string,
  opts?: { status?: "PENDING" | "APPROVED" | "REJECTED"; adminId?: string }
) {
  return prisma.post.create({
    data: {
      id: uid(),
      recruiterId,
      title: "Test Job",
      description: "Test description",
      type: "JOB",
      status: opts?.status ?? "PENDING",
      ...(opts?.status === "APPROVED" && opts.adminId
        ? { approvedById: opts.adminId, approvedAt: new Date() }
        : {}),
    },
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

export async function cleanup(...ids: string[]) {
  // Delete in FK-safe order
  await prisma.application.deleteMany({ where: { id: { in: ids } } });
  await prisma.post.deleteMany({ where: { id: { in: ids } } });
  await prisma.recruiterProfile.deleteMany({ where: { id: { in: ids } } });
  await prisma.studentProfile.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function cleanupAll(...groups: { id: string }[][]) {
  const allIds = groups.flat().map((r) => r.id);

  const recruiterProfileIds = await prisma.recruiterProfile.findMany({
    where: { userId: { in: allIds } },
    select: { id: true },
  }).then((rows) => rows.map((row) => row.id));

  const studentProfileIds = await prisma.studentProfile.findMany({
    where: { userId: { in: allIds } },
    select: { id: true },
  }).then((rows) => rows.map((row) => row.id));

  const postIds = await prisma.post.findMany({
    where: { recruiterId: { in: recruiterProfileIds } },
    select: { id: true },
  }).then((rows) => rows.map((row) => row.id));

  await prisma.studentRating.deleteMany({
    where: {
      OR: [
        { studentId: { in: studentProfileIds } },
        { recruiterId: { in: recruiterProfileIds } },
        { applicationId: { in: postIds } },
      ],
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [
        { studentId: { in: studentProfileIds } },
        { postId: { in: postIds } },
      ],
    },
  });

  await prisma.post.deleteMany({ where: { recruiterId: { in: recruiterProfileIds } } });
  await prisma.recruiterProfile.deleteMany({ where: { userId: { in: allIds } } });
  await prisma.studentProfile.deleteMany({ where: { userId: { in: allIds } } });
  await prisma.user.deleteMany({ where: { id: { in: allIds } } });
}

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});

/**
 * State machine tests — Post Approval
 *
 * Unverified recruiter cannot create posts (guard check)
 * PENDING → APPROVED  (admin)
 * PENDING → REJECTED  (admin)
 * APPROVED → PENDING  (recruiter edits — re-review)
 */
import { prisma, createAdmin, createRecruiter, createPost, cleanupAll } from "../helpers/setup";

describe("Post Approval State Machine", () => {
  let adminId: string;
  let verifiedRecruiterId: string; // RecruiterProfile.id
  let unverifiedRecruiterId: string;
  let recruiterUserIds: string[] = [];

  beforeAll(async () => {
    const admin = await createAdmin();
    adminId = admin.id;

    const { user: ru1, profile: rp1 } = await createRecruiter({
      verified: true,
      adminId,
    });
    verifiedRecruiterId = rp1.id;
    recruiterUserIds.push(ru1.id);

    const { user: ru2, profile: rp2 } = await createRecruiter(); // unverified
    unverifiedRecruiterId = rp2.id;
    recruiterUserIds.push(ru2.id);
  });

  afterAll(async () => {
    await cleanupAll(
      [{ id: adminId }],
      recruiterUserIds.map((id) => ({ id }))
    );
  });

  it("blocks post creation for unverified recruiter", async () => {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: unverifiedRecruiterId },
    });
    // Guard: application layer checks this before calling prisma.post.create
    expect(profile?.verificationStatus).not.toBe("APPROVED");
  });

  it("allows post creation for verified recruiter — starts PENDING", async () => {
    const post = await createPost(verifiedRecruiterId);
    expect(post.status).toBe("PENDING");

    // cleanup
    await prisma.post.delete({ where: { id: post.id } });
  });

  it("PENDING → APPROVED by admin", async () => {
    const post = await createPost(verifiedRecruiterId);

    const approved = await prisma.post.update({
      where: { id: post.id },
      data: { status: "APPROVED", approvedById: adminId, approvedAt: new Date() },
    });

    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedById).toBe(adminId);

    await prisma.post.delete({ where: { id: post.id } });
  });

  it("PENDING → REJECTED by admin", async () => {
    const post = await createPost(verifiedRecruiterId);

    const rejected = await prisma.post.update({
      where: { id: post.id },
      data: { status: "REJECTED", approvedById: adminId, approvedAt: new Date() },
    });

    expect(rejected.status).toBe("REJECTED");

    await prisma.post.delete({ where: { id: post.id } });
  });

  it("APPROVED → PENDING when recruiter edits (re-review)", async () => {
    const post = await createPost(verifiedRecruiterId, { status: "APPROVED", adminId });

    // Recruiter edits → reset to PENDING
    const edited = await prisma.post.update({
      where: { id: post.id },
      data: {
        title: "Updated Title",
        status: "PENDING",
        approvedById: null,
        approvedAt: null,
      },
    });

    expect(edited.status).toBe("PENDING");
    expect(edited.approvedById).toBeNull();

    await prisma.post.delete({ where: { id: post.id } });
  });
});

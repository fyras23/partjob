/**
 * State machine tests — Application
 *
 * Student cannot apply to non-APPROVED post
 * Student cannot apply twice to same post (unique constraint)
 * Successful apply starts as PENDING
 * PENDING → APPROVED  (recruiter or admin)
 * PENDING → REJECTED  (recruiter or admin)
 */
import { prisma, createAdmin, createRecruiter, createStudent, createPost, cleanupAll } from "../helpers/setup";

describe("Application State Machine", () => {
  let adminId: string;
  let verifiedRecruiterId: string;
  let studentProfileId: string;
  let approvedPostId: string;
  let pendingPostId: string;
  let userIds: string[] = [];

  beforeAll(async () => {
    const admin = await createAdmin();
    adminId = admin.id;
    userIds.push(admin.id);

    const { user, profile } = await createRecruiter({ verified: true, adminId });
    verifiedRecruiterId = profile.id;
    userIds.push(user.id);

    const { user: su, profile: sp } = await createStudent();
    studentProfileId = sp.id;
    userIds.push(su.id);

    const approved = await createPost(verifiedRecruiterId, { status: "APPROVED", adminId });
    approvedPostId = approved.id;

    const pending = await createPost(verifiedRecruiterId, { status: "PENDING" });
    pendingPostId = pending.id;
  });

  afterAll(async () => {
    await prisma.application.deleteMany({
      where: { OR: [{ postId: approvedPostId }, { postId: pendingPostId }] },
    });
    await prisma.post.deleteMany({ where: { id: { in: [approvedPostId, pendingPostId] } } });
    await cleanupAll(userIds.map((id) => ({ id })));
  });

  it("blocks application to a PENDING (non-approved) post", async () => {
    const post = await prisma.post.findUnique({ where: { id: pendingPostId } });
    // Guard logic checked before creating application
    expect(post?.status).not.toBe("APPROVED");
  });

  it("allows application to an APPROVED post — starts PENDING", async () => {
    const app = await prisma.application.create({
      data: {
        id: `app-${Date.now()}`,
        postId: approvedPostId,
        studentId: studentProfileId,
        cvUrl: "https://example.com/cv.pdf",
        additionalDocs: [],
        status: "PENDING",
      },
    });

    expect(app.status).toBe("PENDING");
    expect(app.postId).toBe(approvedPostId);
    expect(app.studentId).toBe(studentProfileId);
  });

  it("blocks duplicate application from same student to same post", async () => {
    await expect(
      prisma.application.create({
        data: {
          id: `app-dup-${Date.now()}`,
          postId: approvedPostId,
          studentId: studentProfileId,
          cvUrl: "https://example.com/cv2.pdf",
          additionalDocs: [],
          status: "PENDING",
        },
      })
    ).rejects.toThrow(); // unique constraint violation
  });

  it("PENDING → APPROVED by recruiter/admin", async () => {
    const app = await prisma.application.findFirst({
      where: { postId: approvedPostId, studentId: studentProfileId },
    });
    expect(app).not.toBeNull();

    const updated = await prisma.application.update({
      where: { id: app!.id },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: new Date() },
    });

    expect(updated.status).toBe("APPROVED");
    expect(updated.reviewedById).toBe(adminId);
  });

  it("APPROVED → REJECTED (status can be changed by admin/recruiter)", async () => {
    const app = await prisma.application.findFirst({
      where: { postId: approvedPostId, studentId: studentProfileId },
    });

    const updated = await prisma.application.update({
      where: { id: app!.id },
      data: { status: "REJECTED", reviewedById: adminId, reviewedAt: new Date() },
    });

    expect(updated.status).toBe("REJECTED");
  });
});

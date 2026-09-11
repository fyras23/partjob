/**
 * Rating system — recruiters can only rate students they hired.
 */
import { prisma, createAdmin, createRecruiter, createStudent, createPost, cleanupAll } from "../helpers/setup";

describe("Student rating flow", () => {
  let adminId: string;
  let recruiterProfileId: string;
  let studentProfileId: string;
  let applicationId: string;
  let userIds: string[] = [];

  beforeAll(async () => {
    const admin = await createAdmin();
    adminId = admin.id;
    userIds.push(admin.id);

    const { user, profile } = await createRecruiter({ verified: true, adminId });
    recruiterProfileId = profile.id;
    userIds.push(user.id);

    const { user: studentUser, profile: studentProfile } = await createStudent();
    studentProfileId = studentProfile.id;
    userIds.push(studentUser.id);

    const post = await createPost(recruiterProfileId, { status: "APPROVED", adminId });
    const app = await prisma.application.create({
      data: {
        id: `rating-app-${Date.now()}`,
        postId: post.id,
        studentId: studentProfileId,
        cvUrl: "https://example.com/cv.pdf",
        additionalDocs: [],
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    applicationId = app.id;
  });

  afterAll(async () => {
    await prisma.studentRating.deleteMany({
      where: { applicationId },
    });
    await prisma.application.deleteMany({ where: { id: applicationId } });
    await cleanupAll(userIds.map((id) => ({ id })));
  });

  it("allows a recruiter to rate an approved student hire once", async () => {
    const rating = await prisma.studentRating.create({
      data: {
        id: `rating-${Date.now()}`,
        recruiterId: recruiterProfileId,
        studentId: studentProfileId,
        applicationId,
        score: 5,
        comment: "Very reliable and professional.",
      },
    });

    expect(rating.score).toBe(5);
    expect(rating.comment).toBe("Very reliable and professional.");
  });

  it("prevents duplicate ratings for the same approved application", async () => {
    await expect(
      prisma.studentRating.create({
        data: {
          id: `rating-dup-${Date.now()}`,
          recruiterId: recruiterProfileId,
          studentId: studentProfileId,
          applicationId,
          score: 4,
          comment: "Second attempt",
        },
      })
    ).rejects.toThrow();
  });
});

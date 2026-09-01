/**
 * State machine tests — Recruiter Verification
 *
 * PENDING → APPROVED  (admin)
 * PENDING → REJECTED  (admin)
 * REJECTED → PENDING  (recruiter resubmit)
 */
import { prisma, createAdmin, createRecruiter, cleanupAll } from "../helpers/setup";

describe("Recruiter Verification State Machine", () => {
  let adminId: string;
  let recruiterUserId: string;
  let recruiterProfileId: string;

  beforeAll(async () => {
    const admin = await createAdmin();
    adminId = admin.id;

    const { user, profile } = await createRecruiter();
    recruiterUserId = user.id;
    recruiterProfileId = profile.id;
  });

  afterAll(async () => {
    await cleanupAll(
      [{ id: adminId }],
      [{ id: recruiterUserId }]
    );
  });

  it("starts as PENDING", async () => {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterProfileId },
    });
    expect(profile?.verificationStatus).toBe("PENDING");
  });

  it("PENDING → APPROVED by admin", async () => {
    const updated = await prisma.recruiterProfile.update({
      where: { id: recruiterProfileId },
      data: {
        verificationStatus: "APPROVED",
        verifiedById: adminId,
        verifiedAt: new Date(),
      },
    });
    expect(updated.verificationStatus).toBe("APPROVED");
    expect(updated.verifiedById).toBe(adminId);
    expect(updated.verifiedAt).not.toBeNull();
  });

  it("PENDING → REJECTED by admin", async () => {
    // Reset to PENDING first
    await prisma.recruiterProfile.update({
      where: { id: recruiterProfileId },
      data: { verificationStatus: "PENDING", verifiedById: null, verifiedAt: null },
    });

    const updated = await prisma.recruiterProfile.update({
      where: { id: recruiterProfileId },
      data: { verificationStatus: "REJECTED", verifiedById: adminId, verifiedAt: new Date() },
    });
    expect(updated.verificationStatus).toBe("REJECTED");
  });

  it("REJECTED → PENDING on recruiter resubmit (new doc)", async () => {
    // Ensure it's REJECTED
    await prisma.recruiterProfile.update({
      where: { id: recruiterProfileId },
      data: { verificationStatus: "REJECTED" },
    });

    // Recruiter resubmits
    const resubmitted = await prisma.recruiterProfile.update({
      where: { id: recruiterProfileId },
      data: {
        verificationStatus: "PENDING",
        businessDocUrl: "https://example.com/new-doc.pdf",
        verifiedById: null,
        verifiedAt: null,
      },
    });
    expect(resubmitted.verificationStatus).toBe("PENDING");
    expect(resubmitted.businessDocUrl).toBe("https://example.com/new-doc.pdf");
    expect(resubmitted.verifiedById).toBeNull();
  });
});

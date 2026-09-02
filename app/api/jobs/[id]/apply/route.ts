import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ApplySchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushNotification } from "@/lib/notificationBus";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "STUDENT") return Errors.forbidden();

  const { id: postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { recruiter: { select: { userId: true, companyName: true } } },
  });
  if (!post) return Errors.notFound("Job");
  if (post.status !== "APPROVED") {
    return Errors.badRequest("This job is not currently accepting applications");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) return Errors.notFound("Student profile");

  const existing = await prisma.application.findUnique({
    where: { postId_studentId: { postId, studentId: studentProfile.id } },
  });
  if (existing) return Errors.conflict("You have already applied to this job");

  // ── Check capacity cap ────────────────────────────────────────────────────
  if (post.maxApplicants != null) {
    const approvedCount = await prisma.application.count({
      where: { postId, status: "APPROVED" },
    });
    if (approvedCount >= post.maxApplicants) {
      return Errors.badRequest(
        "This position is no longer accepting applications — all spots have been filled."
      );
    }
  }

  const body = await req.json();
  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const application = await prisma.application.create({
    data: {
      postId,
      studentId:      studentProfile.id,
      cvUrl:          parsed.data.cvUrl,
      additionalDocs: parsed.data.additionalDocs,
      status:         "PENDING",
    },
  });

  // Notify the recruiter
  pushNotification(post.recruiter.userId, {
    type:    "NEW_APPLICATION",
    status:  "PENDING",
    postId,
    title:   "New application received",
    message: `${session.user.name} applied to "${post.title}"`,
  });

  return NextResponse.json(application, { status: 201 });
}

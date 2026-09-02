import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushNotification } from "@/lib/notificationBus";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const { id } = await params;

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return Errors.notFound("Recruiter profile");

  const application = await prisma.application.findUnique({
    where: { id },
    include: { post: true, student: { select: { userId: true } } },
  });
  if (!application) return Errors.notFound("Application");
  if (application.post.recruiterId !== profile.id) return Errors.forbidden();

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status:       parsed.data.status,
      reviewedById: session.user.id,
      reviewedAt:   new Date(),
    },
  });

  // Auto-create a conversation when approved
  if (parsed.data.status === "APPROVED") {
    const existing = await prisma.conversation.findUnique({ where: { applicationId: id } });
    if (!existing) {
      await prisma.conversation.create({
        data: {
          applicationId:   id,
          recruiterUserId: session.user.id,
          studentUserId:   application.student.userId,
        },
      });
    }
  }

  // Notify the student in real time
  pushNotification(application.student.userId, {
    type:    "APPLICATION_UPDATE",
    status:  parsed.data.status,
    postId:  application.postId,
    title:   parsed.data.status === "APPROVED"
      ? `Application approved — ${application.post.title}`
      : `Application update — ${application.post.title}`,
    message: parsed.data.status === "APPROVED"
      ? "Congratulations! Your application was approved. You can now message the recruiter."
      : "The recruiter has reviewed your application.",
  });

  return NextResponse.json(updated);
}

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
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: { post: { select: { title: true } }, student: { select: { userId: true } } },
  });
  if (!application) return Errors.notFound("Application");

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // Notify the student in real time
  pushNotification(application.student.userId, {
    type:    "APPLICATION_UPDATE",
    status:  parsed.data.status,
    postId:  application.postId,
    title:   parsed.data.status === "APPROVED"
      ? `Application approved — ${application.post.title}`
      : `Application update — ${application.post.title}`,
    message: parsed.data.status === "APPROVED"
      ? "Congratulations! Your application has been approved."
      : "Your application was reviewed. Check your applications page for details.",
  });

  return NextResponse.json(updated);
}

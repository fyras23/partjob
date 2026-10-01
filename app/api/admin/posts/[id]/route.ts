import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { createNotification } from "@/lib/notificationBus";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return Errors.notFound("Post");
  if (post.status !== "REJECTED" || !post.moderationReason || !post.appealedAt || !post.appealMessage) {
    return Errors.badRequest("Admins can act on a post only after its recruiter submits an appeal.");
  }

  await prisma.application.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { recruiter: { select: { userId: true } } },
  });
  if (!post) return Errors.notFound("Post");
  if (post.status !== "REJECTED" || !post.moderationReason || !post.appealedAt || !post.appealMessage) {
    return Errors.badRequest("Admins can review a post only after its recruiter submits an appeal.");
  }

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status: parsed.data.status,
      approvedById: session.user.id,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
      rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.reason : null,
      appealedAt: null,
    },
  });

  // Notify the recruiter whose post was reviewed
  await createNotification(prisma, post.recruiter.userId, {
    type:    "POST_UPDATE",
    status:  parsed.data.status,
    postId:  id,
    title:   parsed.data.status === "APPROVED" ? `Appeal accepted: ${post.title}` : `Appeal declined: ${post.title}`,
    message: parsed.data.status === "APPROVED"
      ? "An admin accepted your appeal. Your post is now live for students."
      : `An admin reviewed your appeal and kept the post rejected. Reason: ${parsed.data.reason}`,
  });

  return NextResponse.json(updated);
}

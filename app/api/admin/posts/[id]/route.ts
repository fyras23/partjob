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

  const post = await prisma.post.findUnique({
    where: { id },
    include: { recruiter: { select: { userId: true } } },
  });
  if (!post) return Errors.notFound("Post");

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status: parsed.data.status,
      approvedById: session.user.id,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
    },
  });

  // Notify the recruiter whose post was reviewed
  pushNotification(post.recruiter.userId, {
    type:    "POST_UPDATE",
    status:  parsed.data.status,
    postId:  id,
    title:   parsed.data.status === "APPROVED" ? `Post approved: ${post.title}` : `Post rejected: ${post.title}`,
    message: parsed.data.status === "APPROVED"
      ? "Your job post is now live and visible to students."
      : "Your job post was rejected. You can edit and resubmit it.",
  });

  return NextResponse.json(updated);
}

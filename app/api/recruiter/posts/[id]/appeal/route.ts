import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";
import { PostAppealSchema } from "@/lib/validate";
import { pushToAllAdmins } from "@/lib/notificationBus";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const { id } = await params;
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return Errors.notFound("Recruiter profile");

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return Errors.notFound("Post");
  if (post.recruiterId !== profile.id) return Errors.forbidden();
  if (post.status !== "REJECTED" || !post.moderationReason) {
    return Errors.badRequest("Only posts automatically rejected by moderation can be appealed.");
  }
  if (post.appealMessage) return Errors.badRequest("This post has already been appealed.");

  const parsed = PostAppealSchema.safeParse(await req.json());
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.post.update({
    where: { id },
    data: { appealMessage: parsed.data.message, appealedAt: new Date() },
  });

  await pushToAllAdmins(prisma, {
    type: "NEW_POST",
    status: "PENDING",
    postId: post.id,
    title: `Post appeal: ${post.title}`,
    message: `${profile.companyName} appealed the automatic rejection of "${post.title}".`,
  });

  return NextResponse.json(updated, { status: 201 });
}
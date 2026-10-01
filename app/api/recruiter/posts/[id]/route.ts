import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UpdatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { createNotification } from "@/lib/notificationBus";
import { moderatePostContent } from "@/lib/postModeration";

// PATCH /api/recruiter/posts/:id — edit own post
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

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return Errors.notFound("Post");
  if (post.recruiterId !== profile.id) return Errors.forbidden();

  const body = await req.json();
  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const d = parsed.data;
  const title = d.title ?? post.title;
  const description = d.description ?? post.description;
  const location = d.location !== undefined ? d.location : post.location;
  const fields = d.fields ?? post.fields;
  const moderation = await moderatePostContent([
    title,
    description,
    location,
    ...fields,
  ].filter(Boolean).join("\n"));
  if (!moderation) {
    return NextResponse.json(
      { error: "Post screening is temporarily unavailable. Your changes were not saved. Please try again shortly." },
      { status: 503 },
    );
  }

  const automaticallyRejected = moderation.inappropriate;

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(d.title       !== undefined && { title:       d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.type        !== undefined && { type:        d.type }),
      ...(d.location    !== undefined && { location:    d.location    ?? null }),
      ...(d.imageUrl    !== undefined && { imageUrl:    d.imageUrl    ?? null }),
      ...(d.fields      !== undefined && { fields:      d.fields }),
      ...(d.startDate   !== undefined && { startDate:   d.startDate ? new Date(d.startDate) : null }),
      ...(d.endDate     !== undefined && { endDate:     d.endDate   ? new Date(d.endDate)   : null }),
      ...(d.hourlyRate    !== undefined && { hourlyRate:    d.hourlyRate    ?? null }),
      ...(d.dailyRate     !== undefined && { dailyRate:     d.dailyRate     ?? null }),
      ...(d.maxApplicants !== undefined && { maxApplicants: d.maxApplicants ?? null }),
      status: automaticallyRejected ? "REJECTED" : "APPROVED",
      moderationReason: automaticallyRejected ? moderation.reason : null,
      rejectionReason: automaticallyRejected ? moderation.reason : null,
      appealMessage: null,
      appealedAt: null,
      approvedById: null,
      approvedAt: automaticallyRejected ? null : new Date(),
    },
  });

  await createNotification(prisma, session.user.id, {
    type: "POST_UPDATE",
    status: updated.status,
    postId: updated.id,
    title: automaticallyRejected ? `Post rejected: ${updated.title}` : `Post published: ${updated.title}`,
    message: automaticallyRejected
      ? `Your edited post was rejected by automatic screening. Reason: ${moderation.reason} You can appeal from My Posts for an admin to review it.`
      : "Your edited post passed automatic screening and is live for students.",
  });

  return NextResponse.json(updated);
}

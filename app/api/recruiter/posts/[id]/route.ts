import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UpdatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { createNotification } from "@/lib/notificationBus";
import {
  postModerationHash,
  postModerationText,
  kickPostModerationQueue,
} from "@/lib/postModerationQueue";

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
  const content = postModerationText({ title, description, location, fields });
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
      status: "PENDING",
      moderationReason: null,
      rejectionReason: null,
      appealMessage: null,
      appealedAt: null,
      approvedById: null,
      approvedAt: null,
      moderationTasks: {
        create: { contentHash: postModerationHash(content) },
      },
    },
  });

  await createNotification(prisma, session.user.id, {
    type: "POST_UPDATE",
    status: "PENDING",
    postId: updated.id,
    title: `Screening started: ${updated.title}`,
    message: "Your edited post is queued for automatic screening. It will go live if approved, and you’ll be notified of the decision.",
  });

  after(kickPostModerationQueue);
  return NextResponse.json({ ...updated, screeningStatus: "QUEUED" }, { status: 202 });
}

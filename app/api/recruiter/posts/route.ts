import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { createNotification } from "@/lib/notificationBus";
import {
  postModerationHash,
  postModerationText,
  kickPostModerationQueue,
} from "@/lib/postModerationQueue";

// GET /api/recruiter/posts — list own posts
export async function GET() {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return Errors.notFound("Recruiter profile");

  const posts = await prisma.post.findMany({
    where: { recruiterId: profile.id },
    include: {
      moderationTasks: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, attempts: true, lastError: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (posts.some((post) => post.moderationTasks.some((task) => task.status === "QUEUED"))) {
    after(kickPostModerationQueue);
  }

  return NextResponse.json(posts);
}

// POST /api/recruiter/posts — create post (must be verified)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return Errors.notFound("Recruiter profile");
  if (profile.verificationStatus !== "APPROVED") {
    return Errors.forbidden("Your recruiter account is not yet approved");
  }

  // Must have an active subscription to create posts
  if (profile.subscriptionStatus !== "ACTIVE") {
    return Errors.forbidden("An active membership is required to post jobs.");
  }

  const body = await req.json();
  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const d = parsed.data;
  const content = postModerationText({
    title: d.title,
    description: d.description,
    location: d.location ?? null,
    fields: d.fields,
  });
  const post = await prisma.post.create({
    data: {
      title:       d.title,
      description: d.description,
      type:        d.type,
      location:    d.location    ?? null,
      imageUrl:    d.imageUrl    ?? null,
      fields:      d.fields      ?? [],
      startDate:   d.startDate   ? new Date(d.startDate)  : null,
      endDate:     d.endDate     ? new Date(d.endDate)    : null,
      hourlyRate:  d.hourlyRate  ?? null,
      dailyRate:   d.dailyRate   ?? null,
      maxApplicants: d.maxApplicants ?? null,
      recruiterId: profile.id,
      status: "PENDING",
      moderationTasks: {
        create: { contentHash: postModerationHash(content) },
      },
    },
  });

  await createNotification(prisma, session.user.id, {
    type: "POST_UPDATE",
    status: "PENDING",
    postId: post.id,
    title: `Screening started: ${post.title}`,
    message: "Your post is queued for automatic screening. It will go live if approved, and you’ll be notified of the decision.",
  });

  after(kickPostModerationQueue);
  return NextResponse.json({ ...post, screeningStatus: "QUEUED" }, { status: 202 });
}

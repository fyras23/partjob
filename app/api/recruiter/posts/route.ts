import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { createNotification } from "@/lib/notificationBus";
import { moderatePostContent } from "@/lib/postModeration";

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
    orderBy: { createdAt: "desc" },
  });

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
  const moderation = await moderatePostContent([
    d.title,
    d.description,
    d.location,
    ...d.fields,
  ].filter(Boolean).join("\n"));
  if (!moderation) {
    return NextResponse.json(
      { error: "Post screening is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const automaticallyRejected = moderation.inappropriate;

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
      status:      automaticallyRejected ? "REJECTED" : "APPROVED",
      moderationReason: automaticallyRejected ? moderation.reason : null,
      rejectionReason: automaticallyRejected ? moderation.reason : null,
      approvedAt: automaticallyRejected ? null : new Date(),
    },
  });

  await createNotification(prisma, session.user.id, {
    type: "POST_UPDATE",
    status: post.status,
    postId: post.id,
    title: automaticallyRejected ? `Post rejected: ${post.title}` : `Post published: ${post.title}`,
    message: automaticallyRejected
      ? `Your post was automatically rejected. Reason: ${moderation.reason} You can appeal from My Posts for an admin to review it.`
      : "Your post passed automatic screening and is now live for students.",
  });

  return NextResponse.json(post, { status: 201 });
}

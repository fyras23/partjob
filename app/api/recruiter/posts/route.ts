import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushToAllAdmins } from "@/lib/notificationBus";

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

  const body = await req.json();
  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const d = parsed.data;

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
      recruiterId: profile.id,
      status:      "PENDING",
    },
  });

  // Notify all admins in real time
  await pushToAllAdmins(prisma, {
    type:    "NEW_POST",
    status:  "PENDING",
    postId:  post.id,
    title:   "New post pending review",
    message: `${profile.companyName} submitted a new ${post.type.toLowerCase()} post: "${post.title}"`,
  });

  return NextResponse.json(post, { status: 201 });
}

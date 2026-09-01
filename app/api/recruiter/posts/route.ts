import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

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

  const post = await prisma.post.create({
    data: { ...parsed.data, recruiterId: profile.id, status: "PENDING" },
  });

  return NextResponse.json(post, { status: 201 });
}


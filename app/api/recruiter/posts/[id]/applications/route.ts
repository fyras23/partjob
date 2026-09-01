import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

// GET /api/recruiter/posts/:id/applications
export async function GET(
  _req: NextRequest,
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

  const applications = await prisma.application.findMany({
    where: { postId: id },
    include: {
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UpdatePostSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

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

  // Editing an APPROVED post resets it to PENDING for re-review
  const newStatus = post.status === "APPROVED" ? "PENDING" : post.status;

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...parsed.data,
      status: newStatus,
      // Clear approval audit if being reset
      ...(post.status === "APPROVED"
        ? { approvedById: null, approvedAt: null }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

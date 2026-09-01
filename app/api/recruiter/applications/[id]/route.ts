import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

// PATCH /api/recruiter/applications/:id — approve or reject an applicant
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

  const application = await prisma.application.findUnique({
    where: { id },
    include: { post: true },
  });
  if (!application) return Errors.notFound("Application");

  // Recruiter can only review applications on their own posts
  if (application.post.recruiterId !== profile.id) return Errors.forbidden();

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

// PATCH /api/admin/recruiters/:id — approve or reject recruiter verification
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const { id } = await params;

  const profile = await prisma.recruiterProfile.findUnique({ where: { id } });
  if (!profile) return Errors.notFound("Recruiter profile");

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.recruiterProfile.update({
    where: { id },
    data: {
      verificationStatus: parsed.data.status,
      verifiedById: session.user.id,
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushNotification } from "@/lib/notificationBus";

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

  // Push real-time notification to the recruiter
  pushNotification(profile.userId, {
    type:    "VERIFICATION_UPDATE",
    status:  parsed.data.status,
    title:   parsed.data.status === "APPROVED" ? "Account approved!" : "Verification rejected",
    message: parsed.data.status === "APPROVED"
      ? "Your recruiter account has been approved. You can now post jobs."
      : "Your verification was rejected. Please resubmit with updated documents.",
  });

  return NextResponse.json(updated);
}

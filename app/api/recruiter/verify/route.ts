import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { VerifySchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushToAllAdmins } from "@/lib/notificationBus";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const body = await req.json();
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const { companyName, businessDocUrl } = parsed.data;

  const profile = await prisma.recruiterProfile.upsert({
    where: { userId: session.user.id },
    update: {
      companyName,
      businessDocUrl,
      verificationStatus: "PENDING",
      verifiedById: null,
      verifiedAt: null,
    },
    create: {
      userId: session.user.id,
      companyName,
      businessDocUrl,
      verificationStatus: "PENDING",
    },
  });

  // Notify all admins that a recruiter submitted verification
  await pushToAllAdmins(prisma, {
    type:    "NEW_VERIFICATION",
    status:  "PENDING",
    title:   "New recruiter verification",
    message: `${companyName} submitted a verification request and is awaiting approval.`,
  });

  return NextResponse.json(profile, { status: 200 });
}

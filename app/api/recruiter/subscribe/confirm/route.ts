import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";
import { getStripe } from "@/lib/stripe";
import { activateMembershipFromCheckout } from "@/lib/stripeMembership";

const ConfirmSchema = z.object({ sessionId: z.string().min(1).max(255) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const parsed = ConfirmSchema.safeParse(await req.json());
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return Errors.notFound("Recruiter profile");

  try {
    const checkout = await getStripe().checkout.sessions.retrieve(parsed.data.sessionId);
    if (checkout.metadata?.recruiterId !== profile.id) return Errors.forbidden();

    const result = await activateMembershipFromCheckout(checkout);
    if (result.status === "PENDING") {
      return NextResponse.json({ status: "PENDING" }, { status: 202 });
    }

    return NextResponse.json({
      status: "ACTIVE",
      subscriptionEnd: result.subscriptionEnd.toISOString(),
    });
  } catch (error) {
    console.error("Could not confirm recruiter checkout:", error);
    return NextResponse.json(
      { error: "We could not verify this payment yet. Please retry in a moment." },
      { status: 503 },
    );
  }
}
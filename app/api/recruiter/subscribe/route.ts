import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { Errors } from "@/lib/errors";
import { z } from "zod";

const Schema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!profile) return Errors.notFound("Recruiter profile");
  if (profile.verificationStatus !== "APPROVED") {
    return Errors.forbidden("Your account must be verified before subscribing.");
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Errors.badRequest("Invalid plan");

  const config = await prisma.membershipConfig.findUnique({ where: { id: "default" } });
  if (!config) return Errors.internal();

  const { plan } = parsed.data;

  // Calculate final price after discount
  const rawPrice  = plan === "MONTHLY" ? config.monthlyPrice : config.yearlyPrice;
  const discount  = plan === "MONTHLY" ? config.monthlyDiscount : config.yearlyDiscount;
  const finalPrice = rawPrice * (1 - discount / 100);
  const amountCents = Math.round(finalPrice * 100); // Stripe uses cents

  // Get or create Stripe customer
  let customerId = profile.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.user.email,
      name:  profile.user.name,
      metadata: { recruiterId: profile.id, userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.recruiterProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  // Create Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       "payment",
    line_items: [
      {
        price_data: {
          currency:     "dzd",            // Algerian Dinar — closest to DT; change if needed
          product_data: {
            name: `PartJob ${plan === "MONTHLY" ? "Monthly" : "Yearly"} Membership`,
            description: plan === "MONTHLY"
              ? "1-month recruiter membership — post unlimited jobs."
              : "12-month recruiter membership — save with yearly billing.",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/dashboard/membership`,
    metadata: {
      recruiterId: profile.id,
      plan,
      months: plan === "MONTHLY" ? "1" : "12",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

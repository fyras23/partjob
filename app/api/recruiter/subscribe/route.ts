import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { Errors } from "@/lib/errors";
import { z } from "zod";

const Schema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
});

export async function POST(req: NextRequest) {
  try {
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

    // Load pricing config — fall back to defaults if not in DB yet
    const config = await prisma.membershipConfig.findUnique({
      where: { id: "default" },
    }).catch(() => null);

    const monthlyPrice    = config?.monthlyPrice    ?? 29;
    const yearlyPrice     = config?.yearlyPrice     ?? 290;
    const monthlyDiscount = config?.monthlyDiscount ?? 0;
    const yearlyDiscount  = config?.yearlyDiscount  ?? 0;

    const { plan } = parsed.data;
    const rawPrice   = plan === "MONTHLY" ? monthlyPrice    : yearlyPrice;
    const discount   = plan === "MONTHLY" ? monthlyDiscount : yearlyDiscount;
    const finalPriceTND = rawPrice * (1 - discount / 100);

    // Stripe does not support TND — convert TND → EUR for Stripe billing.
    // Prices are still shown to the recruiter in DT on the UI.
    const TND_TO_EUR = 0.30; // 1 TND ≈ 0.30 EUR (adjust as needed)
    const finalPriceEUR = finalPriceTND * TND_TO_EUR;
    // Stripe needs integer cents — minimum 50 cents
    const amountCents = Math.max(50, Math.round(finalPriceEUR * 100));

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = profile.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    profile.user.email,
        name:     profile.user.name,
        metadata: { recruiterId: profile.id, userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.recruiterProfile.update({
        where: { id: profile.id },
        data:  { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       "payment",
      line_items: [
        {
          price_data: {
            currency:     "eur",   // TND not supported by Stripe — converted from DT
            product_data: {
              name: `PartJob ${plan === "MONTHLY" ? "Monthly" : "Yearly"} Membership`,
              description: plan === "MONTHLY"
                ? `1-month recruiter membership (${finalPriceTND.toFixed(0)} DT ≈ ${finalPriceEUR.toFixed(2)} EUR)`
                : `12-month recruiter membership (${finalPriceTND.toFixed(0)} DT ≈ ${finalPriceEUR.toFixed(2)} EUR)`,
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

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[subscribe] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

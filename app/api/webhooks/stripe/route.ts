import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import { pushNotification } from "@/lib/notificationBus";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { recruiterId, plan, months } = session.metadata ?? {};

    if (!recruiterId || !plan || !months) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const monthCount = parseInt(months, 10);
    const start = new Date();
    const end   = new Date(start);
    end.setMonth(end.getMonth() + monthCount);

    const profile = await prisma.recruiterProfile.update({
      where: { id: recruiterId },
      data: {
        subscriptionStatus:   "ACTIVE",
        subscriptionPlan:     plan as "MONTHLY" | "YEARLY",
        subscriptionStart:    start,
        subscriptionEnd:      end,
        stripeSubscriptionId: session.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Notify the recruiter in real-time
    pushNotification(profile.user.id, {
      type:    "SUBSCRIPTION_ACTIVE",
      status:  "APPROVED",
      title:   "Membership activated!",
      message: `Your ${plan.toLowerCase()} membership is now active until ${end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. You can now post jobs.`,
    });
  }

  return NextResponse.json({ received: true });
}

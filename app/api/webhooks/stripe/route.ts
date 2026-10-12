import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { activateMembershipFromCheckout } from "@/lib/stripeMembership";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const result = await activateMembershipFromCheckout(event.data.object);
    return NextResponse.json({ received: true, membershipStatus: result.status });
  }

  return NextResponse.json({ received: true });
}

import type Stripe from "stripe";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notificationBus";

export type MembershipActivationResult =
  | { status: "PENDING" }
  | { status: "ACTIVE"; subscriptionEnd: Date; alreadyActive: boolean };

function getCustomerId(customer: Stripe.Checkout.Session["customer"]) {
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

export async function activateMembershipFromCheckout(
  checkout: Stripe.Checkout.Session,
): Promise<MembershipActivationResult> {
  if (checkout.status !== "complete" || checkout.payment_status !== "paid") {
    return { status: "PENDING" };
  }

  const metadata = checkout.metadata ?? {};
  const recruiterId = metadata.recruiterId;
  const plan = metadata.plan;
  const months = metadata.months;
  if (
    !recruiterId ||
    (plan !== "MONTHLY" && plan !== "YEARLY") ||
    months !== (plan === "MONTHLY" ? "1" : "12")
  ) {
    throw new Error("Checkout session has invalid membership metadata");
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { id: recruiterId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!profile) throw new Error("Recruiter profile for checkout was not found");

  const customerId = getCustomerId(checkout.customer);
  if (!profile.stripeCustomerId || customerId !== profile.stripeCustomerId) {
    throw new Error("Checkout customer does not match the recruiter account");
  }

  const subscriptionEnd = new Date(checkout.created * 1000);
  subscriptionEnd.setMonth(subscriptionEnd.getMonth() + Number(months));

  if (
    profile.subscriptionStatus === "ACTIVE" &&
    profile.stripeSubscriptionId === checkout.id
  ) {
    return { status: "ACTIVE", subscriptionEnd: profile.subscriptionEnd ?? subscriptionEnd, alreadyActive: true };
  }

  if (
    profile.subscriptionStatus === "ACTIVE" &&
    profile.subscriptionEnd &&
    profile.subscriptionEnd > new Date(checkout.created * 1000)
  ) {
    return { status: "ACTIVE", subscriptionEnd: profile.subscriptionEnd, alreadyActive: true };
  }

  const updated = await prisma.recruiterProfile.updateMany({
    where: { id: recruiterId, stripeSubscriptionId: profile.stripeSubscriptionId },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: plan,
      subscriptionStart: new Date(checkout.created * 1000),
      subscriptionEnd,
      stripeSubscriptionId: checkout.id,
    },
  });

  if (updated.count === 0) {
    const latest = await prisma.recruiterProfile.findUnique({ where: { id: recruiterId } });
    if (
      latest?.subscriptionStatus === "ACTIVE" &&
      latest.stripeSubscriptionId === checkout.id
    ) {
      return { status: "ACTIVE", subscriptionEnd: latest.subscriptionEnd ?? subscriptionEnd, alreadyActive: true };
    }
    throw new Error("Membership changed while activating checkout");
  }

  try {
    await createNotification(prisma, profile.user.id, {
      type: "SUBSCRIPTION_ACTIVE",
      status: "APPROVED",
      title: "Membership activated!",
      message: `Your ${plan.toLowerCase()} membership is now active until ${subscriptionEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. You can now post jobs.`,
    });
  } catch (error) {
    console.error("Membership activated, but notification could not be saved:", error);
  }

  return { status: "ACTIVE", subscriptionEnd, alreadyActive: false };
}
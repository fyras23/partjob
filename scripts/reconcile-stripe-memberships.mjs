import { config } from "dotenv";
import StripeModule from "stripe";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config();

const Stripe = StripeModule.default ?? StripeModule;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-08-26.dahlia",
});
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const events = await stripe.events.list({
    type: "checkout.session.completed",
    limit: 100,
  });
  const latestPaidByRecruiter = new Map();

  for (const event of events.data) {
    const checkout = event.data.object;
    const metadata = checkout.metadata ?? {};
    if (
      checkout.mode !== "payment" ||
      checkout.status !== "complete" ||
      checkout.payment_status !== "paid" ||
      !metadata.recruiterId ||
      (metadata.plan !== "MONTHLY" && metadata.plan !== "YEARLY") ||
      metadata.months !== (metadata.plan === "MONTHLY" ? "1" : "12")
    ) continue;

    if (!latestPaidByRecruiter.has(metadata.recruiterId)) {
      latestPaidByRecruiter.set(metadata.recruiterId, checkout);
    }
  }

  let activated = 0;
  let skipped = 0;

  for (const [recruiterId, checkout] of latestPaidByRecruiter) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId },
      include: { user: { select: { id: true } } },
    });
    const customerId = typeof checkout.customer === "string"
      ? checkout.customer
      : checkout.customer?.id;

    if (!profile || !profile.stripeCustomerId || profile.stripeCustomerId !== customerId) {
      skipped += 1;
      continue;
    }

    const start = new Date(checkout.created * 1000);
    if (
      profile.subscriptionStatus === "ACTIVE" &&
      profile.subscriptionEnd &&
      profile.subscriptionEnd > start
    ) {
      skipped += 1;
      continue;
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(checkout.metadata.months));

    const updated = await prisma.recruiterProfile.updateMany({
      where: {
        id: recruiterId,
        stripeSubscriptionId: profile.stripeSubscriptionId,
        subscriptionStatus: profile.subscriptionStatus,
      },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: checkout.metadata.plan,
        subscriptionStart: start,
        subscriptionEnd: end,
        stripeSubscriptionId: checkout.id,
      },
    });

    if (updated.count !== 1) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.notification.create({
        data: {
          userId: profile.user.id,
          type: "SUBSCRIPTION_ACTIVE",
          status: "APPROVED",
          title: "Membership activated!",
          message: `Your ${checkout.metadata.plan.toLowerCase()} membership is now active until ${end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. You can now post jobs.`,
        },
      });
    } catch (error) {
      console.error("Membership activated but notification could not be saved:", error instanceof Error ? error.message : "Unknown error");
    }

    activated += 1;
  }

  console.log(JSON.stringify({ activated, skipped, checkedRecruiterProfiles: latestPaidByRecruiter.size }));
} catch (error) {
  console.error("Stripe membership reconciliation failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}

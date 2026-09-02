/**
 * Dev helper — manually activate a recruiter subscription for testing.
 * Usage: node scripts/test-activate-subscription.mjs <recruiter-email>
 */
import { config } from "dotenv";
config();
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/test-activate-subscription.mjs <recruiter-email>");
  process.exit(1);
}

const pool   = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const user = await prisma.user.findUnique({
  where: { email },
  include: { recruiterProfile: true },
});

if (!user) { console.error("❌ User not found:", email); process.exit(1); }
if (user.role !== "RECRUITER") { console.error("❌ User is not a recruiter"); process.exit(1); }
if (!user.recruiterProfile) { console.error("❌ No recruiter profile found"); process.exit(1); }

const end = new Date();
end.setFullYear(end.getFullYear() + 1); // 1 year from now

const updated = await prisma.recruiterProfile.update({
  where: { id: user.recruiterProfile.id },
  data: {
    subscriptionStatus: "ACTIVE",
    subscriptionPlan:   "YEARLY",
    subscriptionStart:  new Date(),
    subscriptionEnd:    end,
    stripeSubscriptionId: "test_manual_activation",
  },
});

console.log("✅ Subscription activated for:", email);
console.log("   Plan:  YEARLY");
console.log("   Until:", end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

await prisma.$disconnect();
await pool.end();

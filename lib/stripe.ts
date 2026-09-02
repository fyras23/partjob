import Stripe from "stripe";

// Lazy initialization — don't throw at import time (breaks Next.js build/dev)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "sk_test_REPLACE_ME") {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Add it to .env.local"
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia" as const,
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience export — same as calling getStripe() directly
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

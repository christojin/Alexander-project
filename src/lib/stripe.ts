import Stripe from "stripe";

/**
 * Stripe client singleton.
 * Returns null if STRIPE_SECRET_KEY is not configured.
 */
function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const globalForStripe = globalThis as unknown as {
  _stripe: Stripe | null | undefined;
};

export const stripe: Stripe | null =
  globalForStripe._stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") {
  globalForStripe._stripe = stripe;
}

/**
 * Check whether Stripe is configured and available.
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

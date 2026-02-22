import { prisma } from "@/lib/prisma";

interface FraudAssessment {
  score: number;
  isHighValue: boolean;
  requiresManualReview: boolean;
  shouldDelay: boolean;
  delayMinutes: number;
  reasons: string[];
}

/**
 * Assess fraud risk for an order.
 *
 * Scoring:
 *  - High value order:         +30
 *  - Very high value:          +20
 *  - New account (<24h):       +20
 *  - First purchase:           +10
 *  - Multiple orders/hour:     +15
 *  - Crypto/Binance payment:   +5
 *
 * Thresholds:
 *  - 0-30:  Normal (instant delivery)
 *  - 31-50: Moderate (apply delivery delay)
 *  - 51+:   High (manual review + delay)
 */
export async function assessFraudRisk(params: {
  buyerId: string;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
}): Promise<FraudAssessment> {
  const { buyerId, totalAmount, paymentMethod } = params;

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });

  const highValueThreshold = settings?.highValueThreshold ?? 100;
  const manualReviewThreshold = settings?.requireManualReviewAbove ?? 500;
  const deliveryDelay = settings?.deliveryDelayMinutes ?? 0;

  let score = 0;
  const reasons: string[] = [];

  // Factor 1: High value order
  if (totalAmount >= highValueThreshold) {
    score += 30;
    reasons.push(`Orden de alto valor ($${totalAmount.toFixed(2)} >= $${highValueThreshold})`);
  }

  // Factor 2: Very high value
  if (totalAmount >= manualReviewThreshold) {
    score += 20;
    reasons.push(`Supera umbral de revision manual ($${totalAmount.toFixed(2)} >= $${manualReviewThreshold})`);
  }

  // Factor 3: New account
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { createdAt: true },
  });
  if (buyer) {
    const accountAge = Date.now() - buyer.createdAt.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (accountAge < oneDayMs) {
      score += 20;
      reasons.push("Cuenta creada hace menos de 24 horas");
    }
  }

  // Factor 4: First purchase
  const completedOrders = await prisma.order.count({
    where: { buyerId, status: "COMPLETED" },
  });
  if (completedOrders === 0) {
    score += 10;
    reasons.push("Primera compra del usuario");
  }

  // Factor 5: Multiple orders in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentOrders = await prisma.order.count({
    where: {
      buyerId,
      createdAt: { gte: oneHourAgo },
      status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
    },
  });
  if (recentOrders >= 3) {
    score += 15;
    reasons.push(`${recentOrders} ordenes en la ultima hora`);
  }

  // Factor 6: Crypto/Binance payment
  if (paymentMethod === "crypto" || paymentMethod === "binance_pay") {
    score += 5;
    reasons.push("Pago con criptomonedas");
  }

  const isHighValue = totalAmount >= highValueThreshold;
  const requiresManualReview = score >= 51 || totalAmount >= manualReviewThreshold;
  const shouldDelay = score >= 31 && deliveryDelay > 0;
  const delayMinutes = shouldDelay ? deliveryDelay : 0;

  return {
    score,
    isHighValue,
    requiresManualReview,
    shouldDelay,
    delayMinutes,
    reasons,
  };
}

/**
 * Schedule delayed delivery for an order.
 */
export async function scheduleDelayedDelivery(
  orderId: string,
  delayMinutes: number
): Promise<void> {
  const deliveryScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  await prisma.order.update({
    where: { id: orderId },
    data: { deliveryScheduledAt },
  });
}

/**
 * Process all delayed orders that are ready for delivery.
 * Returns count of processed and failed orders.
 */
export async function processDelayedDeliveries(): Promise<{
  processed: number;
  failed: number;
}> {
  // Dynamic import to avoid circular dependency
  const { fulfillOrder } = await import("@/lib/order-fulfillment");

  const readyOrders = await prisma.order.findMany({
    where: {
      status: "PROCESSING",
      deliveryScheduledAt: { lte: new Date() },
    },
    include: {
      items: true,
    },
  });

  let processed = 0;
  let failed = 0;

  for (const order of readyOrders) {
    try {
      await fulfillOrder(order, order.buyerId, `delayed_${order.id}`);
      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}

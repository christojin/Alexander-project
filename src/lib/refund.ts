import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet";
import { sendRefundProcessedEmail } from "@/lib/email";

interface RefundCalculation {
  refundAmount: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  refundType: "FULL" | "PARTIAL_PRORATED";
}

/**
 * Calculate prorated streaming refund.
 *
 * Formula: refundAmount = (remainingDays / totalDays) * orderAmount
 *
 * Example: 30-day product for $2, cancelled after 15 days → $1 refund
 */
export function calculateStreamingRefund(params: {
  orderAmount: number;
  productDuration: number; // total days
  deliveredAt: Date;
}): RefundCalculation {
  const { orderAmount, productDuration, deliveredAt } = params;

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const usedDays = Math.floor((now.getTime() - deliveredAt.getTime()) / msPerDay);
  const remainingDays = Math.max(0, productDuration - usedDays);

  // If no remaining days, refund is 0
  if (remainingDays <= 0) {
    return {
      refundAmount: 0,
      totalDays: productDuration,
      usedDays: Math.min(usedDays, productDuration),
      remainingDays: 0,
      refundType: "PARTIAL_PRORATED",
    };
  }

  // If used 0 days (same day), full refund
  if (usedDays <= 0) {
    return {
      refundAmount: orderAmount,
      totalDays: productDuration,
      usedDays: 0,
      remainingDays: productDuration,
      refundType: "FULL",
    };
  }

  const refundAmount = Math.round((remainingDays / productDuration) * orderAmount * 100) / 100;

  return {
    refundAmount,
    totalDays: productDuration,
    usedDays,
    remainingDays,
    refundType: "PARTIAL_PRORATED",
  };
}

/**
 * Process a streaming refund: calculate prorated amount, create RefundRequest,
 * credit buyer wallet, deduct seller earnings, update order status.
 *
 * Auto-approved: no manual step needed.
 */
export async function processRefund(params: {
  orderId: string;
  buyerId: string;
  reason?: string;
}): Promise<{
  success: boolean;
  refundAmount: number;
  refund?: {
    id: string;
    refundType: string;
    refundAmount: number;
    totalDays: number | null;
    usedDays: number | null;
    remainingDays: number | null;
    status: string;
  };
  error?: string;
}> {
  const { orderId, buyerId, reason } = params;

  // Fetch order with items and product info
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, productType: true, duration: true } },
        },
      },
      seller: { select: { id: true, commissionRate: true } },
      refundRequests: { where: { status: { in: ["PENDING", "PROCESSED"] } } },
    },
  });

  if (!order) {
    return { success: false, refundAmount: 0, error: "Orden no encontrada" };
  }

  if (order.buyerId !== buyerId) {
    return { success: false, refundAmount: 0, error: "No autorizado" };
  }

  if (order.status !== "COMPLETED") {
    return { success: false, refundAmount: 0, error: "Solo se pueden reembolsar ordenes completadas" };
  }

  if (order.refundRequests.length > 0) {
    return { success: false, refundAmount: 0, error: "Ya existe una solicitud de reembolso para esta orden" };
  }

  // Check order age (30 day window)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (order.createdAt < thirtyDaysAgo) {
    return { success: false, refundAmount: 0, error: "El periodo de reembolso ha expirado (30 dias)" };
  }

  // Find streaming items
  const streamingItems = order.items.filter(
    (item) => item.product.productType === "STREAMING"
  );

  if (streamingItems.length === 0) {
    return { success: false, refundAmount: 0, error: "Solo los productos de streaming son reembolsables" };
  }

  // Calculate refund for each streaming item
  let totalRefund = 0;
  let totalDays: number | null = null;
  let usedDays: number | null = null;
  let remainingDays: number | null = null;
  let refundType: "FULL" | "PARTIAL_PRORATED" = "PARTIAL_PRORATED";

  for (const item of streamingItems) {
    const duration = item.product.duration ?? 30; // default 30 days
    const deliveredAt = item.deliveredAt ?? order.completedAt ?? order.createdAt;

    const calc = calculateStreamingRefund({
      orderAmount: item.totalPrice,
      productDuration: duration,
      deliveredAt,
    });

    totalRefund += calc.refundAmount;
    totalDays = calc.totalDays;
    usedDays = calc.usedDays;
    remainingDays = calc.remainingDays;
    refundType = calc.refundType;
  }

  if (totalRefund <= 0) {
    return { success: false, refundAmount: 0, error: "No hay dias restantes para reembolsar" };
  }

  // Round to 2 decimal places
  totalRefund = Math.round(totalRefund * 100) / 100;

  // Create refund request (auto-processed)
  const refundRequest = await prisma.refundRequest.create({
    data: {
      orderId,
      buyerId,
      refundType,
      originalAmount: order.subtotal,
      refundAmount: totalRefund,
      reason: reason ?? null,
      status: "PROCESSED",
      totalDays,
      usedDays,
      remainingDays,
      processedAt: new Date(),
    },
  });

  // Credit buyer wallet
  const walletResult = await creditWallet({
    userId: buyerId,
    amount: totalRefund,
    type: "REFUND_CREDIT",
    description: `Reembolso orden #${order.orderNumber}`,
    orderId,
    refundId: refundRequest.id,
  });

  // ── Notifications & email ──────────────────────────────────────
  const buyerUser = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { email: true },
  });

  await prisma.notification.create({
    data: {
      userId: buyerId,
      type: "REFUND_PROCESSED",
      title: "Reembolso procesado",
      message: `Se ha procesado un reembolso de $${totalRefund.toFixed(2)} para la orden #${order.orderNumber}.`,
      link: "/buyer/wallet",
    },
  });

  await prisma.notification.create({
    data: {
      userId: buyerId,
      type: "WALLET_CREDITED",
      title: "Billetera acreditada",
      message: `$${totalRefund.toFixed(2)} acreditados a tu billetera por reembolso de orden #${order.orderNumber}.`,
      link: "/buyer/wallet",
    },
  });

  if (buyerUser?.email && walletResult.success) {
    sendRefundProcessedEmail(
      buyerUser.email,
      order.orderNumber,
      totalRefund,
      walletResult.newBalance
    ).catch(() => {});
  }

  // Deduct from seller earnings
  const sellerRefundPortion = totalRefund * (1 - order.commissionRate / 100);
  await prisma.sellerProfile.update({
    where: { id: order.sellerId },
    data: {
      totalEarnings: { decrement: sellerRefundPortion },
      availableBalance: { decrement: sellerRefundPortion },
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "REFUNDED",
      refundedAmount: totalRefund,
    },
  });

  // Update payment status
  await prisma.payment.update({
    where: { orderId },
    data: { status: "REFUNDED" },
  });

  return {
    success: true,
    refundAmount: totalRefund,
    refund: {
      id: refundRequest.id,
      refundType: refundRequest.refundType,
      refundAmount: refundRequest.refundAmount,
      totalDays: refundRequest.totalDays,
      usedDays: refundRequest.usedDays,
      remainingDays: refundRequest.remainingDays,
      status: refundRequest.status,
    },
  };
}

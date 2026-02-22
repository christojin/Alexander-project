import { prisma } from "@/lib/prisma";

interface OrderWithItems {
  id: string;
  sellerId: string;
  orderNumber: string;
  sellerEarnings: number;
  requiresManualReview: boolean;
  paymentStatus: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    productType: string;
    deliveryType: string;
    quantity: number;
  }[];
}

/**
 * Fulfill a single order: assign codes/accounts, update stock, create chat, update seller.
 * Shared between checkout/confirm, webhooks/stripe, and delayed delivery processing.
 *
 * If the order has a future deliveryScheduledAt, delivery is deferred:
 * the order moves to PROCESSING and codes are NOT assigned yet.
 */
export async function fulfillOrder(
  order: OrderWithItems,
  buyerId: string,
  externalPaymentId: string
) {
  // Fetch current DB state for idempotency and delay checks
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true, paymentStatus: true, deliveryScheduledAt: true },
  });

  // Idempotency guard: skip if already completed or refunded
  if (fullOrder?.status === "COMPLETED" || fullOrder?.status === "REFUNDED" || fullOrder?.status === "CANCELLED") {
    return;
  }

  // Check if delivery should be delayed (anti-fraud)
  if (fullOrder?.deliveryScheduledAt && new Date() < fullOrder.deliveryScheduledAt) {
    // Payment received but delivery is delayed — mark as PROCESSING
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PROCESSING", paymentStatus: "COMPLETED" },
    });
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: "COMPLETED", externalPaymentId, completedAt: new Date() },
    });
    return; // Codes will be assigned later by processDelayedDeliveries()
  }

  // Assign digital codes for instant-delivery items
  for (const item of order.items) {
    if (item.deliveryType === "INSTANT") {
      if (item.productType === "GIFT_CARD" || item.productType === "TOP_UP") {
        const codes = await prisma.giftCardCode.findMany({
          where: { productId: item.productId, status: "AVAILABLE" },
          take: item.quantity,
        });
        for (const code of codes) {
          await prisma.giftCardCode.update({
            where: { id: code.id },
            data: {
              status: "SOLD",
              soldAt: new Date(),
              buyerId,
              orderId: item.id,
            },
          });
        }
      } else if (item.productType === "STREAMING") {
        const accounts = await prisma.streamingAccount.findMany({
          where: { productId: item.productId, status: "AVAILABLE" },
          take: item.quantity,
        });
        for (const account of accounts) {
          await prisma.streamingAccount.update({
            where: { id: account.id },
            data: { status: "SOLD", soldAt: new Date() },
          });
        }
      }

      await prisma.orderItem.update({
        where: { id: item.id },
        data: { isDelivered: true, deliveredAt: new Date() },
      });
    }
  }

  // Update product stock counts
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { soldCount: { increment: item.quantity } },
    });
  }

  // Auto-create chat for manual delivery items
  const manualItems = order.items.filter((i) => i.deliveryType === "MANUAL");
  if (manualItems.length > 0) {
    const existing = await prisma.chatConversation.findUnique({
      where: { buyerId_sellerId: { buyerId, sellerId: order.sellerId } },
    });
    const conversation = existing ?? await prisma.chatConversation.create({
      data: { buyerId, sellerId: order.sellerId },
    });
    const itemNames = manualItems.map((i) => i.productName).join(", ");
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: buyerId,
        content: `[Compra automatica] He comprado: ${itemNames}. Orden #${order.orderNumber}. Quedo atento a la entrega.`,
      },
    });
  }

  // Update seller earnings
  await prisma.sellerProfile.update({
    where: { id: order.sellerId },
    data: {
      totalSales: { increment: 1 },
      totalEarnings: { increment: order.sellerEarnings },
      availableBalance: { increment: order.sellerEarnings },
    },
  });

  // Complete order + payment
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: order.requiresManualReview ? "UNDER_REVIEW" : "COMPLETED",
      paymentStatus: "COMPLETED",
      completedAt: order.requiresManualReview ? undefined : new Date(),
    },
  });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      status: "COMPLETED",
      externalPaymentId,
      completedAt: new Date(),
    },
  });
}

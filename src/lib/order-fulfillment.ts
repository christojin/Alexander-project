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
 * Shared between checkout/confirm and webhooks/stripe.
 */
export async function fulfillOrder(
  order: OrderWithItems,
  buyerId: string,
  externalPaymentId: string
) {
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

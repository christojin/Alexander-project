import { prisma } from "@/lib/prisma";
import {
  sendOrderCompletedEmail,
  sendNewOrderEmail,
  type EmailOrderItem,
} from "@/lib/email";
import { createVemperOrder, isVemperConfigured } from "@/lib/vemper";
import { encrypt } from "@/lib/encryption";

interface OrderWithItems {
  id: string;
  sellerId: string;
  orderNumber: string;
  sellerEarnings: number;
  requiresManualReview: boolean;
  paymentStatus: string;
  totalAmount: number;
  items: {
    id: string;
    productId: string;
    productName: string;
    productType: string;
    deliveryType: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
      // Check if this product is sourced from Vemper
      const productWithVemper = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          vemperProductId: true,
          vemperProduct: {
            select: {
              id: true,
              vemperProductId: true,
              costPrice: true,
              type: true,
            },
          },
        },
      });

      if (productWithVemper?.vemperProductId && productWithVemper.vemperProduct) {
        // Vemper fulfillment
        await fulfillVemperItem(
          item,
          productWithVemper.vemperProduct,
          buyerId,
          order.id
        );
      } else if (item.productType === "GIFT_CARD" || item.productType === "TOP_UP") {
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

  // ── Notifications & emails (only for fully completed orders) ─────
  if (!order.requiresManualReview) {
    const [buyerUser, sellerProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: buyerId },
        select: { email: true },
      }),
      prisma.sellerProfile.findUnique({
        where: { id: order.sellerId },
        include: { user: { select: { email: true } } },
      }),
    ]);

    const itemNames = order.items.map((i) => i.productName).join(", ");

    // In-app notification: buyer
    await prisma.notification.create({
      data: {
        userId: buyerId,
        type: "ORDER_COMPLETED",
        title: "Pedido completado",
        message: `Tu pedido #${order.orderNumber} ha sido completado: ${itemNames}`,
        link: "/buyer/orders",
      },
    });

    // In-app notification: seller
    if (sellerProfile) {
      await prisma.notification.create({
        data: {
          userId: sellerProfile.userId,
          type: "NEW_ORDER",
          title: "Nueva venta",
          message: `Has recibido una nueva venta. Orden #${order.orderNumber}: ${itemNames}`,
          link: "/seller/orders",
        },
      });
    }

    // Fire-and-forget emails
    const emailItems: EmailOrderItem[] = order.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
    }));

    if (buyerUser?.email) {
      sendOrderCompletedEmail(
        buyerUser.email,
        order.orderNumber,
        emailItems,
        order.totalAmount
      ).catch(() => {});
    }

    if (sellerProfile?.user.email) {
      sendNewOrderEmail(
        sellerProfile.user.email,
        order.orderNumber,
        emailItems,
        order.sellerEarnings,
        sellerProfile.storeName
      ).catch(() => {});
    }
  }
}

// ── Vemper fulfillment helper ──────────────────────────────────

async function fulfillVemperItem(
  item: OrderWithItems["items"][0],
  vemperProduct: {
    id: string;
    vemperProductId: string;
    costPrice: number;
    type: string;
  },
  buyerId: string,
  orderId: string
) {
  // Retrieve topUpData saved during checkout
  const existingVemperOrder = await prisma.vemperOrder.findFirst({
    where: { orderId, vemperProductId: vemperProduct.id },
  });

  const topUpData = existingVemperOrder?.topUpData as Record<
    string,
    string
  > | null;

  if (!isVemperConfigured()) {
    // ── SANDBOX: generate mock code ──
    const mockCode = `VEMPER-MOCK-${Date.now().toString(36).toUpperCase()}`;

    await prisma.giftCardCode.create({
      data: {
        productId: item.productId,
        codeEncrypted: encrypt(mockCode),
        status: "SOLD",
        soldAt: new Date(),
        buyerId,
        orderId: item.id,
      },
    });

    if (existingVemperOrder) {
      await prisma.vemperOrder.update({
        where: { id: existingVemperOrder.id },
        data: {
          responseData: { mock: true, code: mockCode },
          status: "completed",
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.vemperOrder.create({
        data: {
          vemperProductId: vemperProduct.id,
          orderId,
          buyerId,
          costPrice: vemperProduct.costPrice * item.quantity,
          salePrice: item.totalPrice,
          profit: item.totalPrice - vemperProduct.costPrice * item.quantity,
          denomination: item.unitPrice,
          topUpData: topUpData ?? undefined,
          responseData: { mock: true, code: mockCode },
          status: "completed",
          completedAt: new Date(),
        },
      });
    }
    return;
  }

  // ── LIVE: call Vemper API ──
  const result = await createVemperOrder({
    productId: vemperProduct.vemperProductId,
    denomination: item.unitPrice,
    quantity: item.quantity,
    topUpData: topUpData ?? undefined,
  });

  const responseData = {
    vemperOrderId: result.vemperOrderId,
    code: result.code,
    status: result.status,
    error: result.error,
  };

  if (existingVemperOrder) {
    await prisma.vemperOrder.update({
      where: { id: existingVemperOrder.id },
      data: {
        responseData,
        status: result.success ? "completed" : "failed",
        completedAt: result.success ? new Date() : undefined,
      },
    });
  } else {
    await prisma.vemperOrder.create({
      data: {
        vemperProductId: vemperProduct.id,
        orderId,
        buyerId,
        costPrice: vemperProduct.costPrice * item.quantity,
        salePrice: item.totalPrice,
        profit: item.totalPrice - vemperProduct.costPrice * item.quantity,
        denomination: item.unitPrice,
        topUpData: topUpData ?? undefined,
        responseData,
        status: result.success ? "completed" : "failed",
        completedAt: result.success ? new Date() : undefined,
      },
    });
  }

  if (result.success && result.code) {
    await prisma.giftCardCode.create({
      data: {
        productId: item.productId,
        codeEncrypted: encrypt(result.code),
        status: "SOLD",
        soldAt: new Date(),
        buyerId,
        orderId: item.id,
      },
    });
  } else if (!result.success) {
    console.error(
      `[Vemper Fulfillment] Failed for order item ${item.id}:`,
      result.error
    );
  }
}

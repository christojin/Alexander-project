import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/checkout/confirm
 *
 * Confirm payment for non-Stripe methods (QR Bolivia, etc.).
 * In production, this would verify with the payment provider.
 * Currently operates in mock/sandbox mode.
 *
 * Body: { orderIds: string[], reference: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderIds, reference } = body as {
      orderIds: string[];
      reference: string;
    };

    if (!orderIds?.length) {
      return NextResponse.json(
        { error: "No se especificaron ordenes" },
        { status: 400 }
      );
    }

    // Verify all orders belong to this buyer and are PENDING
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        buyerId: session.user.id,
        paymentStatus: "PENDING",
      },
      include: { items: true },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: "Ordenes no encontradas o ya procesadas" },
        { status: 400 }
      );
    }

    // In production: verify payment with QR Bolivia API using reference
    // For now: mock confirmation — complete the orders
    for (const order of orders) {
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
                  buyerId: session.user.id,
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
          externalPaymentId: reference || `confirmed_${Date.now()}`,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderIds,
      message: "Pago confirmado exitosamente",
    });
  } catch (error) {
    console.error("[Checkout Confirm] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

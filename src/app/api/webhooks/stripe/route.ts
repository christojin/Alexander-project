import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler for checkout.session.completed event.
 * Marks orders as completed and assigns digital codes.
 */
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Verification failed:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderIdsStr = session.metadata?.orderIds;
    const buyerId = session.metadata?.buyerId;

    if (!orderIdsStr || !buyerId) {
      console.error("[Stripe Webhook] Missing metadata in session");
      return NextResponse.json({ received: true });
    }

    const orderIds = orderIdsStr.split(",");
    const externalPaymentId = session.payment_intent as string;

    try {
      await completeOrders(orderIds, buyerId, externalPaymentId);
    } catch (error) {
      console.error("[Stripe Webhook] Error completing orders:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function completeOrders(
  orderIds: string[],
  buyerId: string,
  externalPaymentId: string
) {
  for (const orderId of orderIds) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.paymentStatus === "COMPLETED") continue;

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

    // Update seller earnings
    await prisma.sellerProfile.update({
      where: { id: order.sellerId },
      data: {
        totalSales: { increment: 1 },
        totalEarnings: { increment: order.sellerEarnings },
        availableBalance: { increment: order.sellerEarnings },
      },
    });

    // Mark order completed
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: order.requiresManualReview ? "UNDER_REVIEW" : "COMPLETED",
        paymentStatus: "COMPLETED",
        completedAt: order.requiresManualReview ? undefined : new Date(),
      },
    });

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "COMPLETED",
        externalPaymentId,
        completedAt: new Date(),
      },
    });
  }
}

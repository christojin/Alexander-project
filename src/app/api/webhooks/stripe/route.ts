import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/order-fulfillment";

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
      for (const orderId of orderIds) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order || order.paymentStatus === "COMPLETED") continue;

        await fulfillOrder(order, buyerId, externalPaymentId);
      }
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

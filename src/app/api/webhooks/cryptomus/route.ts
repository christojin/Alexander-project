import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCryptomusWebhook } from "@/lib/cryptomus";
import { fulfillOrder } from "@/lib/order-fulfillment";

/**
 * POST /api/webhooks/cryptomus
 * Handle Cryptomus payment webhooks.
 *
 * Cryptomus sends a JSON body with a `sign` field.
 * Final statuses: "paid" / "paid_over" = success, "cancel" / "fail" = failure.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature
    const sign = typeof body.sign === "string" ? body.sign : "";

    if (!verifyCryptomusWebhook(body, sign)) {
      console.error("[Cryptomus Webhook] Invalid signature");
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 400 }
      );
    }

    const status: string = body.status ?? "";
    const isFinal: boolean = body.is_final === true;

    // Only process final paid statuses
    if (!isFinal || (status !== "paid" && status !== "paid_over")) {
      return NextResponse.json({ status: "ok" });
    }

    // Extract orderIds from additional_data
    let orderIds: string[] = [];
    try {
      if (body.additional_data) {
        const parsed = JSON.parse(body.additional_data);
        orderIds = parsed.orderIds ?? [];
      }
    } catch {
      console.error("[Cryptomus Webhook] Failed to parse additional_data");
    }

    if (orderIds.length === 0) {
      console.error("[Cryptomus Webhook] No orderIds found in webhook data");
      return NextResponse.json({ status: "ok" });
    }

    const externalPaymentId = body.uuid ?? body.order_id ?? "cryptomus_unknown";

    // Fulfill each order
    for (const orderId of orderIds) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || (order.status !== "PENDING" && order.status !== "PROCESSING")) {
        continue;
      }

      await fulfillOrder(
        {
          id: order.id,
          sellerId: order.sellerId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          sellerEarnings: order.sellerEarnings,
          requiresManualReview: order.requiresManualReview,
          paymentStatus: order.paymentStatus,
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productType: item.productType,
            deliveryType: item.deliveryType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
        order.buyerId,
        externalPaymentId
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Cryptomus Webhook] Error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 }
    );
  }
}

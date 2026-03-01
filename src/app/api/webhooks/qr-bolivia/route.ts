import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyQrBoliviaWebhook } from "@/lib/qr-bolivia";
import { fulfillOrder } from "@/lib/order-fulfillment";

/**
 * POST /api/webhooks/qr-bolivia
 * Handle QR Bolivia payment notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Verify webhook signature
    const signature = req.headers.get("X-QR-Signature") ?? "";

    if (!verifyQrBoliviaWebhook(body, signature)) {
      console.error("[QR Bolivia Webhook] Invalid signature");
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 400 }
      );
    }

    const data = JSON.parse(body);

    // Handle payment completion event
    if (data.event === "payment.completed") {
      const providerOrderId = data.orderId;
      const transactionId = data.transactionId;

      if (!providerOrderId) {
        return NextResponse.json(
          { status: "error", message: "Missing orderId" },
          { status: 400 }
        );
      }

      // Find orders by matching the externalPaymentId
      const payments = await prisma.payment.findMany({
        where: { externalPaymentId: providerOrderId },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (payments.length === 0) {
        console.error("[QR Bolivia Webhook] No orders found for orderId:", providerOrderId);
        return NextResponse.json({ status: "ok" });
      }

      for (const payment of payments) {
        const order = payment.order;
        if (order.status !== "PENDING" && order.status !== "PROCESSING") continue;

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
          transactionId ?? providerOrderId
        );
      }
    }

    // Acknowledge receipt
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[QR Bolivia Webhook] Error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 }
    );
  }
}

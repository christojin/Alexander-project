import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBinanceWebhook } from "@/lib/binance-pay";
import { fulfillOrder } from "@/lib/order-fulfillment";

/**
 * POST /api/webhooks/binance
 * Handle Binance Pay payment notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Verify webhook signature
    const timestamp = req.headers.get("BinancePay-Timestamp") ?? "";
    const nonce = req.headers.get("BinancePay-Nonce") ?? "";
    const signature = req.headers.get("BinancePay-Signature") ?? "";

    if (!verifyBinanceWebhook(body, { timestamp, nonce, signature })) {
      console.error("[Binance Webhook] Invalid signature");
      return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid signature" }, { status: 400 });
    }

    const data = JSON.parse(body);

    // Binance Pay sends bizType: "PAY" and bizStatus: "PAY_SUCCESS"
    if (data.bizType === "PAY" && data.bizStatus === "PAY_SUCCESS") {
      const merchantTradeNo = data.data?.merchantTradeNo;
      const transactionId = data.data?.transactionId;

      if (!merchantTradeNo) {
        return NextResponse.json({ returnCode: "FAIL", returnMessage: "Missing merchantTradeNo" }, { status: 400 });
      }

      // Find orders by matching the externalPaymentId which stores merchantTradeNo
      const payments = await prisma.payment.findMany({
        where: { externalPaymentId: merchantTradeNo },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (payments.length === 0) {
        console.error("[Binance Webhook] No orders found for tradeNo:", merchantTradeNo);
        return NextResponse.json({ returnCode: "SUCCESS" });
      }

      for (const payment of payments) {
        const order = payment.order;
        if (order.status !== "PENDING" && order.status !== "PROCESSING") continue;

        await fulfillOrder(
          {
            id: order.id,
            sellerId: order.sellerId,
            orderNumber: order.orderNumber,
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
            })),
          },
          order.buyerId,
          transactionId ?? merchantTradeNo
        );
      }
    }

    // Respond with SUCCESS to acknowledge receipt
    return NextResponse.json({ returnCode: "SUCCESS" });
  } catch (error) {
    console.error("[Binance Webhook] Error:", error);
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Internal error" }, { status: 500 });
  }
}

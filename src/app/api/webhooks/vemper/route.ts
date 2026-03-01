import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVemperWebhook } from "@/lib/vemper";
import { encrypt } from "@/lib/encryption";

/**
 * POST /api/webhooks/vemper
 * Handle async delivery callbacks from Vemper Games API.
 * Payload: { order_id, status, code?, error? }
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-vemper-signature") ?? "";

    if (!verifyVemperWebhook(rawBody, signature)) {
      console.error("[Vemper Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const {
      order_id: vemperOrderId,
      status,
      code,
      error: errorMsg,
    } = body as {
      order_id?: string;
      status?: string;
      code?: string;
      error?: string;
    };

    if (!vemperOrderId) {
      return NextResponse.json({ status: "ok" });
    }

    // Find VemperOrder by the external order ID stored in responseData
    const vemperOrder = await prisma.vemperOrder.findFirst({
      where: {
        responseData: {
          path: ["vemperOrderId"],
          equals: vemperOrderId,
        },
      },
    });

    if (!vemperOrder) {
      console.warn(`[Vemper Webhook] Order ${vemperOrderId} not found`);
      return NextResponse.json({ status: "ok" });
    }

    if (status === "completed" && code) {
      // Update VemperOrder
      await prisma.vemperOrder.update({
        where: { id: vemperOrder.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          responseData: {
            ...((vemperOrder.responseData as object) || {}),
            webhookCode: code,
          },
        },
      });

      // Find the related OrderItem and deliver the code
      if (vemperOrder.orderId) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: vemperOrder.orderId },
          include: {
            product: { select: { vemperProductId: true } },
          },
        });

        const relevantItem = orderItems.find(
          (oi) => oi.product.vemperProductId === vemperOrder.vemperProductId
        );

        if (relevantItem) {
          // Store encrypted code
          await prisma.giftCardCode.create({
            data: {
              productId: relevantItem.productId,
              codeEncrypted: encrypt(code),
              status: "SOLD",
              soldAt: new Date(),
              buyerId: vemperOrder.buyerId,
              orderId: relevantItem.id,
            },
          });

          // Mark item as delivered
          await prisma.orderItem.update({
            where: { id: relevantItem.id },
            data: { isDelivered: true, deliveredAt: new Date() },
          });

          // Notify buyer
          await prisma.notification.create({
            data: {
              userId: vemperOrder.buyerId,
              type: "ORDER_COMPLETED",
              title: "Codigo entregado",
              message:
                "Tu codigo digital ha sido entregado. Revisa tu pedido para ver los detalles.",
              link: "/buyer/orders",
            },
          });
        }
      }
    } else if (status === "failed") {
      await prisma.vemperOrder.update({
        where: { id: vemperOrder.id },
        data: {
          status: "failed",
          responseData: {
            ...((vemperOrder.responseData as object) || {}),
            error: errorMsg,
          },
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Vemper Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { creditWallet } from "@/lib/wallet";

/**
 * PATCH /api/admin/review-queue/[id]
 * Approve or reject a flagged order.
 *
 * Body: { action: "approve" | "reject", reason?: string }
 *
 * approve: fulfills order (assigns codes, updates seller earnings)
 * reject: cancels order, credits wallet with full refund
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await req.json();
    const { action, reason } = body as { action: string; reason?: string };

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status !== "UNDER_REVIEW" && order.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Esta orden no esta en cola de revision" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      if (order.status === "UNDER_REVIEW") {
        // Order was already fulfilled (codes assigned, seller credited) but held for review.
        // Just flip status to COMPLETED — do NOT re-run fulfillOrder to avoid double credits.
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "COMPLETED",
            requiresManualReview: false,
            completedAt: new Date(),
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          },
        });
      } else if (order.status === "PROCESSING" && order.paymentStatus === "COMPLETED") {
        // Delayed delivery order — payment received but codes not yet assigned.
        // Run full fulfillment now.
        await fulfillOrder(
          {
            id: order.id,
            sellerId: order.sellerId,
            orderNumber: order.orderNumber,
            sellerEarnings: order.sellerEarnings,
            requiresManualReview: false,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
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
          order.payment?.externalPaymentId ?? `admin_approved_${Date.now()}`
        );
        await prisma.order.update({
          where: { id: orderId },
          data: {
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          },
        });
      } else {
        // Payment not yet completed — mark as approved, delivery happens on payment
        await prisma.order.update({
          where: { id: orderId },
          data: {
            requiresManualReview: false,
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "order_approved",
          entityType: "order",
          entityId: orderId,
          details: { reason: reason ?? "Aprobado por administrador" },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Orden aprobada y entregada",
      });
    }

    // action === "reject"
    // Cancel order and refund to wallet
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        refundedAmount: order.totalAmount,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    if (order.payment) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "REFUNDED" },
      });
    }

    // Credit full amount to buyer wallet
    if (order.paymentStatus === "COMPLETED") {
      await creditWallet({
        userId: order.buyerId,
        amount: order.totalAmount,
        type: "REFUND_CREDIT",
        description: `Orden #${order.orderNumber} rechazada - Reembolso completo`,
        orderId,
      });

      // Deduct seller earnings if they were already credited
      const sellerRefundPortion = order.sellerEarnings;
      await prisma.sellerProfile.update({
        where: { id: order.sellerId },
        data: {
          totalEarnings: { decrement: sellerRefundPortion },
          availableBalance: { decrement: sellerRefundPortion },
          totalSales: { decrement: 1 },
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "order_rejected",
        entityType: "order",
        entityId: orderId,
        details: { reason: reason ?? "Rechazado por administrador", refundAmount: order.totalAmount },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Orden rechazada. $${order.totalAmount.toFixed(2)} reembolsado a billetera del comprador.`,
    });
  } catch (error) {
    console.error("[Admin Review Queue PATCH] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

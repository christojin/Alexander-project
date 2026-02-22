import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQrBoliviaPayment, isQrBoliviaConfigured } from "@/lib/qr-bolivia";

const QR_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/checkout/status
 *
 * Poll payment status for QR Bolivia orders.
 * Returns: { status: "pending" | "completed" | "expired" }
 *
 * This endpoint is read-only — it does NOT call fulfillOrder().
 * Order fulfillment is handled by the webhook or the confirm endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds } = body as { orderIds: string[] };

    if (!orderIds?.length) {
      return NextResponse.json(
        { error: "No se especificaron ordenes" },
        { status: 400 }
      );
    }

    // Fetch orders belonging to this buyer
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        buyerId: session.user.id,
      },
      include: {
        payment: {
          select: {
            status: true,
            externalPaymentId: true,
          },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Ordenes no encontradas" },
        { status: 404 }
      );
    }

    // Check if all orders are already completed in DB (webhook may have arrived)
    const allCompleted = orders.every((o) => o.paymentStatus === "COMPLETED");
    if (allCompleted) {
      return NextResponse.json({ status: "completed" });
    }

    // If QR Bolivia is configured, do a real-time check with the provider
    if (isQrBoliviaConfigured()) {
      const externalId = orders[0]?.payment?.externalPaymentId;
      if (externalId) {
        const result = await verifyQrBoliviaPayment(externalId);
        if (result.paid) {
          return NextResponse.json({ status: "completed" });
        }
      }
    }

    // Check if QR has expired
    const oldestOrder = orders.reduce((oldest, o) =>
      new Date(o.createdAt) < new Date(oldest.createdAt) ? o : oldest
    );
    const ageMs = Date.now() - new Date(oldestOrder.createdAt).getTime();
    if (ageMs > QR_EXPIRY_MS) {
      return NextResponse.json({ status: "expired" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("[Checkout Status] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

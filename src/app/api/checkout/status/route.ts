import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQrBoliviaPayment, isQrBoliviaConfigured } from "@/lib/qr-bolivia";
import { verifyBinanceDeposit, isBinanceVerifyConfigured } from "@/lib/binance-verify";
import { fulfillOrder } from "@/lib/order-fulfillment";

const QR_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/checkout/status
 *
 * Poll payment status for QR Bolivia and Binance transfer orders.
 * Returns: { status: "pending" | "completed" | "expired" }
 *
 * For QR Bolivia: read-only check (fulfillment via webhook/confirm).
 * For Binance transfers: active check + auto-fulfill on verification.
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
        items: true,
        payment: {
          select: {
            status: true,
            externalPaymentId: true,
            paymentDetails: true,
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

    // Check if all orders are already completed in DB
    const allCompleted = orders.every((o) => o.paymentStatus === "COMPLETED");
    if (allCompleted) {
      return NextResponse.json({ status: "completed" });
    }

    // Determine payment provider from paymentDetails
    const paymentDetails = orders[0]?.payment?.paymentDetails as Record<string, unknown> | null;
    const provider = paymentDetails?.provider as string | undefined;

    // ── Binance transfer verification ─────────────────────
    if (provider === "binance_transfer") {
      // Check expiry from paymentDetails
      const expiresAt = paymentDetails?.expiresAt as string | undefined;
      if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
        return NextResponse.json({ status: "expired" });
      }

      // Active verification via Binance Spot API
      if (isBinanceVerifyConfigured()) {
        const memoCode = paymentDetails?.memoCode as string;
        const expectedAmount = paymentDetails?.expectedAmount as number;
        const coin = (paymentDetails?.coin as string) ?? "USDT";

        if (memoCode && expectedAmount) {
          const result = await verifyBinanceDeposit(memoCode, expectedAmount, coin);

          if (result.verified) {
            // Auto-fulfill orders
            for (const order of orders) {
              if (order.paymentStatus === "COMPLETED") continue;
              await fulfillOrder(
                order,
                session.user.id,
                result.txId ?? `binance_${memoCode}`
              );
            }
            return NextResponse.json({ status: "completed" });
          }
        }
      }

      return NextResponse.json({ status: "pending" });
    }

    // ── QR Bolivia verification ───────────────────────────
    if (isQrBoliviaConfigured()) {
      const externalId = orders[0]?.payment?.externalPaymentId;
      if (externalId) {
        const result = await verifyQrBoliviaPayment(externalId);
        if (result.paid) {
          return NextResponse.json({ status: "completed" });
        }
      }
    }

    // Check if order has expired
    const expiresAt = paymentDetails?.expiresAt as string | undefined;
    if (expiresAt) {
      if (Date.now() > new Date(expiresAt).getTime()) {
        return NextResponse.json({ status: "expired" });
      }
    } else {
      // Fallback: use order creation time + default expiry
      const oldestOrder = orders.reduce((oldest, o) =>
        new Date(o.createdAt) < new Date(oldest.createdAt) ? o : oldest
      );
      const ageMs = Date.now() - new Date(oldestOrder.createdAt).getTime();
      if (ageMs > QR_EXPIRY_MS) {
        return NextResponse.json({ status: "expired" });
      }
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

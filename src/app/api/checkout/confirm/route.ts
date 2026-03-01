import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { verifyQrBoliviaPayment, isQrBoliviaConfigured } from "@/lib/qr-bolivia";
import { verifyBinanceDeposit, isBinanceVerifyConfigured } from "@/lib/binance-verify";

/**
 * POST /api/checkout/confirm
 *
 * Confirm payment for QR Bolivia or Binance transfer.
 * When provider is configured, verifies payment before fulfilling.
 * When not configured (sandbox), allows manual confirmation.
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
      include: {
        items: true,
        payment: {
          select: {
            externalPaymentId: true,
            paymentDetails: true,
          },
        },
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: "Ordenes no encontradas o ya procesadas" },
        { status: 400 }
      );
    }

    // Determine payment provider
    const paymentDetails = orders[0]?.payment?.paymentDetails as Record<string, unknown> | null;
    const provider = paymentDetails?.provider as string | undefined;

    // ── Binance transfer verification ─────────────────────
    if (provider === "binance_transfer") {
      if (isBinanceVerifyConfigured()) {
        const memoCode = paymentDetails?.memoCode as string;
        const expectedAmount = paymentDetails?.expectedAmount as number;
        const coin = (paymentDetails?.coin as string) ?? "USDT";

        if (memoCode && expectedAmount) {
          const verification = await verifyBinanceDeposit(memoCode, expectedAmount, coin);
          if (!verification.verified) {
            return NextResponse.json(
              { error: "El deposito aun no ha sido detectado. Verifica que hayas incluido el codigo memo correcto y el monto exacto." },
              { status: 400 }
            );
          }
        }
      }
      // If not configured (sandbox), skip verification — allow manual confirmation
    }

    // ── QR Bolivia verification ───────────────────────────
    else if (isQrBoliviaConfigured()) {
      const externalId = orders[0]?.payment?.externalPaymentId;
      if (externalId) {
        const verification = await verifyQrBoliviaPayment(externalId);
        if (!verification.paid) {
          return NextResponse.json(
            { error: "El pago aun no ha sido verificado. Espera unos momentos e intenta nuevamente." },
            { status: 400 }
          );
        }
      }
    }
    // If not configured (sandbox), skip verification and allow manual confirmation

    for (const order of orders) {
      await fulfillOrder(
        order,
        session.user.id,
        reference || `confirmed_${Date.now()}`
      );
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

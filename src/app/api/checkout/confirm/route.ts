import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/order-fulfillment";

/**
 * POST /api/checkout/confirm
 *
 * Confirm payment for non-Stripe methods (QR Bolivia, etc.).
 * In production, this would verify with the payment provider.
 * Currently operates in mock/sandbox mode.
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
      include: { items: true },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: "Ordenes no encontradas o ya procesadas" },
        { status: 400 }
      );
    }

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

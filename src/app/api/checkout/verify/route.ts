import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * GET /api/checkout/verify
 *
 * Verify payment and return order details for the success page.
 * Query params:
 *   - session_id: Stripe checkout session ID
 *   - orderIds: comma-separated order IDs (for non-Stripe methods)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const stripeSessionId = searchParams.get("session_id");
    const orderIdsParam = searchParams.get("orderIds");

    let orderIds: string[] = [];

    // ── Stripe: extract order IDs from session metadata ─────────
    if (stripeSessionId && stripe) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(
          stripeSessionId
        );
        const idsStr = stripeSession.metadata?.orderIds;
        if (idsStr) {
          orderIds = idsStr.split(",");
        }
      } catch {
        return NextResponse.json(
          { error: "Sesion de Stripe no encontrada" },
          { status: 404 }
        );
      }
    } else if (orderIdsParam) {
      orderIds = orderIdsParam.split(",");
    }

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: "No se especificaron ordenes" },
        { status: 400 }
      );
    }

    // ── Fetch orders with items and digital codes ───────────────
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        buyerId: session.user.id,
      },
      include: {
        seller: {
          select: { storeName: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, productType: true },
            },
            giftCardCodes: {
              select: {
                id: true,
                codeEncrypted: true,
                pin: true,
              },
            },
            streamingProfiles: {
              select: {
                id: true,
                profileNumber: true,
                streamingAccount: {
                  select: {
                    emailEncrypted: true,
                    passwordEncrypted: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            paymentMethod: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Ordenes no encontradas" },
        { status: 404 }
      );
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[Checkout Verify] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

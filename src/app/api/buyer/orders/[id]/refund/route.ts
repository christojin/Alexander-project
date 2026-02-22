import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processRefund } from "@/lib/refund";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/buyer/orders/[id]/refund
 * Request a streaming refund. Auto-calculates prorated amount and credits wallet.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason ?? undefined;

    const result = await processRefund({
      orderId,
      buyerId: session.user.id,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      refund: result.refund,
      message: `Reembolso de $${result.refundAmount.toFixed(2)} acreditado a tu billetera.`,
    });
  } catch (error) {
    console.error("[Buyer Refund POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/buyer/orders/[id]/refund
 * Check refund status for an order.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: orderId } = await params;

    const refund = await prisma.refundRequest.findFirst({
      where: { orderId, buyerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ refund });
  } catch (error) {
    console.error("[Buyer Refund GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

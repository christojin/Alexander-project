import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/seller/orders/[id]
 * Update order status (approve & deliver, mark under review).
 * Body: { action: "approve" | "under_review" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const body = await req.json();
  const { action } = body as { action: string };

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.sellerId !== seller.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    // Mark all items as delivered
    for (const item of order.items) {
      if (!item.isDelivered) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { isDelivered: true, deliveredAt: new Date() },
        });
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        paymentStatus: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: "completed" });
  }

  if (action === "under_review") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "UNDER_REVIEW" },
    });

    return NextResponse.json({ success: true, status: "under_review" });
  }

  return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
}

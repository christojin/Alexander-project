import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/commissions/[id]
 * Update a seller's commission rate.
 * Body: { commissionRate: number }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: sellerId } = await params;
  const body = await req.json();
  const { commissionRate } = body as { commissionRate: number };

  if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
    return NextResponse.json({ error: "Tasa invalida" }, { status: 400 });
  }

  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { commissionRate },
  });

  return NextResponse.json({ success: true, sellerId, commissionRate });
}

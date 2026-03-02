import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
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
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
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
  } catch (error) {
    console.error("[AdminCommissionsId] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

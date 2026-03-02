import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/vemper/products
 * List all VemperProducts with linked products and profit stats.
 */
export async function GET() {
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const products = await prisma.vemperProduct.findMany({
      include: {
        _count: { select: { vemperOrders: true, products: true } },
        products: {
          select: { id: true, name: true, isActive: true, price: true, slug: true },
          where: { isDeleted: false },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  
    // Aggregate profit per product
    const profitByProduct = await prisma.vemperOrder.groupBy({
      by: ["vemperProductId"],
      where: { status: "completed" },
      _sum: { profit: true },
      _count: true,
    });
  
    const profitMap = new Map(
      profitByProduct.map((p) => [
        p.vemperProductId,
        { totalProfit: p._sum.profit ?? 0, totalOrders: p._count },
      ])
    );
  
    const enriched = products.map((p) => ({
      ...p,
      stats: profitMap.get(p.id) ?? { totalProfit: 0, totalOrders: 0 },
    }));
  
    return NextResponse.json({ products: enriched });
  } catch (error) {
    console.error("[AdminVemperProducts] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

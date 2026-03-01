import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/vemper/products
 * List all VemperProducts with linked products and profit stats.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
}

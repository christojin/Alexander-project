import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/commissions
 * Get all sellers with commission rates and revenue stats.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [sellers, orders, settings] = await Promise.all([
    prisma.sellerProfile.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { storeName: "asc" },
    }),
    prisma.order.findMany({
      select: { sellerId: true, totalAmount: true, commissionAmount: true },
    }),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const totalCommissionsCollected = orders.reduce(
    (sum, o) => sum + o.commissionAmount,
    0
  );

  const sellerStats = sellers.map((s) => {
    const sellerOrders = orders.filter((o) => o.sellerId === s.id);
    return {
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      storeName: s.storeName,
      commissionRate: s.commissionRate,
      totalSales: s.totalSales,
      isVerified: s.isVerified,
      calculatedTotalSales: sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      calculatedCommissions: sellerOrders.reduce((sum, o) => sum + o.commissionAmount, 0),
    };
  });

  return NextResponse.json({
    defaultRate: settings?.defaultCommissionRate ?? 10,
    totalCommissionsCollected,
    totalOrders: orders.length,
    sellers: sellerStats,
  });
}

/**
 * POST /api/admin/commissions
 * Update default commission rate.
 * Body: { defaultRate: number }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { defaultRate } = body as { defaultRate: number };

  if (typeof defaultRate !== "number" || defaultRate < 0 || defaultRate > 100) {
    return NextResponse.json({ error: "Tasa invalida" }, { status: 400 });
  }

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: { defaultCommissionRate: defaultRate },
    create: { id: "default", defaultCommissionRate: defaultRate },
  });

  return NextResponse.json({ success: true, defaultRate });
}

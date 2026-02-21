import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFrontendOrderList } from "@/lib/api-transforms";

const ORDER_INCLUDE = {
  buyer: { select: { name: true, email: true } },
  seller: { select: { storeName: true, user: { select: { name: true } } } },
  items: {
    include: {
      product: { select: { image: true } },
      giftCardCodes: { select: { codeEncrypted: true } },
      streamingProfiles: {
        include: {
          streamingAccount: {
            select: {
              emailEncrypted: true,
              usernameEncrypted: true,
              passwordEncrypted: true,
              expiresAt: true,
            },
          },
        },
      },
    },
  },
  payment: true,
};

/**
 * GET /api/admin/dashboard
 * Platform-wide dashboard stats for admin.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const [
      orders,
      totalUsers,
      activeProducts,
      sellers,
      ticketCounts,
      vemperProfit,
    ] = await Promise.all([
      prisma.order.findMany({
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true, isDeleted: false } }),
      prisma.sellerProfile.findMany({
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, email: true, createdAt: true } } },
      }),
      prisma.ticket.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.vemperOrder.aggregate({
        where: { status: "completed" },
        _sum: { profit: true },
      }),
    ]);

    const apiNetProfit = vemperProfit._sum.profit ?? 0;

    const flatOrders = toFrontendOrderList(orders);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommissions = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
    const activeSellers = sellers.length;
    const openTickets = ticketCounts
      .filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
      .reduce((sum, t) => sum + t._count, 0);

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter((o) => o.createdAt >= today).length;

    // New users this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Top sellers with calculated revenue
    const topSellers = sellers.map((s) => {
      const sellerOrders = orders.filter((o) => o.sellerId === s.id);
      const revenue = sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const commissions = sellerOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        storeName: s.storeName,
        commissionRate: s.commissionRate,
        totalSales: s.totalSales,
        revenue,
        commissions,
        orderCount: sellerOrders.length,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Weekly revenue (last 4 weeks)
    const weeklyRevenue = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekOrders = orders.filter((o) => o.createdAt >= weekStart && o.createdAt < weekEnd);
      weeklyRevenue.push({
        label: `Sem ${4 - i}`,
        revenue: weekOrders.reduce((s, o) => s + o.totalAmount, 0),
        commissions: weekOrders.reduce((s, o) => s + o.commissionAmount, 0),
      });
    }

    const recentOrders = flatOrders.slice(0, 5);

    return NextResponse.json({
      totalRevenue,
      totalCommissions,
      apiNetProfit,
      totalUsers,
      activeProducts,
      activeSellers,
      openTickets,
      ordersToday,
      newUsersThisWeek,
      averageOrderValue,
      topSellers,
      weeklyRevenue,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

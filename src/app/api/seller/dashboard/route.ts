import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth-utils";
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
 * GET /api/seller/dashboard
 * Dashboard stats + recent orders for the authenticated seller.
 */
export async function GET() {
  try {
    const authResult = await requireSeller();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, commissionRate: true, storeName: true },
    });
  
    if (!seller) {
      return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
    }
  
    const [orders, productCount, ticketCounts] = await Promise.all([
      prisma.order.findMany({
        where: { sellerId: seller.id },
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({
        where: { sellerId: seller.id, isActive: true, isDeleted: false },
      }),
      prisma.ticket.groupBy({
        by: ["status"],
        where: { sellerId: seller.id },
        _count: true,
      }),
    ]);
  
    const flatOrders = toFrontendOrderList(orders);
  
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommission = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
    const netEarnings = orders.reduce((sum, o) => sum + o.sellerEarnings, 0);
    const pendingTickets = ticketCounts
      .filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
      .reduce((sum, t) => sum + t._count, 0);
  
    const recentOrders = flatOrders.slice(0, 5);
  
    return NextResponse.json({
      storeName: seller.storeName,
      commissionRate: seller.commissionRate,
      totalSales,
      totalCommission,
      netEarnings,
      activeProducts: productCount,
      pendingTickets,
      recentOrders,
      allOrders: flatOrders,
    });
  } catch (error) {
    console.error("[SellerDashboard] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
 * GET /api/seller/earnings
 * Financial summary and transaction history for the authenticated seller.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      commissionRate: true,
      totalEarnings: true,
      availableBalance: true,
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const flatOrders = toFrontendOrderList(orders);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommissions = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const netBalance = orders.reduce((sum, o) => sum + o.sellerEarnings, 0);
  const pendingPayment = orders
    .filter((o) => o.status === "PENDING" || o.status === "UNDER_REVIEW")
    .reduce((sum, o) => sum + o.sellerEarnings, 0);

  // Sum of pending + approved withdrawal amounts
  const pendingWithdrawals = await prisma.withdrawal.aggregate({
    where: {
      sellerId: seller.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    _sum: { amount: true },
  });

  return NextResponse.json({
    commissionRate: seller.commissionRate,
    totalRevenue,
    totalCommissions,
    netBalance,
    pendingPayment,
    availableBalance: seller.availableBalance,
    pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
    transactions: flatOrders,
  });
}

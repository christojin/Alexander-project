import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import type { WithdrawalStatus } from "@prisma/client";

/**
 * GET /api/admin/withdrawals
 * List all withdrawal requests with seller info and summary stats.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") as WithdrawalStatus | null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const where = statusFilter ? { status: statusFilter } : {};

  const [withdrawals, total, stats] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where }),
    prisma.withdrawal.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const statsSummary = {
    pending: 0,
    pendingAmount: 0,
    approved: 0,
    approvedAmount: 0,
    completed: 0,
    completedAmount: 0,
    rejected: 0,
    totalAmount: 0,
  };

  for (const s of stats) {
    const amt = s._sum.amount || 0;
    statsSummary.totalAmount += amt;
    switch (s.status) {
      case "PENDING":
        statsSummary.pending = s._count;
        statsSummary.pendingAmount = amt;
        break;
      case "APPROVED":
        statsSummary.approved = s._count;
        statsSummary.approvedAmount = amt;
        break;
      case "COMPLETED":
        statsSummary.completed = s._count;
        statsSummary.completedAmount = amt;
        break;
      case "REJECTED":
        statsSummary.rejected = s._count;
        break;
    }
  }

  return NextResponse.json({
    withdrawals,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: statsSummary,
  });
}

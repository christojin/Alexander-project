import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
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
 * GET /api/admin/orders
 * List all platform orders with optional filters.
 * Query params: status, search, page, limit
 */
export async function GET(req: NextRequest) {
  try {

    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {};

    if (
      status &&
      ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED", "UNDER_REVIEW"].includes(status)
    ) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { buyer: { email: { contains: search, mode: "insensitive" } } },
        { seller: { storeName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const counts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      under_review: 0,
    };
    for (const sc of statusCounts) {
      const key = sc.status.toLowerCase();
      counts[key] = sc._count;
    }

    return NextResponse.json({
      orders: toFrontendOrderList(orders),
      total,
      statusCounts: counts,
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

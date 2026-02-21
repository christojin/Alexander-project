import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/codes
 * List gift card codes with filters and status counts.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && ["AVAILABLE", "SOLD", "RESERVED", "EXPIRED"].includes(status)) {
      where.status = status;
    }
    if (productId) {
      where.productId = productId;
    }
    if (search) {
      where.product = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [codes, total, statusCounts] = await Promise.all([
      prisma.giftCardCode.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              seller: {
                select: {
                  storeName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.giftCardCode.count({ where }),
      prisma.giftCardCode.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const counts = {
      available: 0,
      sold: 0,
      reserved: 0,
      expired: 0,
    };
    for (const sc of statusCounts) {
      const key = sc.status.toLowerCase() as keyof typeof counts;
      counts[key] = sc._count;
    }

    const formattedCodes = codes.map((c) => ({
      id: c.id,
      productName: c.product.name,
      sellerStore: c.product.seller?.storeName ?? "—",
      status: c.status,
      expiresAt: c.expiresAt,
      soldAt: c.soldAt,
      buyerId: c.buyerId,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      codes: formattedCodes,
      total,
      statusCounts: counts,
    });
  } catch (error) {
    console.error("Error fetching codes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

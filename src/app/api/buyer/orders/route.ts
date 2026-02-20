import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/buyer/orders
 *
 * List all orders for the authenticated buyer.
 * Query params: ?status=completed|pending|cancelled&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      buyerId: session.user.id,
    };

    if (status) {
      const statusMap: Record<string, string> = {
        completed: "COMPLETED",
        pending: "PENDING",
        processing: "PROCESSING",
        cancelled: "CANCELLED",
        refunded: "REFUNDED",
        under_review: "UNDER_REVIEW",
      };
      if (statusMap[status]) {
        where.status = statusMap[status];
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          seller: {
            select: { storeName: true },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  productType: true,
                  slug: true,
                },
              },
            },
          },
          payment: {
            select: {
              status: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Buyer Orders GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

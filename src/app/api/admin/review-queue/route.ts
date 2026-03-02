import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/review-queue
 * List orders that need manual review (UNDER_REVIEW) or are delayed (PROCESSING with deliveryScheduledAt).
 */
export async function GET(req: NextRequest) {
  try {

    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { status: "UNDER_REVIEW" as const },
        {
          status: "PROCESSING" as const,
          deliveryScheduledAt: { not: null },
        },
      ],
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, email: true, createdAt: true } },
          seller: { select: { id: true, storeName: true } },
          items: {
            select: {
              id: true,
              productName: true,
              productType: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          payment: { select: { paymentMethod: true, amount: true, status: true } },
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
    console.error("[Admin Review Queue GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

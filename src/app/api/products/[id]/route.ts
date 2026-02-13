import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id]
 * Public product detail. Looks up by id or slug.
 * Includes seller info and other products from same seller.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try by ID first, then by slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
        isDeleted: false,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        region: { select: { id: true, name: true, code: true, flagEmoji: true } },
        seller: {
          select: {
            id: true,
            storeName: true,
            storeDescription: true,
            rating: true,
            totalReviews: true,
            totalSales: true,
            isVerified: true,
            user: { select: { name: true, avatar: true, createdAt: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Get other products from same seller (limit 4)
    const relatedProducts = await prisma.product.findMany({
      where: {
        sellerId: product.sellerId,
        id: { not: product.id },
        isActive: true,
        isDeleted: false,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        region: { select: { id: true, name: true, code: true } },
        seller: {
          select: {
            id: true,
            storeName: true,
            rating: true,
            isVerified: true,
          },
        },
      },
      orderBy: { soldCount: "desc" },
      take: 4,
    });

    return NextResponse.json({ product, relatedProducts });
  } catch (error) {
    console.error("[Product Detail GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

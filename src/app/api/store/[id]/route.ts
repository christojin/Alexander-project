import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/store/[id]
 * Public seller store profile + active products.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const seller = await prisma.sellerProfile.findFirst({
      where: { OR: [{ slug: id }, { id: id }] },
      select: {
        id: true,
        storeName: true,
        slug: true,
        storePhoto: true,
        storeDescription: true,
        rating: true,
        totalReviews: true,
        totalSales: true,
        isVerified: true,
        marketType: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
        country: {
          select: { name: true, code: true, flagEmoji: true },
        },
        businessHours: {
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort");
    const categorySlug = searchParams.get("category");

    const productWhere: Record<string, unknown> = {
      sellerId: seller.id,
      isActive: true,
      isDeleted: false,
    };

    if (categorySlug) {
      productWhere.category = { slug: categorySlug };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "popular") orderBy = { soldCount: "desc" };

    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        region: { select: { id: true, name: true, code: true, flagEmoji: true } },
        seller: {
          select: {
            id: true,
            storeName: true,
            rating: true,
            isVerified: true,
            totalSales: true,
            user: { select: { name: true, createdAt: true } },
          },
        },
      },
      orderBy,
    });

    return NextResponse.json({ seller, products });
  } catch (error) {
    console.error("[Store GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

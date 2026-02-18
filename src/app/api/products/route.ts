import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 * Public product listing with filters and pagination.
 * Query params: ?category=, ?brand=, ?search=, ?sort=, ?promoted=true, ?region=, ?page=, ?limit=
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const brandSlug = searchParams.get("brand");
    const regionCode = searchParams.get("region");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort"); // "price_asc" | "price_desc" | "newest" | "popular"
    const promoted = searchParams.get("promoted");
    const sellerId = searchParams.get("seller");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    if (regionCode) {
      where.region = { code: regionCode };
    }

    if (promoted === "true") {
      where.isPromoted = true;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Sorting
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "popular") orderBy = { soldCount: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Products GET] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error interno del servidor", details: message },
      { status: 500 }
    );
  }
}

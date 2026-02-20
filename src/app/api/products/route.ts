import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 5-minute rotation offset.
 * Every 5 minutes, the "window" of promoted products shifts by a fixed step,
 * so different promoted products get visibility over time.
 */
function getRotationOffset(totalPromoted: number): number {
  if (totalPromoted <= 0) return 0;
  const epoch5min = Math.floor(Date.now() / 300_000); // changes every 5 min
  const step = 5; // shift by 5 products each rotation
  return (epoch5min * step) % totalPromoted;
}

/**
 * Rotate an array by the given offset.
 * e.g. rotateArray([A,B,C,D,E], 2) => [C,D,E,A,B]
 */
function rotateArray<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0 || offset === 0) return arr;
  const n = offset % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

/**
 * GET /api/products
 * Public product listing with filters and pagination.
 * Query params: ?category=, ?brand=, ?search=, ?sort=, ?promoted=true, ?offers=true, ?region=, ?minPrice=, ?maxPrice=, ?page=, ?limit=
 *
 * Sorting logic:
 *  - ?promoted=true — only promoted products (with 5-min rotation).
 *  - ?offers=true — only offer/discount products where originalPrice > price (with rotation).
 *  - Mixed mode — three-tier: Promoted → Offers → Organic.
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
    const offers = searchParams.get("offers");
    const sellerId = searchParams.get("seller");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    // Build shared where clause (filters that apply to all products)
    const baseWhere: Record<string, unknown> = {
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      baseWhere.category = { slug: categorySlug };
    }

    if (brandSlug) {
      baseWhere.brand = { slug: brandSlug };
    }

    if (regionCode) {
      baseWhere.region = { code: regionCode };
    }

    if (sellerId) {
      baseWhere.sellerId = sellerId;
    }

    if (minPrice || maxPrice) {
      baseWhere.price = {};
      if (minPrice) (baseWhere.price as Record<string, unknown>).gte = parseFloat(minPrice);
      if (maxPrice) (baseWhere.price as Record<string, unknown>).lte = parseFloat(maxPrice);
    }

    // Organic sort order
    let organicOrderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") organicOrderBy = { price: "asc" };
    else if (sort === "price_desc") organicOrderBy = { price: "desc" };
    else if (sort === "popular") organicOrderBy = { soldCount: "desc" };

    const include = {
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
    };

    // ─── Promoted-only mode (homepage "Promociones") ───
    if (promoted === "true") {
      const allPromoted = await prisma.product.findMany({
        where: { ...baseWhere, isPromoted: true },
        include,
        orderBy: { createdAt: "asc" },
      });

      const total = allPromoted.length;
      const offset = getRotationOffset(total);
      const rotated = rotateArray(allPromoted, offset);
      const skip = (page - 1) * limit;
      const pageProducts = rotated.slice(skip, skip + limit);

      return NextResponse.json({
        products: pageProducts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // ─── Offers-only mode (homepage "Ofertas del día") ───
    if (offers === "true") {
      // Prisma can't do cross-column comparison, so fetch with originalPrice set and filter in-memory
      const allWithOriginal = await prisma.product.findMany({
        where: { ...baseWhere, originalPrice: { not: null } },
        include,
        orderBy: { createdAt: "asc" },
      });
      const offerProducts = allWithOriginal.filter(
        (p) => p.originalPrice !== null && p.originalPrice > p.price
      );

      const total = offerProducts.length;
      const offset = getRotationOffset(total);
      const rotated = rotateArray(offerProducts, offset);
      const skip = (page - 1) * limit;
      const pageProducts = rotated.slice(skip, skip + limit);

      return NextResponse.json({
        products: pageProducts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // ─── Mixed mode: three-tier ordering (Promoted → Offers → Organic) ───
    const allProducts = await prisma.product.findMany({
      where: baseWhere,
      include,
      orderBy: { createdAt: "asc" },
    });

    // Split into three tiers
    const promotedProducts = allProducts.filter((p) => p.isPromoted);
    const offerProducts = allProducts.filter(
      (p) => !p.isPromoted && p.originalPrice !== null && p.originalPrice > p.price
    );
    const organicProducts = allProducts.filter(
      (p) => !p.isPromoted && !(p.originalPrice !== null && p.originalPrice > p.price)
    );

    // Apply rotation to promoted and offers
    const rotatedPromoted = rotateArray(promotedProducts, getRotationOffset(promotedProducts.length));
    const rotatedOffers = rotateArray(offerProducts, getRotationOffset(offerProducts.length));

    // Sort organic by user's chosen sort
    organicProducts.sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "popular") return (b.soldCount ?? 0) - (a.soldCount ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Combine: Promoted → Offers → Organic
    const combined = [...rotatedPromoted, ...rotatedOffers, ...organicProducts];
    const total = combined.length;
    const skip = (page - 1) * limit;
    const pageProducts = combined.slice(skip, skip + limit);

    return NextResponse.json({
      products: pageProducts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

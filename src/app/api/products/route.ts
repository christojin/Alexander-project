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
 * Query params: ?category=, ?brand=, ?search=, ?sort=, ?promoted=true, ?region=, ?minPrice=, ?maxPrice=, ?page=, ?limit=
 *
 * Sorting logic:
 *  - Promoted products always appear FIRST (with 5-min rotation among themselves).
 *  - Organic (non-promoted) products follow, sorted by the user's chosen sort.
 *  - When ?promoted=true, only promoted products are returned (with rotation).
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

    // ─── Promoted-only mode (homepage "Ofertas del dia") ───
    if (promoted === "true") {
      const promotedWhere = { ...baseWhere, isPromoted: true };

      // Get ALL promoted products (no pagination) so we can rotate, then slice
      const allPromoted = await prisma.product.findMany({
        where: promotedWhere,
        include,
        orderBy: { createdAt: "asc" }, // stable base order for rotation
      });

      const total = allPromoted.length;
      const offset = getRotationOffset(total);
      const rotated = rotateArray(allPromoted, offset);

      // Apply pagination to the rotated list
      const skip = (page - 1) * limit;
      const pageProducts = rotated.slice(skip, skip + limit);

      return NextResponse.json({
        products: pageProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // ─── Mixed mode: promoted-first + organic ───
    // Fetch promoted and organic counts
    const promotedWhere = { ...baseWhere, isPromoted: true };
    const organicWhere = { ...baseWhere, isPromoted: false };

    const [totalPromoted, totalOrganic] = await Promise.all([
      prisma.product.count({ where: promotedWhere }),
      prisma.product.count({ where: organicWhere }),
    ]);

    const total = totalPromoted + totalOrganic;
    const skip = (page - 1) * limit;

    // Get all promoted products (for rotation)
    const allPromoted = totalPromoted > 0
      ? await prisma.product.findMany({
          where: promotedWhere,
          include,
          orderBy: { createdAt: "asc" },
        })
      : [];

    const rotationOffset = getRotationOffset(allPromoted.length);
    const rotatedPromoted = rotateArray(allPromoted, rotationOffset);

    // Determine how many promoted vs organic products to show on this page
    let pageProducts;

    if (skip < rotatedPromoted.length) {
      // This page starts within the promoted section
      const promotedSlice = rotatedPromoted.slice(skip, skip + limit);
      const remainingSlots = limit - promotedSlice.length;

      if (remainingSlots > 0) {
        // Fill remaining slots with organic products
        const organicProducts = await prisma.product.findMany({
          where: organicWhere,
          include,
          orderBy: organicOrderBy,
          take: remainingSlots,
        });
        pageProducts = [...promotedSlice, ...organicProducts];
      } else {
        pageProducts = promotedSlice;
      }
    } else {
      // This page is entirely in the organic section
      const organicSkip = skip - rotatedPromoted.length;
      const organicProducts = await prisma.product.findMany({
        where: organicWhere,
        include,
        orderBy: organicOrderBy,
        skip: organicSkip,
        take: limit,
      });
      pageProducts = organicProducts;
    }

    return NextResponse.json({
      products: pageProducts,
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

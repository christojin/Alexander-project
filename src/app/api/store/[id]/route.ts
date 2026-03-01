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

    // ─── Special handling for "official" store (admin) ───
    if (id === "official") {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, name: true, avatar: true, createdAt: true },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Tienda oficial no encontrada" },
          { status: 404 }
        );
      }

      const { searchParams } = new URL(req.url);
      const sort = searchParams.get("sort");

      let orderBy: Record<string, string> = { createdAt: "desc" };
      if (sort === "price_asc") orderBy = { price: "asc" };
      else if (sort === "price_desc") orderBy = { price: "desc" };
      else if (sort === "popular") orderBy = { soldCount: "desc" };

      // Find admin's seller profile if it exists, or find all products from all sellers
      const adminSeller = await prisma.sellerProfile.findUnique({
        where: { userId: admin.id },
        select: { id: true },
      });

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          ...(adminSeller ? { sellerId: adminSeller.id } : {}),
        },
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

      const officialSeller = {
        id: "official",
        storeName: "Tienda Oficial VirtuMall",
        slug: "official",
        storePhoto: null,
        storeDescription:
          "Bienvenido a la tienda oficial de VirtuMall. Aqui encontraras productos verificados y ofertas exclusivas con garantia de la plataforma.",
        rating: 5,
        totalReviews: 0,
        totalSales: products.reduce((sum, p) => sum + (p.soldCount ?? 0), 0),
        isVerified: true,
        isOfficial: true,
        marketType: "BOTH",
        createdAt: admin.createdAt,
        user: {
          name: admin.name,
          avatar: admin.avatar,
          createdAt: admin.createdAt,
        },
        country: null,
        businessHours: [],
      };

      return NextResponse.json({ seller: officialSeller, products });
    }

    // ─── Regular seller store ───
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

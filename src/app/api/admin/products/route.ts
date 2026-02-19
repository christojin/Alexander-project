import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/products
 * Admin endpoint: returns all products with seller/category/brand/region info.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("category");
    const sellerId = searchParams.get("seller");
    const status = searchParams.get("status"); // "active" | "inactive"

    const where: Record<string, unknown> = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { seller: { storeName: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        seller: {
          select: {
            id: true,
            storeName: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch categories and sellers for filter dropdowns
    const [categories, sellers] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.sellerProfile.findMany({
        select: { id: true, storeName: true },
        orderBy: { storeName: "asc" },
      }),
    ]);

    return NextResponse.json({ products, categories, sellers });
  } catch (error) {
    console.error("[Admin Products GET] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/catalog
 * Public endpoint returning active categories, brands, and regions.
 * Used for dropdown options across the app.
 */
export async function GET() {
  try {
    const [categories, brands, regions] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, logo: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.region.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, flagEmoji: true },
        orderBy: { displayOrder: "asc" },
      }),
    ]);

    return NextResponse.json({ categories, brands, regions });
  } catch (error) {
    console.error("[Catalog GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/banners
 * Public endpoint returning active banners ordered by displayOrder.
 * Used by the homepage hero slider.
 */
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
        bgColor: true,
        brandImages: true,
        displayOrder: true,
      },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("[Banners GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

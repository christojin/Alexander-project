import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/banners
 * Admin endpoint: returns ALL banners (active + inactive) for management.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const banners = await prisma.banner.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("[Admin Banners GET] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/admin/banners
 * Create a new banner.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { title, subtitle, description, imageUrl, linkUrl, bgColor, brandImages, displayOrder, isActive } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl es requerido" }, { status: 400 });
    }

    // Get max displayOrder if not provided
    let order = displayOrder;
    if (order == null) {
      const max = await prisma.banner.aggregate({ _max: { displayOrder: true } });
      order = (max._max.displayOrder ?? 0) + 1;
    }

    const banner = await prisma.banner.create({
      data: {
        title: title ?? null,
        subtitle: subtitle ?? null,
        description: description ?? null,
        imageUrl,
        linkUrl: linkUrl ?? null,
        bgColor: bgColor ?? null,
        brandImages: brandImages ?? null,
        displayOrder: order,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error("[Admin Banners POST] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

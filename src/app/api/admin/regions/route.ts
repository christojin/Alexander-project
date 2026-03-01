import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/regions
 * List all regions with product counts.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const regions = await prisma.region.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      regions.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        flagEmoji: r.flagEmoji,
        flagImage: r.flagImage,
        displayOrder: r.displayOrder,
        productCount: r._count.products,
        isActive: r.isActive,
      }))
    );
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/admin/regions
 * Create a new region.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, flagEmoji, flagImage, displayOrder } = body as {
      name: string;
      code: string;
      flagEmoji?: string;
      flagImage?: string;
      displayOrder?: number;
    };

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Nombre y codigo son requeridos" }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();
    const existing = await prisma.region.findUnique({ where: { code: upperCode } });
    if (existing) {
      return NextResponse.json({ error: `La region ${upperCode} ya existe` }, { status: 409 });
    }

    const region = await prisma.region.create({
      data: {
        name: name.trim(),
        code: upperCode,
        flagEmoji: flagEmoji?.trim() || null,
        flagImage: flagImage?.trim() || null,
        displayOrder: displayOrder ?? 0,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      {
        id: region.id,
        name: region.name,
        code: region.code,
        flagEmoji: region.flagEmoji,
        flagImage: region.flagImage,
        displayOrder: region.displayOrder,
        productCount: region._count.products,
        isActive: region.isActive,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating region:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

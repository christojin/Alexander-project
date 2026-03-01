import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/brands
 * List all brands with product counts.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const brands = await prisma.brand.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        displayOrder: b.displayOrder,
        productCount: b._count.products,
        isActive: b.isActive,
        createdAt: b.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/admin/brands
 * Create a new brand.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, logo, displayOrder } = body as {
      name: string;
      slug?: string;
      logo?: string;
      displayOrder?: number;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const finalSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await prisma.brand.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        logo: logo?.trim() || null,
        displayOrder: displayOrder ?? 0,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        displayOrder: brand.displayOrder,
        productCount: brand._count.products,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

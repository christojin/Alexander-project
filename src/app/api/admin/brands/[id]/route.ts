import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/brands/[id]
 * Update a brand.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, slug, logo, isActive, displayOrder } = body as {
      name?: string;
      slug?: string;
      logo?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    };

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.brand.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
      }
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(slug != null && { slug: slug.trim() }),
        ...(logo !== undefined && { logo: logo?.trim() || null }),
        ...(isActive != null && { isActive }),
        ...(displayOrder != null && { displayOrder }),
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      logo: updated.logo,
      displayOrder: updated.displayOrder,
      productCount: updated._count.products,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
    }
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/brands/[id]
 * Delete a brand.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
    }
    console.error("Error deleting brand:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

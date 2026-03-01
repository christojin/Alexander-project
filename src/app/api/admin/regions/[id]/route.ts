import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/regions/[id]
 * Update a region.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, code, flagEmoji, flagImage, isActive, displayOrder } = body as {
      name?: string;
      code?: string;
      flagEmoji?: string | null;
      flagImage?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    };

    // Check code uniqueness if changed
    if (code) {
      const upperCode = code.trim().toUpperCase();
      const existing = await prisma.region.findFirst({
        where: { code: upperCode, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: `El codigo ${upperCode} ya existe` }, { status: 409 });
      }
    }

    const updated = await prisma.region.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(code != null && { code: code.trim().toUpperCase() }),
        ...(flagEmoji !== undefined && { flagEmoji: flagEmoji?.trim() || null }),
        ...(flagImage !== undefined && { flagImage: flagImage?.trim() || null }),
        ...(isActive != null && { isActive }),
        ...(displayOrder != null && { displayOrder }),
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
      flagEmoji: updated.flagEmoji,
      flagImage: updated.flagImage,
      displayOrder: updated.displayOrder,
      productCount: updated._count.products,
      isActive: updated.isActive,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Region no encontrada" }, { status: 404 });
    }
    console.error("Error updating region:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/regions/[id]
 * Delete a region.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    await prisma.region.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Region no encontrada" }, { status: 404 });
    }
    console.error("Error deleting region:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

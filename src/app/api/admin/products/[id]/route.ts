import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * PUT /api/admin/products/[id]
 * Admin: update product fields (name, description, price, stock, active, featured, category).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, price, stockCount, isActive, isPromoted, categoryId } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(stockCount !== undefined && { stockCount }),
        ...(isActive !== undefined && { isActive }),
        ...(isPromoted !== undefined && { isPromoted }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[Admin Products PUT] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Soft-delete (set isDeleted=true, isActive=false).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Products DELETE] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

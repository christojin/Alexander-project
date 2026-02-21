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
 * Products with sales history (soldCount > 0 or linked order items) CANNOT be deleted — only deactivated.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        _count: { select: { orderItems: true } },
        seller: { select: { id: true, storeName: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Block deletion if product has sales history
    const hasSales = existing.soldCount > 0 || existing._count.orderItems > 0;
    if (hasSales) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un producto con historial de ventas. Solo puedes desactivarlo.",
          code: "HAS_SALES_HISTORY",
        },
        { status: 403 }
      );
    }

    // No sales history — soft-delete with audit log
    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "product_deleted",
          entityType: "product",
          entityId: id,
          details: {
            productName: existing.name,
            productType: existing.productType,
            price: existing.price,
            stockCount: existing.stockCount,
            soldCount: existing.soldCount,
            sellerId: existing.seller?.id,
            sellerName: existing.seller?.storeName,
            reason: "admin_deleted_no_sales",
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Products DELETE] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

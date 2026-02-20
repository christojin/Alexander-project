import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/seller/products/[id]
 * Get a single product detail for the authenticated seller.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller) {
      return NextResponse.json(
        { error: "Perfil de vendedor no encontrado" },
        { status: 404 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            giftCardCodes: { where: { status: "AVAILABLE" } },
            streamingAccounts: { where: { status: "AVAILABLE" } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[Seller Product GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/products/[id]
 * Update a product owned by the authenticated seller.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller) {
      return NextResponse.json(
        { error: "Perfil de vendedor no encontrado" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      originalPrice,
      productType,
      deliveryType,
      streamingMode,
      profileCount,
      duration,
      image,
      categoryId,
      brandId,
      regionId,
      isActive,
    } = body;

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description.trim();
    if (price !== undefined) {
      if (typeof price !== "number" || price <= 0) {
        return NextResponse.json(
          { error: "El precio debe ser mayor a 0" },
          { status: 400 }
        );
      }
      data.price = price;
    }
    if (originalPrice !== undefined) data.originalPrice = originalPrice || null;
    if (productType !== undefined) data.productType = productType;
    if (deliveryType !== undefined) data.deliveryType = deliveryType;
    if (streamingMode !== undefined) data.streamingMode = streamingMode || null;
    if (profileCount !== undefined) data.profileCount = profileCount || null;
    if (duration !== undefined) data.duration = duration || null;
    if (image !== undefined) data.image = image || null;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (brandId !== undefined) data.brandId = brandId || null;
    if (regionId !== undefined) data.regionId = regionId || null;
    if (isActive !== undefined) data.isActive = isActive;

    // Promotion toggle with quota validation
    if (body.isPromoted !== undefined) {
      if (body.isPromoted === true && !existing.isPromoted) {
        // Check seller's promotion quota
        const promotedCount = await prisma.product.count({
          where: { sellerId: seller.id, isPromoted: true, isDeleted: false },
        });
        if (promotedCount >= seller.promotionQuota) {
          return NextResponse.json(
            {
              error: seller.promotionQuota === 0
                ? "No tienes cuota de promocion asignada. Contacta al administrador."
                : `Has alcanzado tu limite de ${seller.promotionQuota} productos promocionados`,
            },
            { status: 400 }
          );
        }
        data.isPromoted = true;
      } else if (body.isPromoted === false) {
        data.isPromoted = false;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[Seller Product PUT] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seller/products/[id]
 * Soft-delete a product owned by the authenticated seller.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller) {
      return NextResponse.json(
        { error: "Perfil de vendedor no encontrado" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("[Seller Product DELETE] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

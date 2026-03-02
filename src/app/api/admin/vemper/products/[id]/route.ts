import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slugify";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/vemper/products/[id]
 * Update local VemperProduct settings (salePrice, isActive, categoryId, regionId).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const { id } = await params;
    const body = await req.json();
    const { salePrice, isActive, categoryId, regionId } = body as {
      salePrice?: number;
      isActive?: boolean;
      categoryId?: string | null;
      regionId?: string | null;
    };
  
    const product = await prisma.vemperProduct.update({
      where: { id },
      data: {
        ...(salePrice !== undefined && { salePrice }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryId !== undefined && { categoryId }),
        ...(regionId !== undefined && { regionId }),
      },
    });
  
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[AdminVemperProductsId] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vemper/products/[id]
 * Publish a VemperProduct as a buyer-facing Product in the catalog.
 * Body: { sellerId, categoryId, name?, description?, price?, image? }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const { id } = await params;
  
    const vemperProduct = await prisma.vemperProduct.findUnique({
      where: { id },
      include: {
        products: { where: { isDeleted: false }, select: { id: true } },
      },
    });
  
    if (!vemperProduct) {
      return NextResponse.json(
        { error: "Producto Vemper no encontrado" },
        { status: 404 }
      );
    }
  
    // Check if already published
    if (vemperProduct.products.length > 0) {
      return NextResponse.json(
        { error: "Este producto ya esta publicado en el catalogo" },
        { status: 400 }
      );
    }
  
    const body = await req.json();
    const { sellerId, categoryId, name, description, price, image } = body as {
      sellerId: string;
      categoryId: string;
      name?: string;
      description?: string;
      price?: number;
      image?: string;
    };
  
    if (!sellerId || !categoryId) {
      return NextResponse.json(
        { error: "sellerId y categoryId son requeridos" },
        { status: 400 }
      );
    }
  
    const productName = name || vemperProduct.name;
    const slug = uniqueSlug(productName);
  
    const product = await prisma.product.create({
      data: {
        name: productName,
        slug,
        description:
          description || `${vemperProduct.name} - Entrega automatica via Vemper`,
        price: price || vemperProduct.salePrice,
        productType: vemperProduct.type === "GIFT_CARD" ? "GIFT_CARD" : "TOP_UP",
        deliveryType: "INSTANT",
        sellerId,
        categoryId,
        image: image || vemperProduct.image || "/images/products/default.png",
        isActive: true,
        stockCount: 9999,
        vemperProductId: vemperProduct.id,
      },
    });
  
    // Update VemperProduct category/region if set
    if (vemperProduct.categoryId !== categoryId) {
      await prisma.vemperProduct.update({
        where: { id },
        data: { categoryId },
      });
    }
  
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[AdminVemperProductsId] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

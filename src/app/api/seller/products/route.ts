import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slugify";

/**
 * GET /api/seller/products
 * List all products for the authenticated seller.
 * Query params: ?search=, ?category=, ?status=active|inactive
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("category");
    const status = searchParams.get("status"); // "active" | "inactive"

    const where: Record<string, unknown> = {
      sellerId: seller.id,
      isDeleted: false,
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const products = await prisma.product.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[Seller Products GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/products
 * Create a new product for the authenticated seller.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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

    if (seller.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Tu cuenta de vendedor aun no esta aprobada" },
        { status: 403 }
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
    } = body;

    // Validation
    if (!name || !description || !price || !categoryId || !productType) {
      return NextResponse.json(
        { error: "Nombre, descripcion, precio, categoria y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const validTypes = ["GIFT_CARD", "STREAMING", "TOP_UP", "MANUAL"];
    if (!validTypes.includes(productType)) {
      return NextResponse.json(
        { error: "Tipo de producto invalido" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Categoria no encontrada" },
        { status: 400 }
      );
    }

    const slug = uniqueSlug(name);

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        price,
        originalPrice: originalPrice || null,
        productType,
        deliveryType: deliveryType || "INSTANT",
        streamingMode: productType === "STREAMING" ? (streamingMode || "COMPLETE_ACCOUNT") : null,
        profileCount: profileCount || null,
        duration: duration || null,
        image: image || null,
        categoryId,
        brandId: brandId || null,
        regionId: regionId || null,
        sellerId: seller.id,
        stockCount: 0,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[Seller Products POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

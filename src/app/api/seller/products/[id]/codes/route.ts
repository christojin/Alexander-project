import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/seller/products/[id]/codes
 * List gift card codes for a product.
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

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const codes = await prisma.giftCardCode.findMany({
      where: { productId: id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        soldAt: true,
        createdAt: true,
        // Never expose the encrypted code in listing
        codeEncrypted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: codes.length,
      available: codes.filter((c) => c.status === "AVAILABLE").length,
      sold: codes.filter((c) => c.status === "SOLD").length,
      reserved: codes.filter((c) => c.status === "RESERVED").length,
      expired: codes.filter((c) => c.status === "EXPIRED").length,
    };

    return NextResponse.json({ codes, summary });
  } catch (error) {
    console.error("[Seller Codes GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/products/[id]/codes
 * Bulk upload gift card codes.
 * Body: { codes: string[], pin?: string }
 * Note: AES-256 encryption deferred to Week 4 — using ENC: prefix as placeholder.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    // Verify product ownership and type
    const product = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
    if (product.productType !== "GIFT_CARD") {
      return NextResponse.json(
        { error: "Este producto no es de tipo Gift Card" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { codes, expiresAt } = body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: "Debes proporcionar al menos un codigo" },
        { status: 400 }
      );
    }

    if (codes.length > 500) {
      return NextResponse.json(
        { error: "Maximo 500 codigos por carga" },
        { status: 400 }
      );
    }

    // Filter out empty/duplicate codes
    const uniqueCodes = [...new Set(
      codes
        .map((c: unknown) => String(c).trim())
        .filter((c: string) => c.length > 0)
    )];

    if (uniqueCodes.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron codigos validos" },
        { status: 400 }
      );
    }

    // AES-256-GCM encryption
    const encryptedCodes = uniqueCodes.map((code) => encrypt(code));

    // Bulk create codes and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.giftCardCode.createMany({
        data: encryptedCodes.map((encrypted) => ({
          productId: id,
          codeEncrypted: encrypted,
          status: "AVAILABLE" as const,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })),
      });

      await tx.product.update({
        where: { id },
        data: { stockCount: { increment: created.count } },
      });

      return created;
    });

    return NextResponse.json(
      {
        message: `${result.count} codigos agregados exitosamente`,
        added: result.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Seller Codes POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

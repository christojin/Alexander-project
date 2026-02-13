import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/seller/products/[id]/accounts
 * List streaming accounts for a product.
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
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const accounts = await prisma.streamingAccount.findMany({
      where: { productId: id },
      select: {
        id: true,
        status: true,
        maxProfiles: true,
        soldProfiles: true,
        expiresAt: true,
        soldAt: true,
        createdAt: true,
        // Never expose encrypted credentials in listing
        emailEncrypted: false,
        passwordEncrypted: false,
        usernameEncrypted: false,
        profiles: {
          select: {
            id: true,
            profileNumber: true,
            buyerId: true,
            assignedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: accounts.length,
      available: accounts.filter((a) => a.status === "AVAILABLE").length,
      sold: accounts.filter((a) => a.status === "SOLD").length,
      suspended: accounts.filter((a) => a.status === "SUSPENDED").length,
      expired: accounts.filter((a) => a.status === "EXPIRED").length,
    };

    return NextResponse.json({ accounts, summary });
  } catch (error) {
    console.error("[Seller Accounts GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/products/[id]/accounts
 * Add a streaming account.
 * Body: { email, username?, password, expiresAt?, maxProfiles? }
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

    const product = await prisma.product.findFirst({
      where: { id, sellerId: seller.id, isDeleted: false },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
    if (product.productType !== "STREAMING") {
      return NextResponse.json(
        { error: "Este producto no es de tipo Streaming" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, username, password, expiresAt, maxProfiles } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contrasena son requeridos" },
        { status: 400 }
      );
    }

    // Placeholder encryption (Week 4: replace with AES-256)
    const emailEncrypted = `ENC:${email}`;
    const passwordEncrypted = `ENC:${password}`;
    const usernameEncrypted = username ? `ENC:${username}` : null;

    const profileMode = product.streamingMode === "PROFILE";
    const numProfiles = profileMode ? (maxProfiles || product.profileCount || 1) : 1;

    // Create account + profiles and update stock in a transaction
    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.streamingAccount.create({
        data: {
          productId: id,
          emailEncrypted,
          usernameEncrypted,
          passwordEncrypted,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          maxProfiles: numProfiles,
          status: "AVAILABLE",
        },
      });

      // Create profile slots for PROFILE mode
      if (profileMode && numProfiles > 1) {
        await tx.streamingProfile.createMany({
          data: Array.from({ length: numProfiles }, (_, i) => ({
            streamingAccountId: created.id,
            profileNumber: i + 1,
          })),
        });

        // Each profile is a sellable unit
        await tx.product.update({
          where: { id },
          data: { stockCount: { increment: numProfiles } },
        });
      } else {
        // Complete account = 1 stock unit
        await tx.product.update({
          where: { id },
          data: { stockCount: { increment: 1 } },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        message: "Cuenta agregada exitosamente",
        accountId: account.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Seller Accounts POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

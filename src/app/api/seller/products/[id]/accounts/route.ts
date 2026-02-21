import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

type RouteParams = { params: Promise<{ id: string }> };

/** Verify seller owns this product and return both seller + product */
async function verifySellerProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return { error: "No autorizado", status: 401 } as const;
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller) {
    return { error: "Perfil de vendedor no encontrado", status: 404 } as const;
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id, isDeleted: false },
  });
  if (!product) {
    return { error: "Producto no encontrado", status: 404 } as const;
  }

  return { seller, product } as const;
}

/**
 * GET /api/seller/products/[id]/accounts
 * List streaming accounts for a product.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await verifySellerProduct(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
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
        updatedAt: true,
        emailEncrypted: true,
        passwordEncrypted: false,
        usernameEncrypted: true,
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

    // Decrypt email/username for seller display (never expose password)
    const accountsDecrypted = accounts.map((a) => ({
      ...a,
      email: a.emailEncrypted ? decrypt(a.emailEncrypted) : null,
      username: a.usernameEncrypted ? decrypt(a.usernameEncrypted) : null,
      emailEncrypted: undefined,
      usernameEncrypted: undefined,
    }));

    const summary = {
      total: accounts.length,
      available: accounts.filter((a) => a.status === "AVAILABLE").length,
      sold: accounts.filter((a) => a.status === "SOLD").length,
      suspended: accounts.filter((a) => a.status === "SUSPENDED").length,
      expired: accounts.filter((a) => a.status === "EXPIRED").length,
    };

    return NextResponse.json({ accounts: accountsDecrypted, summary });
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
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await verifySellerProduct(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { product } = result;

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

    // AES-256-GCM encryption
    const emailEncrypted = encrypt(email);
    const passwordEncrypted = encrypt(password);
    const usernameEncrypted = username ? encrypt(username) : null;

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

/**
 * PATCH /api/seller/products/[id]/accounts
 * Edit or suspend/resume a streaming account.
 * Body: { accountId, email?, username?, password?, expiresAt?, action?: "suspend" | "resume" }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await verifySellerProduct(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await req.json();
    const { accountId, email, username, password, expiresAt, action } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId es requerido" },
        { status: 400 }
      );
    }

    // Verify account belongs to this product
    const account = await prisma.streamingAccount.findFirst({
      where: { id: accountId, productId: id },
    });
    if (!account) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    // Handle suspend/resume action
    if (action === "suspend" || action === "resume") {
      if (action === "suspend" && account.status !== "AVAILABLE") {
        return NextResponse.json(
          { error: "Solo se pueden suspender cuentas disponibles" },
          { status: 400 }
        );
      }
      if (action === "resume" && account.status !== "SUSPENDED") {
        return NextResponse.json(
          { error: "Solo se pueden reactivar cuentas suspendidas" },
          { status: 400 }
        );
      }

      const newStatus = action === "suspend" ? "SUSPENDED" : "AVAILABLE";

      await prisma.$transaction(async (tx) => {
        await tx.streamingAccount.update({
          where: { id: accountId },
          data: { status: newStatus },
        });

        // Adjust stock: suspend removes from stock, resume adds back
        const profileMode = result.product.streamingMode === "PROFILE";
        const stockDelta = action === "suspend"
          ? -(profileMode ? account.maxProfiles - account.soldProfiles : 1)
          : (profileMode ? account.maxProfiles - account.soldProfiles : 1);

        if (stockDelta !== 0) {
          await tx.product.update({
            where: { id },
            data: { stockCount: { increment: stockDelta } },
          });
        }
      });

      return NextResponse.json({
        message: action === "suspend"
          ? "Cuenta suspendida exitosamente"
          : "Cuenta reactivada exitosamente",
      });
    }

    // Handle credential edit
    if (account.status === "SOLD") {
      return NextResponse.json(
        { error: "No se puede editar una cuenta ya vendida" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (email) updateData.emailEncrypted = encrypt(email);
    if (username !== undefined) updateData.usernameEncrypted = username ? encrypt(username) : null;
    if (password) updateData.passwordEncrypted = encrypt(password);
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      );
    }

    await prisma.streamingAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json({ message: "Cuenta actualizada exitosamente" });
  } catch (error) {
    console.error("[Seller Accounts PATCH] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

/** Convert expirationDays to a Date */
function daysToDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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
 * Add streaming account(s).
 *
 * Single:  { email, username?, password, expirationDays?, maxProfiles? }
 * Bulk:    { accounts: [{ email, username?, password, expirationDays? }] }
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
    const profileMode = product.streamingMode === "PROFILE";

    // Normalize input: support both single and bulk
    interface AccountInput {
      email: string;
      username?: string;
      password: string;
      expirationDays?: number;
      maxProfiles?: number;
    }

    let accountInputs: AccountInput[];

    if (Array.isArray(body.accounts)) {
      // Bulk mode
      accountInputs = body.accounts;
    } else {
      // Single mode
      accountInputs = [{
        email: body.email,
        username: body.username,
        password: body.password,
        expirationDays: body.expirationDays,
        maxProfiles: body.maxProfiles,
      }];
    }

    // Validate
    const invalid = accountInputs.find((a) => !a.email || !a.password);
    if (invalid || accountInputs.length === 0) {
      return NextResponse.json(
        { error: "Email y contrasena son requeridos para cada cuenta" },
        { status: 400 }
      );
    }

    let addedCount = 0;

    for (const input of accountInputs) {
      const emailEncrypted = encrypt(input.email);
      const passwordEncrypted = encrypt(input.password);
      const usernameEncrypted = input.username ? encrypt(input.username) : null;
      const numProfiles = profileMode ? (input.maxProfiles || product.profileCount || 1) : 1;
      const expiresAt = input.expirationDays && input.expirationDays > 0
        ? daysToDate(input.expirationDays)
        : null;

      await prisma.$transaction(async (tx) => {
        const created = await tx.streamingAccount.create({
          data: {
            productId: id,
            emailEncrypted,
            usernameEncrypted,
            passwordEncrypted,
            expiresAt,
            maxProfiles: numProfiles,
            status: "AVAILABLE",
          },
        });

        if (profileMode && numProfiles > 1) {
          await tx.streamingProfile.createMany({
            data: Array.from({ length: numProfiles }, (_, i) => ({
              streamingAccountId: created.id,
              profileNumber: i + 1,
            })),
          });
          await tx.product.update({
            where: { id },
            data: { stockCount: { increment: numProfiles } },
          });
        } else {
          await tx.product.update({
            where: { id },
            data: { stockCount: { increment: 1 } },
          });
        }
      });

      addedCount++;
    }

    return NextResponse.json(
      {
        message: addedCount === 1
          ? "Cuenta agregada exitosamente"
          : `${addedCount} cuentas agregadas exitosamente`,
        added: addedCount,
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
 * Body: { accountId, email?, username?, password?, expirationDays?, action?: "suspend" | "resume" }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await verifySellerProduct(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await req.json();
    const { accountId, email, username, password, expirationDays, action } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId es requerido" },
        { status: 400 }
      );
    }

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
    if (expirationDays !== undefined) {
      updateData.expiresAt = expirationDays && expirationDays > 0
        ? daysToDate(expirationDays)
        : null;
    }

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

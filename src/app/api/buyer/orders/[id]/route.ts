import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/buyer/orders/[id]
 *
 * Get detailed order information including digital codes for the buyer.
 * Gift card codes are only decrypted and exposed when payment is COMPLETED.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        buyerId: session.user.id,
      },
      include: {
        seller: {
          select: { storeName: true, storePhoto: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
                productType: true,
                streamingMode: true,
              },
            },
            giftCardCodes: {
              select: {
                id: true,
                codeEncrypted: true,
                pin: true,
                expiresAt: true,
              },
            },
            streamingProfiles: {
              include: {
                streamingAccount: {
                  select: {
                    emailEncrypted: true,
                    usernameEncrypted: true,
                    passwordEncrypted: true,
                    expiresAt: true,
                    maxProfiles: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            paymentMethod: true,
            amount: true,
            currency: true,
            completedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Only decrypt and expose codes when payment is completed
    const paymentCompleted = order.payment?.status === "COMPLETED";

    const sanitizedItems = order.items.map((item) => ({
      ...item,
      giftCardCodes: paymentCompleted
        ? item.giftCardCodes.map((gc) => ({
            id: gc.id,
            code: decrypt(gc.codeEncrypted),
            pin: gc.pin ? decrypt(gc.pin) : null,
            expiresAt: gc.expiresAt,
          }))
        : item.giftCardCodes.map((gc) => ({
            id: gc.id,
            code: null,
            pin: null,
            expiresAt: gc.expiresAt,
            message: "El codigo estara disponible una vez completado el pago",
          })),
      streamingProfiles: paymentCompleted
        ? item.streamingProfiles.map((sp) => ({
            ...sp,
            streamingAccount: sp.streamingAccount
              ? {
                  email: decrypt(sp.streamingAccount.emailEncrypted),
                  username: sp.streamingAccount.usernameEncrypted
                    ? decrypt(sp.streamingAccount.usernameEncrypted)
                    : null,
                  password: decrypt(sp.streamingAccount.passwordEncrypted),
                  expiresAt: sp.streamingAccount.expiresAt,
                  maxProfiles: sp.streamingAccount.maxProfiles,
                }
              : null,
          }))
        : item.streamingProfiles.map((sp) => ({
            ...sp,
            streamingAccount: {
              email: null,
              username: null,
              password: null,
              expiresAt: sp.streamingAccount?.expiresAt ?? null,
              maxProfiles: sp.streamingAccount?.maxProfiles ?? null,
              message: "Las credenciales estaran disponibles una vez completado el pago",
            },
          })),
    }));

    return NextResponse.json({
      order: {
        ...order,
        items: sanitizedItems,
      },
    });
  } catch (error) {
    console.error("[Buyer Order Detail] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

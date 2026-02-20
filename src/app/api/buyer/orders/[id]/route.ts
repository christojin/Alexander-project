import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/buyer/orders/[id]
 *
 * Get detailed order information including digital codes for the buyer.
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

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[Buyer Order Detail] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { toFrontendOrderList } from "@/lib/api-transforms";

const ORDER_INCLUDE = {
  buyer: { select: { name: true, email: true } },
  seller: { select: { storeName: true, user: { select: { name: true } } } },
  items: {
    include: {
      product: { select: { image: true } },
      giftCardCodes: { select: { codeEncrypted: true } },
      streamingProfiles: {
        include: {
          streamingAccount: {
            select: {
              emailEncrypted: true,
              usernameEncrypted: true,
              passwordEncrypted: true,
              expiresAt: true,
            },
          },
        },
      },
    },
  },
  payment: true,
};

/**
 * GET /api/seller/orders
 * List all orders for the authenticated seller's store.
 */
export async function GET() {
  try {
    const authResult = await requireSeller();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
  
    if (!seller) {
      return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 403 });
    }
  
    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  
    return NextResponse.json(toFrontendOrderList(orders));
  } catch (error) {
    console.error("[SellerOrders] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

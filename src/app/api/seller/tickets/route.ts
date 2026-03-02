import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { toFrontendTickets } from "@/lib/api-transforms";

const TICKET_INCLUDE = {
  buyer: { select: { name: true } },
  seller: { select: { storeName: true, user: { select: { name: true } } } },
  messages: {
    orderBy: { createdAt: "asc" as const },
  },
};

/**
 * GET /api/seller/tickets
 * List tickets for the authenticated seller's store.
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
      return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
    }
  
    const tickets = await prisma.ticket.findMany({
      where: { sellerId: seller.id },
      include: TICKET_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
  
    return NextResponse.json(toFrontendTickets(tickets));
  } catch (error) {
    console.error("[SellerTickets] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

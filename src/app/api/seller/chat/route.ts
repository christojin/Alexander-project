import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFrontendChatConversation } from "@/lib/api-transforms";

/**
 * GET /api/seller/chat
 * List all chat conversations for the authenticated seller.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: { sellerId: seller.id },
    include: {
      buyer: { select: { name: true, avatar: true } },
      messages: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true,
          senderId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Resolve product names
  const productIds = conversations
    .map((c) => c.productId)
    .filter((id): id is string => !!id);

  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return NextResponse.json(
    conversations.map((c) => {
      const enriched = { ...c, product: c.productId ? { name: productMap.get(c.productId) ?? null } : null };
      return toFrontendChatConversation(enriched, "seller", session.user!.id!);
    })
  );
}

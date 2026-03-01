import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFrontendChatConversation } from "@/lib/api-transforms";

const CONVERSATION_INCLUDE = {
  seller: {
    select: {
      storeName: true,
      storePhoto: true,
      user: { select: { name: true } },
    },
  },
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
};

/**
 * GET /api/buyer/chat
 * List all chat conversations for the authenticated buyer.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: { buyerId: session.user.id },
    include: CONVERSATION_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  // Resolve product names for conversations that have a productId
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
      return toFrontendChatConversation(enriched, "buyer", session.user!.id!);
    })
  );
}

/**
 * POST /api/buyer/chat
 * Create or find a conversation with a seller.
 * Body: { sellerId: string, productId?: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { sellerId, productId } = body as {
    sellerId: string;
    productId?: string;
  };

  if (!sellerId?.trim()) {
    return NextResponse.json(
      { error: "sellerId es requerido" },
      { status: 400 }
    );
  }

  // Verify seller exists
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json(
      { error: "Vendedor no encontrado" },
      { status: 404 }
    );
  }

  // Upsert: find existing or create new conversation
  const conversation = await prisma.chatConversation.upsert({
    where: {
      buyerId_sellerId: {
        buyerId: session.user.id,
        sellerId,
      },
    },
    update: {},
    create: {
      buyerId: session.user.id,
      sellerId,
      productId: productId ?? null,
    },
  });

  return NextResponse.json({ conversationId: conversation.id });
}

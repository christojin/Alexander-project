import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFrontendChatMessage } from "@/lib/api-transforms";

/**
 * GET /api/buyer/chat/[id]
 * Fetch messages for a conversation. Marks seller messages as read.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify conversation belongs to buyer
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true },
  });

  if (!conversation || conversation.buyerId !== session.user.id) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  // Fetch messages
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages from seller as read
  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json(
    messages.map((m) => toFrontendChatMessage(m, conversation.buyerId))
  );
}

/**
 * POST /api/buyer/chat/[id]
 * Send a message in a conversation.
 * Body: { content: string, imageUrl?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, seller: { select: { userId: true } } },
  });

  if (!conversation || conversation.buyerId !== session.user.id) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { content, imageUrl } = body as {
    content: string;
    imageUrl?: string;
  };

  if (!content?.trim() && !imageUrl) {
    return NextResponse.json(
      { error: "El mensaje no puede estar vacio" },
      { status: 400 }
    );
  }

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: content?.trim() ?? "",
      imageUrl: imageUrl ?? undefined,
    },
    include: { sender: { select: { name: true } } },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Notify seller
  if (conversation.seller?.userId) {
    await prisma.notification.create({
      data: {
        userId: conversation.seller.userId,
        type: "NEW_CHAT_MESSAGE",
        title: "Nuevo mensaje",
        message: content?.trim().substring(0, 100) ?? "Imagen adjunta",
        link: "/seller/chat",
      },
    });
  }

  return NextResponse.json(
    toFrontendChatMessage(message, conversation.buyerId),
    { status: 201 }
  );
}

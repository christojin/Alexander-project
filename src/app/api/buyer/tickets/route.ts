import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
 * GET /api/buyer/tickets
 * List tickets for the authenticated buyer.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { buyerId: session.user.id },
    include: TICKET_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(toFrontendTickets(tickets));
}

/**
 * POST /api/buyer/tickets
 * Create a new ticket for an order.
 * Body: { orderId, subject, message }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, subject, message } = body as {
    orderId: string;
    subject: string;
    message: string;
  };

  if (!orderId || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "orderId, subject y message son requeridos" },
      { status: 400 }
    );
  }

  // Verify the order belongs to this buyer
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true },
  });

  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  const ticket = await prisma.ticket.create({
    data: {
      orderId,
      buyerId: session.user.id,
      sellerId: order.sellerId,
      subject: subject.trim(),
      status: "OPEN",
      priority: "MEDIUM",
      messages: {
        create: {
          senderId: session.user.id,
          senderRole: "BUYER",
          content: message.trim(),
        },
      },
    },
    include: TICKET_INCLUDE,
  });

  return NextResponse.json(toFrontendTickets([ticket])[0], { status: 201 });
}

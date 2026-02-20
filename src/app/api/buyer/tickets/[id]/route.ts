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
 * POST /api/buyer/tickets/[id]
 * Add a reply message to a ticket.
 * Body: { message }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: ticketId } = await params;
  const body = await req.json();
  const { message } = body as { message: string };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "El mensaje es requerido" },
      { status: 400 }
    );
  }

  // Verify the ticket belongs to this buyer
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { buyerId: true, status: true },
  });

  if (!ticket || ticket.buyerId !== session.user.id) {
    return NextResponse.json(
      { error: "Ticket no encontrado" },
      { status: 404 }
    );
  }

  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    return NextResponse.json(
      { error: "No se puede responder a un ticket cerrado o resuelto" },
      { status: 400 }
    );
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId: session.user.id,
      senderRole: "BUYER",
      content: message.trim(),
    },
  });

  // Update ticket timestamp
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
    include: TICKET_INCLUDE,
  });

  return NextResponse.json(toFrontendTickets([updated])[0]);
}

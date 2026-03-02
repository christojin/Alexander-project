import { NextRequest, NextResponse } from "next/server";
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
 * POST /api/seller/tickets/[id]
 * Add a reply to a ticket.
 * Body: { message }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSeller();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const { id: ticketId } = await params;
    const body = await req.json();
    const { message } = body as { message: string };
  
    if (!message?.trim()) {
      return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
    }
  
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
  
    if (!seller) {
      return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
    }
  
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { sellerId: true, status: true },
    });
  
    if (!ticket || ticket.sellerId !== seller.id) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }
  
    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "Ticket cerrado" }, { status: 400 });
    }
  
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.user.id,
        senderRole: "SELLER",
        content: message.trim(),
      },
    });
  
    // Auto-update status from OPEN to IN_PROGRESS on first seller reply
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (ticket.status === "OPEN") {
      updateData.status = "IN_PROGRESS";
    }
  
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: TICKET_INCLUDE,
    });
  
    return NextResponse.json(toFrontendTickets([updated])[0]);
  } catch (error) {
    console.error("[SellerTicketsId] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/seller/tickets/[id]
 * Update ticket status (resolve, close).
 * Body: { status: "resolved" | "closed" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSeller();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const { id: ticketId } = await params;
    const body = await req.json();
    const { status } = body as { status: string };
  
    const statusMap: Record<string, string> = {
      resolved: "RESOLVED",
      closed: "CLOSED",
    };
  
    const newStatus = statusMap[status];
    if (!newStatus) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }
  
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
  
    if (!seller) {
      return NextResponse.json({ error: "No es vendedor" }, { status: 403 });
    }
  
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { sellerId: true },
    });
  
    if (!ticket || ticket.sellerId !== seller.id) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }
  
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus as "RESOLVED" | "CLOSED",
        updatedAt: new Date(),
        closedAt: newStatus === "CLOSED" ? new Date() : undefined,
      },
      include: TICKET_INCLUDE,
    });
  
    return NextResponse.json(toFrontendTickets([updated])[0]);
  } catch (error) {
    console.error("[SellerTicketsId] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

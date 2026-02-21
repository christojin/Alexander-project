import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/announcements/[id]
 * Update an announcement.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.content === "string") updateData.content = body.content;
    if (["ALL", "BUYERS", "SELLERS"].includes(body.target)) updateData.target = body.target;
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay campos validos" }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { readBy: true } } },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
    }
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Delete an announcement.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
    }
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/currencies/[id]
 * Update a currency.
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
    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.symbol === "string") updateData.symbol = body.symbol;
    if (typeof body.exchangeRate === "number" && body.exchangeRate > 0) {
      updateData.exchangeRate = body.exchangeRate;
    }
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay campos validos" }, { status: 400 });
    }

    const currency = await prisma.currency.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ currency });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Moneda no encontrada" }, { status: 404 });
    }
    console.error("Error updating currency:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/currencies/[id]
 * Remove a currency.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.currency.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Moneda no encontrada" }, { status: 404 });
    }
    console.error("Error deleting currency:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

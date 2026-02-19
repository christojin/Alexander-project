import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface BusinessHourInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// PUT /api/seller/profile/business-hours — Save all business hours
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { hours } = body as { hours: BusinessHourInput[] };

    if (!hours || !Array.isArray(hours) || hours.length !== 7) {
      return NextResponse.json(
        { error: "Se requieren 7 dias de horario" },
        { status: 400 }
      );
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Upsert all 7 days in transaction
    await prisma.$transaction(
      hours.map((h) =>
        prisma.sellerBusinessHours.upsert({
          where: { sellerId_dayOfWeek: { sellerId: seller.id, dayOfWeek: h.dayOfWeek } },
          update: {
            openTime: h.isClosed ? "00:00" : h.openTime,
            closeTime: h.isClosed ? "00:00" : h.closeTime,
            isClosed: h.isClosed,
          },
          create: {
            sellerId: seller.id,
            dayOfWeek: h.dayOfWeek,
            openTime: h.isClosed ? "00:00" : h.openTime,
            closeTime: h.isClosed ? "00:00" : h.closeTime,
            isClosed: h.isClosed,
          },
        })
      )
    );

    return NextResponse.json({ message: "Horario actualizado" });
  } catch (error) {
    console.error("[Business Hours] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

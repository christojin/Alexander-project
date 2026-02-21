import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/announcements
 * List all announcements with read counts.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { readBy: true } },
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/admin/announcements
 * Create a new announcement.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, target, sendEmail } = body as {
      title: string;
      content: string;
      target: "ALL" | "BUYERS" | "SELLERS";
      sendEmail?: boolean;
    };

    if (!title || !content) {
      return NextResponse.json({ error: "Titulo y contenido son requeridos" }, { status: 400 });
    }

    const validTargets = ["ALL", "BUYERS", "SELLERS"];
    if (!validTargets.includes(target)) {
      return NextResponse.json({ error: "Destinatario invalido" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: { title, content, target },
      include: { _count: { select: { readBy: true } } },
    });

    // Email notification (placeholder — log for now)
    if (sendEmail) {
      const roleFilter =
        target === "ALL"
          ? {}
          : target === "BUYERS"
            ? { role: "BUYER" as const }
            : { role: "SELLER" as const };

      const users = await prisma.user.findMany({
        where: { isActive: true, ...roleFilter },
        select: { email: true, name: true },
      });

      console.log(
        `[EMAIL] Announcement "${title}" → ${users.length} recipients (${target}):`,
        users.map((u) => u.email)
      );
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

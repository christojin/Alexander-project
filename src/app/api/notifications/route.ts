import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications
 * Fetch current user's notifications + active announcements for their role.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role; // "ADMIN" | "BUYER" | "SELLER"

    // Fetch per-user notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Determine which announcement targets apply to this user
    const announcementTargets: ("ALL" | "BUYERS" | "SELLERS")[] = ["ALL"];
    if (userRole === "BUYER") announcementTargets.push("BUYERS");
    if (userRole === "SELLER") announcementTargets.push("SELLERS");
    if (userRole === "ADMIN") {
      announcementTargets.push("BUYERS", "SELLERS");
    }

    // Fetch active announcements with read status for this user
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        target: { in: announcementTargets },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        readBy: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    const formattedAnnouncements = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      target: a.target,
      isRead: a.readBy.length > 0,
      createdAt: a.createdAt,
    }));

    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const unreadAnnouncements = formattedAnnouncements.filter((a) => !a.isRead).length;

    return NextResponse.json({
      notifications,
      announcements: formattedAnnouncements,
      unreadCount: unreadNotifications + unreadAnnouncements,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/notifications/read
 * Mark notifications and/or announcements as read.
 * Body: { notificationIds?: string[], announcementIds?: string[], markAll?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { notificationIds, announcementIds, markAll } = body as {
      notificationIds?: string[];
      announcementIds?: string[];
      markAll?: boolean;
    };

    if (markAll) {
      // Mark all user notifications as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      // Mark all applicable announcements as read
      const userRole = session.user.role;
      const targets: ("ALL" | "BUYERS" | "SELLERS")[] = ["ALL"];
      if (userRole === "BUYER") targets.push("BUYERS");
      if (userRole === "SELLER") targets.push("SELLERS");
      if (userRole === "ADMIN") targets.push("BUYERS", "SELLERS");

      const unreadAnnouncements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          target: { in: targets },
          readBy: { none: { userId } },
        },
        select: { id: true },
      });

      if (unreadAnnouncements.length > 0) {
        await prisma.announcementRead.createMany({
          data: unreadAnnouncements.map((a) => ({
            announcementId: a.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Mark specific notifications
    if (notificationIds?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true },
      });
    }

    // Mark specific announcements
    if (announcementIds?.length) {
      await prisma.announcementRead.createMany({
        data: announcementIds.map((announcementId) => ({
          announcementId,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

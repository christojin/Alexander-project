import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings
 * Public endpoint returning non-sensitive platform settings
 * (site name, social links, contact info).
 */
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: {
        siteName: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        tiktokUrl: true,
        whatsappUrl: true,
        telegramUrl: true,
        contactEmail: true,
        contactPhone: true,
        contactLocation: true,
      },
    });

    return NextResponse.json(settings ?? { siteName: "VirtuMall" });
  } catch {
    return NextResponse.json({ siteName: "VirtuMall" });
  }
}

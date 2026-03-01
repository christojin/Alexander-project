import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendKycResultEmail } from "@/lib/email";

// GET /api/admin/kyc/[id] — Get KYC detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      country: { select: { name: true, flagEmoji: true } },
      kycDocuments: { orderBy: { createdAt: "desc" } },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ seller });
}

// PATCH /api/admin/kyc/[id] — Approve or reject KYC
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, reviewNote } = body;

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: { user: true, kycDocuments: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }

  const isApprove = action === "approve";

  await prisma.$transaction(async (tx) => {
    // Update seller status
    await tx.sellerProfile.update({
      where: { id },
      data: {
        status: isApprove ? "APPROVED" : "REJECTED",
        isVerified: isApprove,
      },
    });

    // Update all KYC documents
    await tx.kYCDocument.updateMany({
      where: { sellerId: id },
      data: {
        status: isApprove ? "approved" : "rejected",
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    // Create notification for seller
    await tx.notification.create({
      data: {
        userId: seller.userId,
        type: isApprove ? "KYC_APPROVED" : "KYC_REJECTED",
        title: isApprove ? "Verificación aprobada" : "Verificación rechazada",
        message: isApprove
          ? "Tu cuenta ha sido verificada. Ya puedes publicar productos."
          : `Tu verificación fue rechazada. ${reviewNote || "Revisa tus documentos e intenta de nuevo."}`,
        link: "/seller/kyc",
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: session.user!.id,
        action: isApprove ? "kyc_approved" : "kyc_rejected",
        entityType: "seller_profile",
        entityId: id,
        details: { reviewNote, sellerEmail: seller.user.email },
      },
    });
  });

  // Fire-and-forget KYC result email
  if (seller.user.email) {
    sendKycResultEmail(seller.user.email, isApprove, reviewNote).catch(() => {});
  }

  return NextResponse.json({
    message: isApprove
      ? "Vendedor aprobado exitosamente"
      : "Vendedor rechazado",
  });
}

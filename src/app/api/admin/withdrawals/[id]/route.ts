import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/withdrawals/[id]
 * Approve, reject, or complete a withdrawal request.
 * Body: { action: "approve" | "reject" | "complete", reviewNote?: string }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { action, reviewNote } = body as {
    action?: string;
    reviewNote?: string;
  };

  if (!action || !["approve", "reject", "complete"].includes(action)) {
    return NextResponse.json(
      { error: "Accion no valida" },
      { status: 400 }
    );
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, userId: true, storeName: true } },
    },
  });

  if (!withdrawal) {
    return NextResponse.json(
      { error: "Retiro no encontrado" },
      { status: 404 }
    );
  }

  // Validate state transitions
  if (action === "approve" && withdrawal.status !== "PENDING") {
    return NextResponse.json(
      { error: "Solo se pueden aprobar retiros pendientes" },
      { status: 400 }
    );
  }
  if (action === "reject" && withdrawal.status !== "PENDING") {
    return NextResponse.json(
      { error: "Solo se pueden rechazar retiros pendientes" },
      { status: 400 }
    );
  }
  if (action === "complete" && withdrawal.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Solo se pueden completar retiros aprobados" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: auth.session.user.id,
          reviewNote: reviewNote || null,
        },
      });

      await tx.notification.create({
        data: {
          userId: withdrawal.seller.userId,
          type: "WITHDRAWAL_APPROVED",
          title: "Retiro aprobado",
          message: `Tu solicitud de retiro por $${withdrawal.amount.toFixed(2)} ha sido aprobada. Sera procesada pronto.`,
          link: "/seller/earnings",
        },
      });
    } else if (action === "reject") {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedBy: auth.session.user.id,
          reviewNote: reviewNote || null,
        },
      });

      // Refund the amount back to seller's available balance
      await tx.sellerProfile.update({
        where: { id: withdrawal.seller.id },
        data: { availableBalance: { increment: withdrawal.amount } },
      });

      await tx.notification.create({
        data: {
          userId: withdrawal.seller.userId,
          type: "WITHDRAWAL_REJECTED",
          title: "Retiro rechazado",
          message: reviewNote
            ? `Tu solicitud de retiro fue rechazada: ${reviewNote}`
            : "Tu solicitud de retiro fue rechazada. Contacta al soporte para mas informacion.",
          link: "/seller/earnings",
        },
      });
    } else if (action === "complete") {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: auth.session.user.id,
        action: `withdrawal_${action}ed`,
        entityType: "withdrawal",
        entityId: id,
        details: {
          amount: withdrawal.amount,
          method: withdrawal.method,
          reviewNote: reviewNote || null,
          sellerStore: withdrawal.seller.storeName,
        },
      },
    });
  });

  return NextResponse.json({
    message:
      action === "approve"
        ? "Retiro aprobado exitosamente"
        : action === "reject"
          ? "Retiro rechazado"
          : "Retiro marcado como completado",
  });
}

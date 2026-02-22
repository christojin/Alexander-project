import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processDelayedDeliveries } from "@/lib/fraud";

/**
 * POST /api/admin/process-delayed
 * Process all delayed orders that are ready for delivery.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const result = await processDelayedDeliveries();

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.processed} ordenes procesadas, ${result.failed} fallidas`,
    });
  } catch (error) {
    console.error("[Process Delayed POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

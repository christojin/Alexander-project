import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { processDelayedDeliveries } from "@/lib/fraud";

/**
 * POST /api/admin/process-delayed
 * Process all delayed orders that are ready for delivery.
 */
export async function POST() {
  try {

    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;

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

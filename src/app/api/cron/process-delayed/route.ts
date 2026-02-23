import { NextRequest, NextResponse } from "next/server";
import { processDelayedDeliveries } from "@/lib/fraud";

/**
 * GET /api/cron/process-delayed
 *
 * Automated cron endpoint to process delayed-delivery orders.
 * Secured by CRON_SECRET — no user session required.
 *
 * Vercel Cron calls this every 5 minutes via vercel.json.
 * For non-Vercel deployments, use an external cron service
 * (e.g., cron-job.org, upstash, or system crontab) to GET this URL
 * with the Authorization header: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        );
      }
    } else {
      // In development without CRON_SECRET, allow localhost only
      const host = req.headers.get("host") ?? "";
      if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
        return NextResponse.json(
          { error: "CRON_SECRET no configurado" },
          { status: 403 }
        );
      }
    }

    const result = await processDelayedDeliveries();

    console.log(
      `[Cron] Delayed deliveries: ${result.processed} processed, ${result.failed} failed`
    );

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron Process Delayed] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

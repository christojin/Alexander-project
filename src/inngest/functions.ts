import { inngest } from "./client";
import { processDelayedDeliveries } from "@/lib/fraud";

export { verifyPendingBinancePaymentsCron } from "./binance-verify";

/**
 * Cron: Process delayed deliveries every 5 minutes.
 *
 * Finds all orders in PROCESSING status whose deliveryScheduledAt
 * has passed, and fulfills them automatically.
 */
export const processDelayedDeliveriesCron = inngest.createFunction(
  { id: "process-delayed-deliveries" },
  { cron: "*/5 * * * *" },
  async () => {
    const result = await processDelayedDeliveries();

    console.log(
      `[Inngest Cron] Delayed deliveries: ${result.processed} processed, ${result.failed} failed`
    );

    return result;
  }
);

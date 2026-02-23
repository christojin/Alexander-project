import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processDelayedDeliveriesCron } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDelayedDeliveriesCron],
});

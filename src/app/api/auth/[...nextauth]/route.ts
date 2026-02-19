import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-api";

const { GET: originalGET, POST: originalPOST } = handlers;

export const GET = originalGET;

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { windowMs: 15 * 60 * 1000, maxRequests: 20 }, "auth");
  if (limited) return limited;

  return originalPOST(req);
}

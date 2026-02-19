import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-api";

const { GET: originalGET, POST: originalPOST } = handlers;

export const GET = originalGET;

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, { windowMs: 15 * 60 * 1000, maxRequests: 20 }, "auth");
    if (limited) return limited;

    return await originalPOST(req);
  } catch (error) {
    console.error("[Auth POST] Error:", error);
    return NextResponse.json(
      { error: "Error de autenticacion" },
      { status: 500 }
    );
  }
}

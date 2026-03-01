import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthSuccess = {
  error: false;
  session: { user: { id: string; role: string; email?: string | null } };
};
type AuthFailure = { error: true; response: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

type SellerSuccess = AuthSuccess & {
  seller: { id: string; userId: string; availableBalance: number; commissionRate: number };
};
type SellerResult = SellerSuccess | AuthFailure;

/**
 * Require an authenticated session. Returns error response if not authenticated.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: true,
      response: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
    };
  }
  return { error: false, session: session as AuthSuccess["session"] };
}

/**
 * Require an ADMIN session. Returns error response if not admin.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;
  if (result.session.user.role !== "ADMIN") {
    return {
      error: true,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require a SELLER session with an active seller profile.
 * Returns the seller profile alongside the session.
 */
export async function requireSeller(): Promise<SellerResult> {
  const result = await requireAuth();
  if (result.error) return result;

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: result.session.user.id },
    select: {
      id: true,
      userId: true,
      availableBalance: true,
      commissionRate: true,
    },
  });

  if (!seller) {
    return {
      error: true,
      response: NextResponse.json(
        { error: "No es vendedor" },
        { status: 403 }
      ),
    };
  }

  return { ...result, seller };
}

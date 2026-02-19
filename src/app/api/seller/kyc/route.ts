import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { checkRateLimit } from "@/lib/rate-limit-api";

// GET /api/seller/kyc — Get current seller's KYC status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      kycDocuments: { orderBy: { createdAt: "desc" } },
      country: true,
      businessHours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ seller });
}

// POST /api/seller/kyc — Submit KYC application
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { windowMs: 60 * 60 * 1000, maxRequests: 3 }, "kyc");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { personalInfo, businessInfo, documents } = body;

    // Validate required fields
    if (!personalInfo?.fullName || !personalInfo?.phone || !personalInfo?.country || !personalInfo?.city) {
      return NextResponse.json({ error: "Información personal incompleta" }, { status: 400 });
    }

    if (!businessInfo?.storeName || !businessInfo?.storeDescription || !businessInfo?.marketType) {
      return NextResponse.json({ error: "Información del negocio incompleta" }, { status: 400 });
    }

    if (!documents?.identityUrl || !documents?.selfieUrl) {
      return NextResponse.json({ error: "Documentos requeridos: identidad y selfie" }, { status: 400 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 404 });
    }

    if (seller.status === "APPROVED") {
      return NextResponse.json({ error: "Tu cuenta ya está verificada" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(businessInfo.storeName);
    const existingSlug = await prisma.sellerProfile.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.id !== seller.id) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Find country region
    const country = await prisma.region.findFirst({
      where: { name: personalInfo.country },
    });

    // Update seller profile + create KYC documents in transaction
    await prisma.$transaction(async (tx) => {
      // Update seller profile
      await tx.sellerProfile.update({
        where: { id: seller.id },
        data: {
          storeName: businessInfo.storeName.trim(),
          slug,
          storeDescription: businessInfo.storeDescription.trim(),
          marketType: businessInfo.marketType,
          countryId: country?.id || null,
          status: "PENDING",
        },
      });

      // Delete old KYC documents if resubmitting
      await tx.kYCDocument.deleteMany({ where: { sellerId: seller.id } });

      // Create KYC documents
      const docs = [
        { sellerId: seller.id, documentType: "identity", documentUrl: documents.identityUrl },
        { sellerId: seller.id, documentType: "selfie", documentUrl: documents.selfieUrl },
      ];

      if (documents.businessUrl) {
        docs.push({ sellerId: seller.id, documentType: "business_license", documentUrl: documents.businessUrl });
      }

      await tx.kYCDocument.createMany({ data: docs });

      // Update user name if provided
      if (personalInfo.fullName) {
        await tx.user.update({
          where: { id: session.user!.id },
          data: { name: personalInfo.fullName.trim() },
        });
      }
    });

    return NextResponse.json(
      { message: "Solicitud KYC enviada exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[KYC] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

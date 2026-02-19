import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveFile, isValidFolder } from "@/lib/upload";
import { checkRateLimit } from "@/lib/rate-limit-api";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { windowMs: 5 * 60 * 1000, maxRequests: 20 }, "upload");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    if (!folder || !isValidFolder(folder)) {
      return NextResponse.json(
        { error: "Carpeta no válida. Usa: kyc, avatars, stores" },
        { status: 400 }
      );
    }

    const result = await saveFile(file, folder);

    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir archivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

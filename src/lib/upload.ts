import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ALLOWED_FOLDERS = ["kyc", "avatars", "stores"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadResult {
  url: string;
  filename: string;
}

export function isValidFolder(folder: string): folder is UploadFolder {
  return ALLOWED_FOLDERS.includes(folder as UploadFolder);
}

export async function saveFile(
  file: File,
  folder: UploadFolder
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido. Usa JPG, PNG, WebP o PDF.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("El archivo excede el tamaño máximo de 5MB.");
  }

  const ext = path.extname(file.name) || getExtFromType(file.type);
  const filename = `${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    filename,
  };
}

function getExtFromType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  return map[mimeType] || ".bin";
}

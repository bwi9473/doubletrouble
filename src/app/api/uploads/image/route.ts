import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { ensureRole } from "@/lib/roles";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const uploadsDir = join(process.cwd(), "public", "uploads", "players");

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen geldig bestand gevonden." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Bestand is te groot (max 5MB)." }, { status: 400 });
  }

  const extension = extensionFromMimeType(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Alleen JPG, PNG, WEBP of GIF zijn toegestaan." }, { status: 400 });
  }

  const fileName = `${randomUUID()}.${extension}`;
  const destination = join(uploadsDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(destination, buffer);

  return NextResponse.json({ url: `/uploads/players/${fileName}` }, { status: 201 });
}

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const uploadsDir = path.join(process.cwd(), "public", "uploads", "players");

function parseDataUrl(value) {
  const match = value.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const rawExtension = match[2] === "jpeg" ? "jpg" : match[2];
  const base64 = match[3];
  return { mimeType, extension: rawExtension, base64 };
}

async function run() {
  await mkdir(uploadsDir, { recursive: true });

  const persons = await prisma.person.findMany({
    select: { id: true, photoUrl: true },
    where: {
      photoUrl: {
        startsWith: "data:image/",
      },
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const person of persons) {
    if (!person.photoUrl) {
      continue;
    }

    const parsed = parseDataUrl(person.photoUrl);
    if (!parsed) {
      skipped += 1;
      continue;
    }

    const fileName = `${randomUUID()}.${parsed.extension}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(parsed.base64, "base64");

    await writeFile(filePath, buffer);

    await prisma.person.update({
      where: { id: person.id },
      data: { photoUrl: `/uploads/players/${fileName}` },
    });

    migrated += 1;
  }

  console.log(JSON.stringify({ found: persons.length, migrated, skipped }, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

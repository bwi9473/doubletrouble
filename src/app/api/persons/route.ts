import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { personSchema } from "@/lib/validation";

const revalidateTargets = ["/", "/spelers", "/poules", "/klassement"];

async function generateUniqueUsername(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
  let username = base;
  let counter = 2;
  while (await prisma.appUser.findUnique({ where: { username } })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

export async function GET() {
  const persons = await prisma.person.findMany({
    orderBy: [{ rankingValue: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(persons);
}

export async function POST(request: Request) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const body = await request.json();
  const parsed = personSchema.safeParse({
    ...body,
    rankingValue:
      body.rankingValue === undefined || body.rankingValue === null || body.rankingValue === ""
        ? undefined
        : Number(body.rankingValue),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige speler." }, { status: 400 });
  }

  const person = await prisma.person.create({
    data: parsed.data,
  });

  // Auto-create a player account
  const username = await generateUniqueUsername(person.name);
  const password = typeof body.password === "string" && body.password.length >= 6
    ? body.password
    : username;
  await prisma.appUser.create({
    data: {
      name: person.name,
      username,
      password,
      role: "VIEWER",
      personId: person.id,
    },
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(person, { status: 201 });
}

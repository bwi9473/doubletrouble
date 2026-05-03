import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { appUserSchema } from "@/lib/validation";

const revalidateTargets = ["/gebruikers"];

export async function GET(request: Request) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const users = await prisma.appUser.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    where: { personId: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const body = await request.json();
  const parsed = appUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ongeldige gebruiker." },
      { status: 400 },
    );
  }

  const user = await prisma.appUser.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username.toLowerCase(),
      password: parsed.data.password,
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(user, { status: 201 });
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { updateUserSchema } from "@/lib/validation";

const revalidateTargets = ["/gebruikers"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ongeldige gebruiker." },
      { status: 400 },
    );
  }

  const user = await prisma.appUser.update({
    where: { id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username.toLowerCase(),
      role: parsed.data.role,
      ...(parsed.data.password ? { password: parsed.data.password } : {}),
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const { id } = await params;
  await prisma.appUser.delete({ where: { id } });
  revalidateTargets.forEach((target) => revalidatePath(target));
  return new NextResponse(null, { status: 204 });
}

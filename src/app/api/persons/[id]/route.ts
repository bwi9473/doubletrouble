import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { personSchema } from "@/lib/validation";

const revalidateTargets = ["/", "/spelers", "/poules", "/klassement", "/wedstrijden"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const { id } = await params;
  const body: Record<string, unknown> = await request.json();
  const visiblePoolIds = Array.isArray(body.visiblePoolIds)
    ? body.visiblePoolIds.filter((value: unknown): value is string => typeof value === "string")
    : [];
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

  const person = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    const updatedPerson = await transaction.person.update({
      where: { id },
      data: parsed.data,
    });

    await transaction.poolViewAccess.deleteMany({
      where: { personId: id },
    });

    if (visiblePoolIds.length) {
      await transaction.poolViewAccess.createMany({
        data: visiblePoolIds.map((poolId) => ({
          poolId,
          personId: id,
        })),
      });
    }

    await transaction.appUser.updateMany({
      where: { personId: id },
      data: { name: updatedPerson.name },
    });

    return updatedPerson;
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(person);
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
  const scheduledMatchCount = await prisma.match.count({
    where: {
      OR: [
        { team1Player1Id: id },
        { team1Player2Id: id },
        { team2Player1Id: id },
        { team2Player2Id: id },
      ],
    },
  });

  if (scheduledMatchCount > 0) {
    return NextResponse.json(
      {
        error: "Deze speler zit nog in geplande wedstrijden. Reset eerst de poule.",
      },
      { status: 409 },
    );
  }

  await prisma.appUser.deleteMany({ where: { personId: id } });
  await prisma.person.delete({ where: { id } });
  revalidateTargets.forEach((target) => revalidatePath(target));

  return new NextResponse(null, { status: 204 });
}

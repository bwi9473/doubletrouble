import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { calculateRankings } from "@/lib/rankings";
import { poolSchema } from "@/lib/validation";

const revalidateTargets = ["/", "/poules", "/wedstrijden", "/klassement"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      members: {
        include: { person: true },
      },
      matches: {
        include: {
          score: true,
          team1Player1: true,
          team1Player2: true,
          team2Player1: true,
          team2Player2: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Poule niet gevonden." }, { status: 404 });
  }

  const rankings = calculateRankings(
    pool.members.map((member: (typeof pool.members)[number]) => member.person),
    pool.matches.map((match: (typeof pool.matches)[number]) => ({
      team1: [match.team1Player1, match.team1Player2] as const,
      team2: [match.team2Player1, match.team2Player2] as const,
      score: match.score
        ? {
            team1Games: match.score.team1Games,
            team2Games: match.score.team2Games,
          }
        : null,
    })),
  );

  return NextResponse.json({ ...pool, rankings });
}

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
  const parsed = poolSchema.safeParse({
    ...body,
    size: Number(body.size),
    duoTarget: body.duoTarget === undefined ? undefined : Number(body.duoTarget),
    personIds: Array.isArray(body.personIds) ? body.personIds : [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige poule." }, { status: 400 });
  }

  if (parsed.data.personIds.length > parsed.data.size) {
    return NextResponse.json({ error: "Er zitten meer spelers in de poule dan toegestaan." }, { status: 400 });
  }

  const pool = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.match.deleteMany({ where: { poolId: id } });
    await transaction.poolPerson.deleteMany({ where: { poolId: id } });

    return transaction.pool.update({
      where: { id },
      data: {
        name: parsed.data.name,
        size: parsed.data.size,
        competitionFormat: parsed.data.competitionFormat,
        duoTarget: parsed.data.duoTarget,
        status: "ACTIVE",
        archivedAt: null,
        members: parsed.data.personIds.length
          ? {
              createMany: {
                data: parsed.data.personIds.map((personId) => ({ personId })),
              },
            }
          : undefined,
      },
      include: {
        members: {
          include: { person: true },
        },
      },
    });
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(pool);
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
  const existingPool = await prisma.pool.findUnique({ where: { id }, select: { id: true } });

  if (!existingPool) {
    return NextResponse.json({ error: "Poule niet gevonden." }, { status: 404 });
  }

  await prisma.pool.delete({ where: { id } });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return new NextResponse(null, { status: 204 });
}

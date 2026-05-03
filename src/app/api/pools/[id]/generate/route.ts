import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { generateUniqueMatches } from "@/lib/schedule";

const revalidateTargets = ["/", "/poules", "/wedstrijden", "/klassement"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const { id } = await params;
  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          person: true,
        },
        orderBy: {
          person: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Poule niet gevonden." }, { status: 404 });
  }

  if (pool.status === "ARCHIVED") {
    return NextResponse.json({ error: "Een gearchiveerde poule kan niet opnieuw worden gegenereerd." }, { status: 400 });
  }

  if (pool.members.length < 4) {
    return NextResponse.json({ error: "Minstens 4 spelers nodig om dubbelwedstrijden te maken." }, { status: 400 });
  }

  const generatedMatches = generateUniqueMatches(
    pool.members.map((member: (typeof pool.members)[number]) => member.person),
    pool.competitionFormat,
    pool.duoTarget,
  );

  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.match.deleteMany({ where: { poolId: id } });
    await transaction.pool.update({
      where: { id },
      data: { status: "ACTIVE", archivedAt: null },
    });
    await transaction.match.createMany({
      data: generatedMatches.map((match, index) => ({
        poolId: id,
        order: index + 1,
        team1Player1Id: match.team1.player1.id,
        team1Player2Id: match.team1.player2.id,
        team2Player1Id: match.team2.player1.id,
        team2Player2Id: match.team2.player2.id,
      })),
    });
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json({ created: generatedMatches.length });
}

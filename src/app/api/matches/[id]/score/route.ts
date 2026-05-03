import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { scoreSchema } from "@/lib/validation";

const revalidateTargets = ["/", "/wedstrijden", "/klassement", "/poules"];

function mapRole(role: "viewer" | "admin" | "match-manager") {
  switch (role) {
    case "admin":
      return "ADMIN" as const;
    case "match-manager":
      return "MATCH_MANAGER" as const;
    default:
      return "VIEWER" as const;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Allow all logged-in roles, but viewers must be a player in the match
  const permission = ensureRole(request, ["admin", "match-manager", "viewer"]);
  if (!permission.ok) {
    return permission.response;
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = scoreSchema.safeParse({
    team1Games: Number(body.team1Games),
    team2Games: Number(body.team2Games),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige score." }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      poolId: true,
      team1Player1Id: true,
      team1Player2Id: true,
      team2Player1Id: true,
      team2Player2Id: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden." }, { status: 404 });
  }

  // Viewers can only submit scores for matches they play in
  if (permission.role === "viewer") {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 403 });
    }
    const appUser = await prisma.appUser.findUnique({
      where: { id: userId },
      select: { personId: true },
    });
    const playerIds = [match.team1Player1Id, match.team1Player2Id, match.team2Player1Id, match.team2Player2Id];
    if (!appUser?.personId || !playerIds.includes(appUser.personId)) {
      return NextResponse.json({ error: "Je speelt niet mee in deze wedstrijd." }, { status: 403 });
    }

    const hasPoolAccess = await prisma.poolViewAccess.findUnique({
      where: {
        poolId_personId: {
          poolId: match.poolId,
          personId: appUser.personId,
        },
      },
      select: { id: true },
    });

    if (!hasPoolAccess) {
      return NextResponse.json({ error: "Je hebt geen toegang tot deze poule." }, { status: 403 });
    }
  }

  const score = await prisma.matchScore.upsert({
    where: { matchId: id },
    create: {
      matchId: id,
      team1Games: parsed.data.team1Games,
      team2Games: parsed.data.team2Games,
      submittedByRole: mapRole(permission.role),
    },
    update: {
      team1Games: parsed.data.team1Games,
      team2Games: parsed.data.team2Games,
      submittedByRole: mapRole(permission.role),
    },
  });

  const [totalMatches, scoredMatches] = await Promise.all([
    prisma.match.count({ where: { poolId: match.poolId } }),
    prisma.matchScore.count({ where: { match: { poolId: match.poolId } } }),
  ]);

  await prisma.pool.update({
    where: { id: match.poolId },
    data: {
      status: totalMatches > 0 && totalMatches === scoredMatches ? "COMPLETED" : "ACTIVE",
    },
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(score);
}

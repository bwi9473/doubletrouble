import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";
import { poolSchema } from "@/lib/validation";

const revalidateTargets = ["/", "/poules", "/wedstrijden", "/klassement"];

export async function GET() {
  const pools = await prisma.pool.findMany({
    include: {
      members: {
        include: {
          person: true,
        },
      },
      matches: {
        include: {
          score: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(pools);
}

export async function POST(request: Request) {
  const permission = ensureRole(request, ["admin"]);
  if (!permission.ok) {
    return permission.response;
  }

  const body = await request.json();
  const parsed = poolSchema.safeParse({
    ...body,
    size: Number(body.size),
    duoTarget: body.duoTarget === undefined ? undefined : Number(body.duoTarget),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige poule." }, { status: 400 });
  }

  if (parsed.data.personIds.length > parsed.data.size) {
    return NextResponse.json({ error: "Er zitten meer spelers in de poule dan toegestaan." }, { status: 400 });
  }

  const pool = await prisma.pool.create({
    data: {
      name: parsed.data.name,
      size: parsed.data.size,
      competitionFormat: parsed.data.competitionFormat,
      duoTarget: parsed.data.duoTarget,
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

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(pool, { status: 201 });
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/roles";

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

  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.match.deleteMany({ where: { poolId: id } });
    await transaction.pool.update({
      where: { id },
      data: { status: "ACTIVE", archivedAt: null },
    });
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json({ reset: true });
}

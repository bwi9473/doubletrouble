import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
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

  const pool = await prisma.pool.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  revalidateTargets.forEach((target) => revalidatePath(target));

  return NextResponse.json(pool);
}

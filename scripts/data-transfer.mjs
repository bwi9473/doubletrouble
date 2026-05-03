import { PrismaClient } from "@prisma/client";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const prisma = new PrismaClient();

function resolvePathFromArg(arg, fallback) {
  return resolve(process.cwd(), arg || fallback);
}

async function exportData(targetPathArg) {
  const targetPath = resolvePathFromArg(
    targetPathArg,
    `prisma-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );

  const [persons, pools, memberships, matches, scores] = await Promise.all([
    prisma.person.findMany(),
    prisma.pool.findMany(),
    prisma.poolPerson.findMany(),
    prisma.match.findMany(),
    prisma.matchScore.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    counts: {
      persons: persons.length,
      pools: pools.length,
      memberships: memberships.length,
      matches: matches.length,
      scores: scores.length,
    },
    persons,
    pools,
    memberships,
    matches,
    scores,
  };

  await writeFile(targetPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Export complete: ${targetPath}`);
}

async function importData(sourcePathArg) {
  const sourcePath = resolvePathFromArg(sourcePathArg, "prisma-export.json");
  const raw = await readFile(sourcePath, "utf8");
  const payload = JSON.parse(raw);

  await prisma.$transaction(async (tx) => {
    await tx.matchScore.deleteMany();
    await tx.match.deleteMany();
    await tx.poolPerson.deleteMany();
    await tx.pool.deleteMany();
    await tx.person.deleteMany();

    if (Array.isArray(payload.persons) && payload.persons.length) {
      await tx.person.createMany({ data: payload.persons });
    }

    if (Array.isArray(payload.pools) && payload.pools.length) {
      await tx.pool.createMany({ data: payload.pools });
    }

    if (Array.isArray(payload.memberships) && payload.memberships.length) {
      await tx.poolPerson.createMany({ data: payload.memberships });
    }

    if (Array.isArray(payload.matches) && payload.matches.length) {
      await tx.match.createMany({ data: payload.matches });
    }

    if (Array.isArray(payload.scores) && payload.scores.length) {
      await tx.matchScore.createMany({ data: payload.scores });
    }
  });

  console.log(`Import complete from: ${sourcePath}`);
}

async function main() {
  const action = process.argv[2];
  const pathArg = process.argv[3];

  if (action === "export") {
    await exportData(pathArg);
    return;
  }

  if (action === "import") {
    await importData(pathArg);
    return;
  }

  console.error("Usage: node scripts/data-transfer.mjs <export|import> [path]");
  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

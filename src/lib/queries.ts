import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { calculateRankings } from "@/lib/rankings";

const personBasicSelect = {
  id: true,
  name: true,
} as const;

const personBasicWithPhotoSelect = {
  ...personBasicSelect,
  photoUrl: true,
} as const;

const personRankingSelect = {
  id: true,
  name: true,
  rankingLabel: true,
  rankingValue: true,
  photoUrl: true,
} as const;

export async function getPersons() {
  noStore();
  return prisma.person.findMany({
    orderBy: [{ rankingValue: "asc" }, { name: "asc" }],
  });
}

export async function getPersonsForGrid() {
  noStore();
  return prisma.person.findMany({
    select: {
      ...personRankingSelect,
      photoUrl: true,
      viewAccesses: {
        select: {
          poolId: true,
        },
      },
    },
    orderBy: [{ rankingValue: "asc" }, { name: "asc" }],
  });
}

export async function getPoolOptions() {
  noStore();
  return prisma.pool.findMany({
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getVisiblePoolIdsForPerson(personId: string) {
  noStore();
  const accesses = await prisma.poolViewAccess.findMany({
    where: { personId },
    select: { poolId: true },
  });

  return accesses.map((access) => access.poolId);
}

export async function getPersonsBasic() {
  noStore();
  return prisma.person.findMany({
    select: personBasicSelect,
    orderBy: [{ name: "asc" }],
  });
}

export async function getAppUsers() {
  noStore();
  return prisma.appUser.findMany({
    where: { personId: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getPoolsWithDetails() {
  noStore();
  return prisma.pool.findMany({
    select: {
      id: true,
      name: true,
      size: true,
      status: true,
      competitionFormat: true,
      duoTarget: true,
      createdAt: true,
      members: {
        select: {
          person: {
            select: personBasicSelect,
          },
        },
        orderBy: {
          person: {
            name: "asc",
          },
        },
      },
      matches: {
        select: {
          id: true,
          order: true,
          score: {
            select: {
              team1Games: true,
              team2Games: true,
            },
          },
          team1Player1: {
            select: personBasicSelect,
          },
          team1Player2: {
            select: personBasicSelect,
          },
          team2Player1: {
            select: personBasicSelect,
          },
          team2Player2: {
            select: personBasicSelect,
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPoolsWithMatchPhotos() {
  noStore();
  return prisma.pool.findMany({
    select: {
      id: true,
      name: true,
      size: true,
      status: true,
      competitionFormat: true,
      duoTarget: true,
      createdAt: true,
      members: {
        select: {
          person: {
            select: personBasicSelect,
          },
        },
        orderBy: {
          person: {
            name: "asc",
          },
        },
      },
      matches: {
        select: {
          id: true,
          order: true,
          score: {
            select: {
              team1Games: true,
              team2Games: true,
            },
          },
          team1Player1: {
            select: personBasicWithPhotoSelect,
          },
          team1Player2: {
            select: personBasicWithPhotoSelect,
          },
          team2Player1: {
            select: personBasicWithPhotoSelect,
          },
          team2Player2: {
            select: personBasicWithPhotoSelect,
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPoolDetails(poolId: string) {
  noStore();
  return prisma.pool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      name: true,
      size: true,
      status: true,
      competitionFormat: true,
      duoTarget: true,
      members: {
        select: {
          person: {
            select: personRankingSelect,
          },
        },
        orderBy: {
          person: {
            name: "asc",
          },
        },
      },
      matches: {
        select: {
          id: true,
          order: true,
          score: {
            select: {
              team1Games: true,
              team2Games: true,
            },
          },
          team1Player1: {
            select: personBasicSelect,
          },
          team1Player2: {
            select: personBasicSelect,
          },
          team2Player1: {
            select: personBasicSelect,
          },
          team2Player2: {
            select: personBasicSelect,
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });
}

export async function getRankingsForPool(poolId: string) {
  const pool = await getPoolDetails(poolId);

  if (!pool) {
    return [];
  }

  return calculateRankings(
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
}

export async function getAllRankings() {
  const [pools, persons] = await Promise.all([
    getPoolsWithDetails(),
    prisma.person.findMany({
      select: {
        id: true,
        photoUrl: true,
      },
    }),
  ]);

  const photoByPersonId = new Map(
    persons.map((person: (typeof persons)[number]) => [person.id, person.photoUrl]),
  );

  return pools.map((pool: (typeof pools)[number]) => ({
      pool,
      rankings: calculateRankings(
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
      ).map((entry) => ({
        ...entry,
        photoUrl: photoByPersonId.get(entry.id) ?? null,
      })),
    }));
}

export async function getDashboardData() {
  const [persons, pools] = await Promise.all([getPersonsBasic(), getPoolsWithDetails()]);

  const activePools = pools.filter((pool: (typeof pools)[number]) => pool.status !== "ARCHIVED");
  const archivedPools = pools.filter((pool: (typeof pools)[number]) => pool.status === "ARCHIVED");
  const totalMatches = pools.reduce(
    (sum: number, pool: (typeof pools)[number]) => sum + pool.matches.length,
    0,
  );
  const scoredMatches = pools.reduce(
    (sum: number, pool: (typeof pools)[number]) =>
      sum + pool.matches.filter((match: (typeof pool.matches)[number]) => Boolean(match.score)).length,
    0,
  );

  return {
    persons,
    pools,
    stats: {
      personCount: persons.length,
      activePoolCount: activePools.length,
      archivedPoolCount: archivedPools.length,
      totalMatches,
      scoredMatches,
    },
  };
}

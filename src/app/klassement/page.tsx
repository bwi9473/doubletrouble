import { RankingsBoard } from "@/components/rankings-board";
import { SectionCard } from "@/components/section-card";
import { getAllRankings, getVisiblePoolIdsForPerson } from "@/lib/queries";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("demo-role")?.value;
  const personId = cookieStore.get("demo-person-id")?.value;
  const isAdmin = role === "admin";

  const rankings = await getAllRankings();
  const visiblePoolIds = !isAdmin && personId
    ? await getVisiblePoolIdsForPerson(personId)
    : [];
  const visiblePoolIdSet = new Set(visiblePoolIds);
  const visibleRankings = isAdmin
    ? rankings
    : rankings.filter(({ pool }) => visiblePoolIdSet.has(pool.id));

  return (
    <SectionCard
      title="Klassement per poule"
      description="Punten: winst = 2, gelijkspel = 1, verlies = 0. Daarna tellen saldo en gewonnen spelletjes."
    >
      <RankingsBoard
        pools={visibleRankings.map(({ pool, rankings: standings }) => ({
          pool: { id: pool.id, name: pool.name, status: pool.status },
          rankings: standings,
        }))}
      />
    </SectionCard>
  );
}

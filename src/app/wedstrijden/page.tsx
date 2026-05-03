import { MatchesBoard } from "@/components/matches-board";
import { SectionCard } from "@/components/section-card";
import { getPoolsWithMatchPhotos, getVisiblePoolIdsForPerson } from "@/lib/queries";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("demo-role")?.value;
  const personId = cookieStore.get("demo-person-id")?.value;
  const isAdmin = role === "admin";

  const pools = await getPoolsWithMatchPhotos();
  const visiblePoolIds = !isAdmin && personId
    ? await getVisiblePoolIdsForPerson(personId)
    : [];
  const visiblePoolIdSet = new Set(visiblePoolIds);
  const visiblePools = isAdmin ? pools : pools.filter((pool) => visiblePoolIdSet.has(pool.id));

  return (
    <SectionCard
      title="Wedstrijden en scores"
      description="Spelers kunnen hier hun eigen wedstrijdresultaten invullen. Admins en wedstrijdgebruikers kunnen alle scores beheren."
    >
      <MatchesBoard pools={visiblePools.filter((pool) => pool.matches.length)} />
    </SectionCard>
  );
}

import { PoolForm } from "@/components/pool-form";
import { PoolsBoard } from "@/components/pools-board";
import { SectionCard } from "@/components/section-card";
import { getPersonsBasic, getPoolsWithDetails } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PoolsPage() {
  const [persons, pools] = await Promise.all([getPersonsBasic(), getPoolsWithDetails()]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Nieuwe poule"
        description="Maak een poule en stel het maximum aantal spelers in."
      >
        <PoolForm />
      </SectionCard>
      <SectionCard
        title="Poulebeheer"
        description="Koppel spelers, genereer wedstrijden, reset en archiveer resultaten."
      >
        <PoolsBoard pools={pools} persons={persons} />
      </SectionCard>
    </div>
  );
}

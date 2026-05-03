import { PersonForm } from "@/components/person-form";
import { PlayersGrid } from "@/components/players-grid";
import { SectionCard } from "@/components/section-card";
import { getPersonsForGrid, getPoolOptions } from "@/lib/queries";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const role = (await cookies()).get("demo-role")?.value;
  if (role !== "admin") {
    redirect("/");
  }

  const [persons, pools] = await Promise.all([getPersonsForGrid(), getPoolOptions()]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <SectionCard
        title="Speler toevoegen"
        description="Voeg naam, klassement en een foto toe via URL of upload."
      >
        <PersonForm />
      </SectionCard>
      <SectionCard
        title="Spelerslijst"
        description="Beheer alle spelers die in poules kunnen worden opgenomen."
      >
        <PlayersGrid persons={persons} pools={pools} />
      </SectionCard>
    </div>
  );
}

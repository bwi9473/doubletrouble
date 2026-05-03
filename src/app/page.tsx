import { DashboardStats } from "@/components/dashboard-stats";
import { EmptyState } from "@/components/empty-state";
import { RankingsBoard } from "@/components/rankings-board";
import { SectionCard } from "@/components/section-card";
import { getAllRankings, getDashboardData, getPoolsWithDetails, getVisiblePoolIdsForPerson } from "@/lib/queries";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type DashboardMatch = {
  id: string;
  poolName: string;
  label: string;
  scoreLabel?: string;
};

export default async function Home() {
  const cookieStore = await cookies();
  const role = cookieStore.get("demo-role")?.value;
  const personId = cookieStore.get("demo-person-id")?.value;
  const isAdmin = role === "admin";

  const [{ stats }, pools] = await Promise.all([
    getDashboardData(),
    getPoolsWithDetails(),
  ]);
  const rankingsByPool = isAdmin ? await getAllRankings() : [];

  const visiblePoolIds = !isAdmin && personId
    ? await getVisiblePoolIdsForPerson(personId)
    : [];
  const visiblePoolIdSet = new Set(visiblePoolIds);

  const activePools = pools.filter((pool) => pool.status !== "ARCHIVED");
  const visibleActivePools = !isAdmin
    ? activePools.filter((pool) => visiblePoolIdSet.has(pool.id))
    : activePools;
  const archivedPools = pools.filter((pool) => pool.status === "ARCHIVED");
  const poolProgress = visibleActivePools.map((pool) => {
    const playedMatches = pool.matches.filter((match) => Boolean(match.score)).length;
    const matchesPerPlayer = pool.members.length > 0
      ? Math.round((pool.matches.length * 4) / pool.members.length)
      : 0;

    return {
      pool,
      playedMatches,
      totalMatches: pool.matches.length,
      matchesPerPlayer,
    };
  });

  const upcomingMatches: DashboardMatch[] = visibleActivePools.flatMap((pool) =>
    pool.matches
      .filter((match) => !match.score)
      .slice(0, 5)
      .map((match) => ({
        id: match.id,
        poolName: pool.name,
        label: `${match.team1Player1.name} & ${match.team1Player2.name} vs ${match.team2Player1.name} & ${match.team2Player2.name}`,
      })),
  );
  const playedMatches: DashboardMatch[] = visibleActivePools.flatMap((pool) =>
    pool.matches
      .filter((match) => Boolean(match.score))
      .slice(0, 8)
      .map((match) => ({
        id: match.id,
        poolName: pool.name,
        scoreLabel: `${match.score?.team1Games}-${match.score?.team2Games}`,
        label: `${match.team1Player1.name} & ${match.team1Player2.name} vs ${match.team2Player1.name} & ${match.team2Player2.name}`,
      })),
  );

  return (
    <div className="space-y-6">
      {isAdmin ? <DashboardStats stats={stats} /> : null}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <SectionCard
          title="Actieve poules"
          description="Overzicht van voortgang per poule op basis van gespeelde wedstrijden."
        >
          {poolProgress.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {poolProgress.map(({ pool, playedMatches, totalMatches, matchesPerPlayer }) => (
                <article key={pool.id} className="ui-card-subtle rounded-3xl p-4">
                  <h3 className="font-semibold text-app-foreground">{pool.name}</h3>
                  <p className="mt-1 text-sm text-app-muted">
                    {pool.members.length}/{pool.size} spelers · {playedMatches}/{totalMatches} dubbelwedstrijden gespeeld
                  </p>
                  <p className="mt-1 text-xs text-app-muted">Iedere speler speelt {matchesPerPlayer} wedstrijden in deze poule.</p>
                  <p className="mt-2 text-xs text-app-muted">
                    {totalMatches ? `${Math.round((playedMatches / totalMatches) * 100)}% voortgang` : "Nog geen wedstrijden"}
                  </p>
                  {pool.members.length === 4 ? (
                    <p className="mt-1 text-xs text-app-muted">Met 4 spelers zijn er in het huidige dubbelschema in totaal 3 wedstrijden.</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={isAdmin ? "Geen actieve poules" : "Geen actieve poules voor jou"}
              description={isAdmin
                ? "Maak eerst een poule aan of herstel een poule vanuit het archief."
                : "Je bent momenteel nog niet ingedeeld in een actieve poule."}
            />
          )}
        </SectionCard>
        <SectionCard
          title={isAdmin ? "Eerstvolgende acties" : "Gespeelde wedstrijden"}
          description={isAdmin
            ? "Openstaande wedstrijden zonder score krijgen hier prioriteit."
            : "Recente resultaten van gespeelde wedstrijden per poule."}
        >
          {(isAdmin ? upcomingMatches : playedMatches).length ? (
            <div className="space-y-3">
              {(isAdmin ? upcomingMatches : playedMatches).map((match) => (
                <div key={match.id} className="ui-card-subtle rounded-3xl p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-app-accent">{match.poolName}</p>
                  <p className="mt-2 text-sm text-app-foreground">{match.label}</p>
                  {!isAdmin && match.scoreLabel ? (
                    <p className="mt-2 text-xs text-app-muted">Score: {match.scoreLabel}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={isAdmin ? "Geen openstaande wedstrijden" : "Nog geen gespeelde wedstrijden"}
              description={isAdmin
                ? "Alle gegenereerde wedstrijden hebben al een score of er zijn nog geen poules actief."
                : "Er zijn nog geen resultaten ingevuld voor de actieve poules."}
            />
          )}
        </SectionCard>
      </div>
      {isAdmin ? (
        <SectionCard
          title="Archief en klassement"
          description="Bewaar oude poules en bekijk hun eindstand naast de actuele klassementen."
        >
          <div className="mb-4 flex flex-wrap gap-2 text-sm text-app-muted">
            <span className="rounded-full border border-app px-3 py-1">
              {archivedPools.length} gearchiveerde poules
            </span>
            <span className="rounded-full border border-app px-3 py-1">
              Sorteer op punten, saldo, gewonnen spelletjes
            </span>
          </div>
          <RankingsBoard
            pools={rankingsByPool.map(({ pool, rankings }) => ({
              pool: { id: pool.id, name: pool.name, status: pool.status },
              rankings,
            }))}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

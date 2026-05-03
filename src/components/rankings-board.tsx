import Image from "next/image";
import { EmptyState } from "@/components/empty-state";

type RankingEntry = {
  id: string;
  name: string;
  photoUrl?: string | null;
  points: number;
  matchesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
};

type RankingPool = {
  pool: {
    id: string;
    name: string;
    status: string;
  };
  rankings: RankingEntry[];
};

export function RankingsBoard({ pools }: { pools: RankingPool[] }) {
  if (!pools.length) {
    return (
      <EmptyState
        title="Nog geen klassementen"
        description="Zodra een poule spelers en scores bevat, verschijnt hier automatisch het klassement."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pools.map(({ pool, rankings }) => (
        <article key={pool.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <h3 className="text-lg font-semibold text-white">{pool.name}</h3>
            <p className="text-sm text-slate-300">Status: {pool.status.toLowerCase()}</p>
          </div>
          {rankings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">#</th>
                    <th className="px-4 py-3 sm:px-6">Speler</th>
                    <th className="px-4 py-3 sm:px-6">Punten</th>
                    <th className="px-4 py-3 sm:px-6">Wed.</th>
                    <th className="px-4 py-3 sm:px-6">Gew.</th>
                    <th className="px-4 py-3 sm:px-6">Verl.</th>
                    <th className="px-4 py-3 sm:px-6">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry, index) => (
                    <tr key={entry.id} className="border-t border-white/5 text-slate-100">
                      <td className="px-4 py-3 font-semibold sm:px-6">{index + 1}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-slate-900/60 sm:h-8 sm:w-8 md:h-9 md:w-9">
                            <Image
                              src={entry.photoUrl || "/default-head-perspective.svg"}
                              alt={entry.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <span>{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6">{entry.points}</td>
                      <td className="px-4 py-3 sm:px-6">{entry.matchesPlayed}</td>
                      <td className="px-4 py-3 sm:px-6">{entry.gamesWon}</td>
                      <td className="px-4 py-3 sm:px-6">{entry.gamesLost}</td>
                      <td className="px-4 py-3 sm:px-6">{entry.gameDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="Nog geen resultaten"
                description="Vul scores in om punten en spelletjessaldo automatisch te berekenen."
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

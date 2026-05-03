"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { EmptyState } from "@/components/empty-state";
import { useRoleStore } from "@/store/use-role-store";

type PlayerRecord = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

type MatchRecord = {
  id: string;
  order: number;
  team1Player1: PlayerRecord;
  team1Player2: PlayerRecord;
  team2Player1: PlayerRecord;
  team2Player2: PlayerRecord;
  score: {
    team1Games: number;
    team2Games: number;
  } | null;
};

type MatchPoolRecord = {
  id: string;
  name: string;
  matches: MatchRecord[];
};

function PlayerAvatar({ player }: { player: PlayerRecord }) {
  const src = player.photoUrl || "/default-head-perspective.svg";

  return (
    <div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/30 bg-slate-900/60 shadow-[0_0_0_2px_rgba(2,6,23,0.25)] sm:h-8 sm:w-8 md:h-9 md:w-9">
      <Image src={src} alt={player.name} fill className="object-cover" unoptimized />
    </div>
  );
}

function TeamRow({ left, right, inputName, defaultValue, disabled }: {
  left: PlayerRecord;
  right: PlayerRecord;
  inputName: string;
  defaultValue?: number | string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 -space-x-2">
        <div className="relative z-20"><PlayerAvatar player={left} /></div>
        <div className="relative z-10 translate-y-[1px] opacity-95"><PlayerAvatar player={right} /></div>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-app-foreground">
        {left.name} &amp; {right.name}
      </p>
      <input
        name={inputName}
        type="number"
        min={0}
        max={99}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className="ui-input w-14 shrink-0 rounded-xl px-2 py-2.5 text-center text-sm"
      />
    </div>
  );
}

export function MatchesBoard({ pools }: { pools: MatchPoolRecord[] }) {
  const router = useRouter();
  const user = useRoleStore((state) => state.user);
  const role = useRoleStore((state) => state.role);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [editingPlayedMatchId, setEditingPlayedMatchId] = useState<string | null>(null);

  function compactName(name: string) {
    const [firstPart] = name.trim().split(/\s+/);
    return firstPart || name;
  }

  function compactMatchLabel(match: MatchRecord) {
    return `${compactName(match.team1Player1.name)} & ${compactName(match.team1Player2.name)} vs ${compactName(match.team2Player1.name)} & ${compactName(match.team2Player2.name)}`;
  }

  function canEditMatch(match: MatchRecord): boolean {
    if (!user) return false;
    if (user.role === "ADMIN" || user.role === "MATCH_MANAGER") return true;
    if (user.personId) {
      const playerIds = [match.team1Player1.id, match.team1Player2.id, match.team2Player1.id, match.team2Player2.id];
      return playerIds.includes(user.personId);
    }
    return false;
  }

  async function submitScore(matchId: string, formData: FormData) {
    setPendingMatchId(matchId);

    try {
      await apiFetch(`/api/matches/${matchId}/score`, role, {
        method: "POST",
        body: JSON.stringify({
          team1Games: Number(formData.get("team1Games")),
          team2Games: Number(formData.get("team2Games")),
        }),
      }, user?.id);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Score opslaan mislukt.");
    } finally {
      setPendingMatchId(null);
    }
  }

  const totalMatches = pools.reduce((sum, pool) => sum + pool.matches.length, 0);

  if (!totalMatches) {
    return (
      <EmptyState
        title="Nog geen wedstrijden"
        description="Genereer eerst wedstrijden in een poule om scores te kunnen invoeren."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pools.map((pool) => (
        <article key={pool.id} className="ui-card rounded-3xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-app-foreground">{pool.name}</h3>
            <p className="text-sm text-app-muted">
              {pool.matches.filter((match) => Boolean(match.score)).length}/{pool.matches.length} dubbelwedstrijden gespeeld
            </p>
            {pool.matches.length === 3 ? (
              <p className="mt-1 text-xs text-app-muted">Bij 4 spelers resulteert dit schema in 3 unieke dubbelwedstrijden.</p>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-app-muted">Nog te spelen</p>
              {pool.matches.filter((match) => !match.score).length ? pool.matches
                .filter((match) => !match.score)
                .map((match) => (
              <form
                key={match.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitScore(match.id, new FormData(event.currentTarget));
                }}
                className="ui-card-subtle rounded-3xl p-4"
              >
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-app-muted">Wedstrijd {match.order}</p>
                <div className="space-y-1.5">
                  <TeamRow
                    left={match.team1Player1}
                    right={match.team1Player2}
                    inputName="team1Games"
                    defaultValue={match.score?.team1Games}
                    disabled={pendingMatchId === match.id || !canEditMatch(match)}
                  />
                  <div className="flex justify-end pr-1">
                    <span className="w-14 text-center text-xs text-app-muted">–</span>
                  </div>
                  <TeamRow
                    left={match.team2Player1}
                    right={match.team2Player2}
                    inputName="team2Games"
                    defaultValue={match.score?.team2Games}
                    disabled={pendingMatchId === match.id || !canEditMatch(match)}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={pendingMatchId === match.id || !canEditMatch(match)}
                    className="ui-button-primary rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed"
                  >
                    {!canEditMatch(match)
                      ? "Alleen kijken"
                      : pendingMatchId === match.id
                        ? "Opslaan..."
                        : "Score bewaren"}
                  </button>
                </div>
              </form>
            )) : (
              <p className="text-sm text-app-muted">Alle wedstrijden in deze poule zijn al gespeeld.</p>
            )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-app-muted">Gespeeld</p>
              {pool.matches.filter((match) => Boolean(match.score)).length ? pool.matches
                .filter((match) => Boolean(match.score))
                .map((match) => {
                  const canEdit = canEditMatch(match);

                  return (
                  <form
                    key={match.id}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitScore(match.id, new FormData(event.currentTarget));
                      setEditingPlayedMatchId(null);
                    }}
                    onBlur={(event) => {
                      if (editingPlayedMatchId !== match.id || !canEdit) {
                        return;
                      }

                      const nextTarget = event.relatedTarget as Node | null;
                      if (nextTarget && event.currentTarget.contains(nextTarget)) {
                        return;
                      }

                      setEditingPlayedMatchId(null);
                      void submitScore(match.id, new FormData(event.currentTarget));
                    }}
                    className="ui-card-subtle rounded-2xl p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <p className="min-w-0 flex-1 text-xs leading-tight text-app-foreground sm:text-sm">
                        <span className="mr-1.5 text-app-muted">W{match.order}</span>
                        {compactMatchLabel(match)}
                      </p>
                      {editingPlayedMatchId === match.id && canEdit ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <input
                            name="team1Games"
                            type="number"
                            min={0}
                            max={99}
                            defaultValue={match.score?.team1Games ?? ""}
                            disabled={pendingMatchId === match.id}
                            autoFocus
                            className="ui-input h-8 w-10 rounded-xl px-1.5 text-center text-xs sm:h-9 sm:w-12 sm:text-sm"
                          />
                          <span className="text-xs text-app-muted sm:text-sm">-</span>
                          <input
                            name="team2Games"
                            type="number"
                            min={0}
                            max={99}
                            defaultValue={match.score?.team2Games ?? ""}
                            disabled={pendingMatchId === match.id}
                            className="ui-input h-8 w-10 rounded-xl px-1.5 text-center text-xs sm:h-9 sm:w-12 sm:text-sm"
                          />
                        </div>
                      ) : canEdit ? (
                        <button
                          type="button"
                          onClick={() => setEditingPlayedMatchId(match.id)}
                          disabled={pendingMatchId === match.id}
                          className="ui-button-ghost shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed"
                          aria-label={`Score aanpassen voor wedstrijd ${match.order}`}
                        >
                          {pendingMatchId === match.id
                            ? "..."
                            : `${match.score?.team1Games ?? "-"} - ${match.score?.team2Games ?? "-"}`}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-xl border border-app px-2.5 py-1.5 text-xs font-semibold text-app-foreground">
                          {`${match.score?.team1Games ?? "-"} - ${match.score?.team2Games ?? "-"}`}
                        </span>
                      )}
                    </div>
                  </form>
                )}) : (
                <p className="text-sm text-app-muted">Nog geen scores ingevuld.</p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { EmptyState } from "@/components/empty-state";
import {
  calculateCompetitionMatches,
  findFirstFeasibleDuoTarget,
  isShortCompetitionFeasible,
} from "@/lib/schedule";
import { formatPoolStatus } from "@/lib/utils";
import { useRoleStore } from "@/store/use-role-store";

type PersonOption = {
  id: string;
  name: string;
};

type PoolRecord = {
  id: string;
  name: string;
  size: number;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  competitionFormat?: "FULL" | "SHORT";
  duoTarget?: number;
  members: Array<{
    person: PersonOption;
  }>;
  matches: Array<{
    id: string;
    score: { team1Games: number; team2Games: number } | null;
  }>;
};

export function PoolsBoard({ pools, persons }: { pools: PoolRecord[]; persons: PersonOption[] }) {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const [busyPoolId, setBusyPoolId] = useState<string | null>(null);
  const [duoTargetDrafts, setDuoTargetDrafts] = useState<Record<string, string>>({});

  const personNames = useMemo(
    () => new Map(persons.map((person) => [person.id, person.name])),
    [persons],
  );

  async function mutatePool(poolId: string, action: "generate" | "reset" | "archive") {
    setBusyPoolId(poolId);
    try {
      await apiFetch(`/api/pools/${poolId}/${action}`, role, { method: "POST" });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Actie mislukt.");
    } finally {
      setBusyPoolId(null);
    }
  }

  async function updateMembers(poolId: string, selectedPersonIds: string[], pool: PoolRecord) {
    setBusyPoolId(poolId);
    const competitionFormat = pool.competitionFormat ?? "FULL";
    const currentTarget = Number.isFinite(pool.duoTarget) ? Number(pool.duoTarget) : 1;
    const playerCount = selectedPersonIds.length;
    const duoTarget = competitionFormat === "SHORT"
      ? (isShortCompetitionFeasible(playerCount, currentTarget)
        ? currentTarget
        : (findFirstFeasibleDuoTarget(playerCount) ?? currentTarget))
      : currentTarget;

    try {
      await apiFetch(`/api/pools/${poolId}`, role, {
        method: "PATCH",
        body: JSON.stringify({
          name: pool.name,
          size: pool.size,
          competitionFormat,
          duoTarget,
          personIds: selectedPersonIds,
        }),
      });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setBusyPoolId(null);
    }
  }

  async function updateCompetitionSettings(
    pool: PoolRecord,
    next: { competitionFormat?: "FULL" | "SHORT"; duoTarget?: number },
  ) {
    const selectedPersonIds = pool.members.map((member) => member.person.id);
    const competitionFormat = next.competitionFormat ?? pool.competitionFormat ?? "FULL";
    const rawTarget = Number.isFinite(next.duoTarget)
      ? Number(next.duoTarget)
      : Number.isFinite(pool.duoTarget)
        ? Number(pool.duoTarget)
        : 1;
    const duoTarget = competitionFormat === "SHORT"
      ? (isShortCompetitionFeasible(selectedPersonIds.length, rawTarget)
        ? rawTarget
        : (findFirstFeasibleDuoTarget(selectedPersonIds.length) ?? rawTarget))
      : rawTarget;

    setBusyPoolId(pool.id);
    try {
      await apiFetch(`/api/pools/${pool.id}`, role, {
        method: "PATCH",
        body: JSON.stringify({
          name: pool.name,
          size: pool.size,
          competitionFormat,
          duoTarget,
          personIds: selectedPersonIds,
        }),
      });
      setDuoTargetDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[pool.id];
        return nextDrafts;
      });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setBusyPoolId(null);
    }
  }

  async function commitDuoTarget(pool: PoolRecord, rawValue: string) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setDuoTargetDrafts((current) => ({
        ...current,
        [pool.id]: String(Number.isFinite(pool.duoTarget) ? Number(pool.duoTarget) : 1),
      }));
      return;
    }

    await updateCompetitionSettings(pool, { duoTarget: parsed });
  }

  async function deletePool(poolId: string) {
    const confirmed = window.confirm("Weet je zeker dat je deze poule wilt verwijderen? Alle gekoppelde wedstrijden en scores worden ook verwijderd.");
    if (!confirmed) {
      return;
    }

    setBusyPoolId(poolId);
    try {
      await apiFetch<void>(`/api/pools/${poolId}`, role, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Verwijderen mislukt.");
    } finally {
      setBusyPoolId(null);
    }
  }

  if (!pools.length) {
    return (
      <EmptyState
        title="Nog geen poules"
        description="Maak een poule aan en koppel spelers om automatisch wedstrijden te genereren."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {pools.map((pool) => {
        const selectedPersonIds = pool.members.map((member) => member.person.id);
        const scoredMatches = pool.matches.filter((match) => match.score).length;
        const competitionFormat = pool.competitionFormat ?? "FULL";
        const duoTarget = Number.isFinite(pool.duoTarget) ? Number(pool.duoTarget) : 1;
        const duoTargetValue = duoTargetDrafts[pool.id] ?? String(duoTarget);
        const playerCountForSchedule = selectedPersonIds.length;
        const expectedMatches = calculateCompetitionMatches(
          playerCountForSchedule,
          competitionFormat,
          duoTarget,
        );
        const shortFeasible =
          competitionFormat === "FULL" || isShortCompetitionFeasible(playerCountForSchedule, duoTarget);

        return (
          <article key={pool.id} className="ui-card rounded-3xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-app-foreground">{pool.name}</h3>
                <p className="text-app-muted text-sm">
                  {selectedPersonIds.length}/{pool.size} spelers · {formatPoolStatus(pool.status)}
                </p>
                <p className="text-app-muted text-xs">
                  {pool.matches.length} wedstrijden · {scoredMatches} met score
                </p>
                <p className="text-app-muted text-xs">
                  {competitionFormat === "FULL"
                    ? "Vorm: volledige competitie"
                    : `Vorm: verkort · duo minstens ${duoTarget}x samen`}
                </p>
                <p className="text-app-muted text-xs">
                  {expectedMatches !== null
                    ? `Verwacht totaal bij ${playerCountForSchedule} spelers: ${expectedMatches} wedstrijden`
                    : "Deze verkorte duo-instelling is niet mogelijk met het huidige aantal spelers."}
                </p>
                {competitionFormat === "SHORT" && !shortFeasible ? (
                  <p className="text-xs" style={{ color: "var(--warning)" }}>
                    Stel een geldige duo-waarde in. Suggestie: {findFirstFeasibleDuoTarget(playerCountForSchedule) ?? "niet beschikbaar"}.
                  </p>
                ) : null}
              </div>
              <div className="ui-badge-success rounded-full px-3 py-1 text-xs font-medium">
                {pool.status === "ARCHIVED" ? "Archief" : "Actueel"}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="text-app-muted grid gap-1 text-xs">
                <span>Competitievorm</span>
                <select
                  value={competitionFormat}
                  disabled={role !== "admin" || busyPoolId === pool.id}
                  onChange={(event) => {
                    const nextFormat = event.target.value as "FULL" | "SHORT";
                    void updateCompetitionSettings(pool, { competitionFormat: nextFormat });
                  }}
                  className="ui-input ui-select rounded-xl px-3 py-2 text-sm"
                >
                  <option value="FULL">Volledige competitie</option>
                  <option value="SHORT">Verkorte competitie</option>
                </select>
              </label>
              <label className="text-app-muted grid gap-1 text-xs">
                <span>Duo minstens samen</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={duoTargetValue}
                  disabled={role !== "admin" || busyPoolId === pool.id || competitionFormat !== "SHORT"}
                  onChange={(event) => {
                    setDuoTargetDrafts((current) => ({
                      ...current,
                      [pool.id]: event.target.value,
                    }));
                  }}
                  onBlur={() => {
                    void commitDuoTarget(pool, duoTargetValue);
                  }}
                  className="ui-input rounded-xl px-3 py-2 text-sm disabled:opacity-60"
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-app-foreground text-sm font-medium">Spelers in poule</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {persons.map((person) => {
                  const checked = selectedPersonIds.includes(person.id);
                  return (
                    <label
                      key={person.id}
                      className="ui-card-subtle flex items-center gap-3 rounded-2xl px-3 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={checked}
                        disabled={role !== "admin" || busyPoolId === pool.id}
                        onChange={(event) => {
                          const nextIds = event.target.checked
                            ? [...selectedPersonIds, person.id]
                            : selectedPersonIds.filter((id) => id !== person.id);
                          void updateMembers(pool.id, nextIds, pool);
                        }}
                      />
                      <span>{personNames.get(person.id) ?? person.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => mutatePool(pool.id, "generate")}
                disabled={role !== "admin" || busyPoolId === pool.id || selectedPersonIds.length < 4 || !shortFeasible}
                className="ui-button-primary rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed"
              >
                Wedstrijden genereren
              </button>
              <button
                type="button"
                onClick={() => mutatePool(pool.id, "reset")}
                disabled={role !== "admin" || busyPoolId === pool.id || !pool.matches.length}
                className="ui-button-warning rounded-2xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resetten
              </button>
              <button
                type="button"
                onClick={() => mutatePool(pool.id, "archive")}
                disabled={role !== "admin" || busyPoolId === pool.id || pool.status === "ARCHIVED"}
                className="ui-button-neutral rounded-2xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Archiveren
              </button>
              <button
                type="button"
                onClick={() => {
                  void deletePool(pool.id);
                }}
                disabled={role !== "admin" || busyPoolId === pool.id}
                className="ui-button-danger rounded-2xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Verwijderen
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

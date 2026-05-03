"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import {
  calculateCompetitionMatches,
  findFirstFeasibleDuoTarget,
  isShortCompetitionFeasible,
} from "@/lib/schedule";
import { useRoleStore } from "@/store/use-role-store";

export function PoolForm() {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const [name, setName] = useState("");
  const [size, setSize] = useState(4);
  const [competitionFormat, setCompetitionFormat] = useState<"FULL" | "SHORT">("FULL");
  const [duoTargetInput, setDuoTargetInput] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const disabled = role !== "admin";
  const duoTarget = Math.max(1, Number(duoTargetInput) || 1);
  const matchCount = calculateCompetitionMatches(size, competitionFormat, duoTarget);
  const shortFeasible = competitionFormat === "FULL" || isShortCompetitionFeasible(size, duoTarget);

  useEffect(() => {
    if (competitionFormat !== "SHORT") {
      return;
    }

    if (isShortCompetitionFeasible(size, duoTarget)) {
      return;
    }

    const suggested = findFirstFeasibleDuoTarget(size);
    if (suggested !== null) {
      setDuoTargetInput(String(suggested));
    }
  }, [competitionFormat, size]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await apiFetch("/api/pools", role, {
        method: "POST",
        body: JSON.stringify({
          name,
          size,
          competitionFormat,
          duoTarget,
          personIds: [],
        }),
      });
      setName("");
      setSize(4);
      setCompetitionFormat("FULL");
      setDuoTargetInput("1");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Opslaan mislukt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Poulenaam</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="ui-input rounded-2xl px-4 py-3"
            placeholder="Bijv. Poule A"
            disabled={disabled || pending}
            required
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Aantal spelers</span>
          <input
            type="number"
            min={4}
            max={24}
            step={1}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="ui-input rounded-2xl px-4 py-3"
            disabled={disabled || pending}
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Competitievorm</span>
          <select
            value={competitionFormat}
            onChange={(event) => {
              const nextFormat = event.target.value as "FULL" | "SHORT";
              setCompetitionFormat(nextFormat);

              if (nextFormat === "SHORT") {
                const suggested = findFirstFeasibleDuoTarget(size);
                if (suggested !== null) {
                  setDuoTargetInput(String(suggested));
                }
              }
            }}
            className="ui-input ui-select rounded-2xl px-4 py-3"
            disabled={disabled || pending}
          >
            <option value="FULL">Volledige competitie (alle combinaties)</option>
            <option value="SHORT">Verkorte competitie</option>
          </select>
        </label>

        {competitionFormat === "SHORT" ? (
          <label className="grid gap-2 text-sm">
            <span>Duo minstens samen</span>
            <input
              type="number"
              min={1}
              max={12}
              step={1}
              value={duoTargetInput}
              onChange={(event) => setDuoTargetInput(event.target.value)}
              className="ui-input rounded-2xl px-4 py-3"
              disabled={disabled || pending}
              required
            />
          </label>
        ) : (
          <div className="ui-note rounded-2xl px-4 py-3 text-sm">
            Bij volledige competitie speelt elk duo alle mogelijke combinaties.
          </div>
        )}
      </div>

      <div className="ui-note rounded-2xl px-4 py-3 text-sm text-app-foreground">
        {matchCount !== null
          ? `Verwacht totaal: ${matchCount} wedstrijden bij ${size} spelers.`
          : "Deze verkorte instelling is niet mogelijk met dit aantal spelers. Kies een andere duo-waarde."}
      </div>

      <button
        type="submit"
        disabled={disabled || pending || !shortFeasible}
        className="ui-button-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed"
      >
        {disabled ? "Alleen admin" : pending ? "Aanmaken..." : "Poule maken"}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
